import { Hono } from 'hono'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/db'
import { cleaningRequests, properties } from '@/db/schema'
import { authMiddleware, type AuthEnv } from '../middleware/auth'
import { calculateCleaningPrice, FIRST_CLEANING_DISCOUNT } from '@/lib/cleaning-pricing'

const CleaningRequestSchema = z.object({
  propertyId: z.string().uuid(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  memo: z.string().optional(),
  isUrgent: z.boolean().default(false),
})

const ConfirmPaymentSchema = z.object({
  paymentKey: z.string(),
  orderId: z.string(),
  amount: z.number(),
})

export const cleaningRoutes = new Hono<AuthEnv>()

cleaningRoutes.use('*', authMiddleware)

// List cleaning requests for the user
cleaningRoutes.get('/', async (c) => {
  const userId = c.get('userId')

  const result = await db
    .select({
      id: cleaningRequests.id,
      propertyId: cleaningRequests.propertyId,
      hostId: cleaningRequests.hostId,
      cleaningType: cleaningRequests.cleaningType,
      status: cleaningRequests.status,
      scheduledDate: cleaningRequests.scheduledDate,
      scheduledTime: cleaningRequests.scheduledTime,
      memo: cleaningRequests.memo,
      price: cleaningRequests.price,
      discount: cleaningRequests.discount,
      finalPrice: cleaningRequests.finalPrice,
      orderId: cleaningRequests.orderId,
      paymentKey: cleaningRequests.paymentKey,
      createdAt: cleaningRequests.createdAt,
      propertyName: properties.name,
      propertyAddress: properties.address,
    })
    .from(cleaningRequests)
    .leftJoin(properties, eq(cleaningRequests.propertyId, properties.id))
    .where(eq(cleaningRequests.hostId, userId))
    .orderBy(desc(cleaningRequests.createdAt))

  return c.json(result)
})

// Get single cleaning request
cleaningRoutes.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const [request] = await db
    .select()
    .from(cleaningRequests)
    .where(and(eq(cleaningRequests.id, id), eq(cleaningRequests.hostId, userId)))
    .limit(1)

  if (!request) {
    return c.json({ error: '청소 요청을 찾을 수 없어요' }, 404)
  }

  return c.json(request)
})

// Create cleaning request (pending_payment)
cleaningRoutes.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const validated = CleaningRequestSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const { propertyId, scheduledDate, scheduledTime, memo, isUrgent } = validated.data

  // Verify property ownership
  const [property] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.id, propertyId), eq(properties.hostId, userId)))
    .limit(1)

  if (!property) {
    return c.json({ error: '숙소를 찾을 수 없어요' }, 404)
  }

  if (!property.pyeong) {
    return c.json({ error: '숙소 면적 정보가 필요해요' }, 400)
  }

  // Calculate price
  const priceResult = calculateCleaningPrice({
    pyeong: property.pyeong,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    isUrgent,
  })

  // Check if first cleaning
  const existingRequests = await db
    .select({ id: cleaningRequests.id })
    .from(cleaningRequests)
    .where(eq(cleaningRequests.hostId, userId))
    .limit(1)

  const isFirstCleaning = existingRequests.length === 0
  const discount = isFirstCleaning ? FIRST_CLEANING_DISCOUNT : 0
  const finalPrice = Math.max(priceResult.total - discount, 0)

  // Generate orderId for TossPayments (6-64 chars, [A-Za-z0-9\-_=])
  const timestamp = Date.now()
  const orderId = `bnb-${crypto.randomUUID().slice(0, 8)}-${timestamp}`

  const [created] = await db
    .insert(cleaningRequests)
    .values({
      propertyId,
      hostId: userId,
      cleaningType: isUrgent ? 'urgent' : 'standard',
      status: 'pending_payment',
      scheduledDate,
      scheduledTime,
      memo: memo || null,
      price: priceResult.total,
      discount,
      finalPrice,
      orderId,
    })
    .returning()

  return c.json(created, 201)
})

// Confirm payment (called from success page)
cleaningRoutes.post('/confirm', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const validated = ConfirmPaymentSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const { paymentKey, orderId, amount } = validated.data

  // Find the cleaning request
  const [request] = await db
    .select()
    .from(cleaningRequests)
    .where(and(
      eq(cleaningRequests.orderId, orderId),
      eq(cleaningRequests.hostId, userId),
    ))
    .limit(1)

  if (!request) {
    return c.json({ error: '주문을 찾을 수 없어요' }, 404)
  }

  // Idempotent: already confirmed
  if (request.status === 'pending' && request.paymentKey) {
    return c.json(request)
  }

  if (request.status !== 'pending_payment') {
    return c.json({ error: '결제할 수 없는 상태에요' }, 400)
  }

  // Validate amount matches
  if (amount !== request.finalPrice) {
    return c.json({ error: '결제 금액이 일치하지 않아요' }, 400)
  }

  // Call TossPayments confirm API
  const secretKey = process.env.TOSS_SECRET_KEY
  if (!secretKey) {
    return c.json({ error: '결제 설정 오류' }, 500)
  }

  const authHeader = `Basic ${Buffer.from(secretKey + ':').toString('base64')}`

  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  })

  if (!tossRes.ok) {
    const tossError = await tossRes.json()
    return c.json({
      error: tossError.message || '결제 승인에 실패했어요',
      code: tossError.code,
    }, tossRes.status as 400 | 401 | 403 | 404 | 500)
  }

  // Update cleaning request
  const [updated] = await db
    .update(cleaningRequests)
    .set({
      status: 'pending',
      paymentKey,
      updatedAt: new Date(),
    })
    .where(eq(cleaningRequests.id, request.id))
    .returning()

  // Fetch property info for the response
  const [property] = await db
    .select({
      name: properties.name,
      address: properties.address,
      addressDetail: properties.addressDetail,
      pyeong: properties.pyeong,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms,
    })
    .from(properties)
    .where(eq(properties.id, request.propertyId))
    .limit(1)

  return c.json({ ...updated, property: property || null })
})

// Cancel cleaning request
cleaningRoutes.post('/:id/cancel', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const [request] = await db
    .select()
    .from(cleaningRequests)
    .where(and(eq(cleaningRequests.id, id), eq(cleaningRequests.hostId, userId)))
    .limit(1)

  if (!request) {
    return c.json({ error: '요청을 찾을 수 없어요' }, 404)
  }

  if (request.status !== 'pending' && request.status !== 'pending_payment') {
    return c.json({ error: '취소할 수 없는 요청이에요' }, 400)
  }

  const [updated] = await db
    .update(cleaningRequests)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(cleaningRequests.id, id))
    .returning()

  return c.json(updated)
})
