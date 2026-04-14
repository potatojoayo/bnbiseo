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

export const cleaningRoutes = new Hono<AuthEnv>()

cleaningRoutes.use('*', authMiddleware)

// List cleaning requests for the user
cleaningRoutes.get('/', async (c) => {
  const userId = c.get('userId')

  const result = await db
    .select()
    .from(cleaningRequests)
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

// Create cleaning request
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

  const [created] = await db
    .insert(cleaningRequests)
    .values({
      propertyId,
      hostId: userId,
      cleaningType: isUrgent ? 'urgent' : 'standard',
      scheduledDate,
      scheduledTime,
      memo: memo || null,
      price: priceResult.total,
      discount,
      finalPrice,
    })
    .returning()

  return c.json(created, 201)
})

// Cancel cleaning request
cleaningRoutes.post('/:id/cancel', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const [updated] = await db
    .update(cleaningRequests)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(
      eq(cleaningRequests.id, id),
      eq(cleaningRequests.hostId, userId),
      eq(cleaningRequests.status, 'pending'),
    ))
    .returning()

  if (!updated) {
    return c.json({ error: '취소할 수 없는 요청이에요' }, 400)
  }

  return c.json(updated)
})
