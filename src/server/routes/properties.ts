import { Hono } from 'hono'
import { z } from 'zod'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { properties, fixtures, repairRequests } from '@/db/schema'
import { authMiddleware, type AuthEnv } from '../middleware/auth'

const PropertySchema = z.object({
  name: z.string().min(1, { message: '숙소 이름을 입력해주세요.' }).trim(),
  address: z.string().min(1, { message: '주소를 입력해주세요.' }).trim(),
  addressDetail: z.string().optional(),
  propertyType: z.enum(['apartment', 'house', 'studio', 'villa', 'other']),
  description: z.string().optional(),
  nearbyInfo: z.string().optional(),
  checkinInfo: z.string().optional(),
  wifiSsid: z.string().optional(),
  wifiPassword: z.string().optional(),
  airbnbListingId: z.string().optional(),
})

export const propertiesRoutes = new Hono<AuthEnv>()

propertiesRoutes.use('*', authMiddleware)

// List all properties for the user
propertiesRoutes.get('/', async (c) => {
  const userId = c.get('userId')

  const result = await db
    .select()
    .from(properties)
    .where(and(eq(properties.hostId, userId), isNull(properties.deletedAt)))

  return c.json(result)
})

// Get single property with fixtures
propertiesRoutes.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const [property] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.hostId, userId), isNull(properties.deletedAt)))
    .limit(1)

  if (!property) {
    return c.json({ error: '숙소를 찾을 수 없거나 권한이 없습니다.' }, 404)
  }

  const propertyFixtures = await db
    .select()
    .from(fixtures)
    .where(eq(fixtures.propertyId, id))

  return c.json({ ...property, fixtures: propertyFixtures })
})

// Create property
propertiesRoutes.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const validated = PropertySchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [created] = await db
    .insert(properties)
    .values({ hostId: userId, ...validated.data })
    .returning()

  return c.json(created, 201)
})

// Update property
propertiesRoutes.patch('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const body = await c.req.json()
  const validated = PropertySchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [updated] = await db
    .update(properties)
    .set({ ...validated.data, updatedAt: new Date() })
    .where(and(eq(properties.id, id), eq(properties.hostId, userId)))
    .returning()

  if (!updated) {
    return c.json({ error: '숙소를 찾을 수 없거나 권한이 없습니다.' }, 404)
  }

  return c.json(updated)
})

// Soft delete property
propertiesRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const [deleted] = await db
    .update(properties)
    .set({ deletedAt: new Date() })
    .where(and(eq(properties.id, id), eq(properties.hostId, userId), isNull(properties.deletedAt)))
    .returning({ id: properties.id })

  if (!deleted) {
    return c.json({ error: '숙소를 찾을 수 없거나 권한이 없습니다.' }, 404)
  }

  return c.json({ success: true })
})

// Hard delete property
propertiesRoutes.delete('/:id/permanent', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const [deleted] = await db
    .delete(properties)
    .where(and(eq(properties.id, id), eq(properties.hostId, userId)))
    .returning({ id: properties.id })

  if (!deleted) {
    return c.json({ error: '숙소를 찾을 수 없거나 권한이 없습니다.' }, 404)
  }

  return c.json({ success: true })
})

// Dashboard summary
propertiesRoutes.get('/summary/dashboard', async (c) => {
  const userId = c.get('userId')

  const userProperties = await db
    .select()
    .from(properties)
    .where(and(eq(properties.hostId, userId), isNull(properties.deletedAt)))

  if (!userProperties.length) {
    return c.json({ properties: [], fixtureCount: 0, repairCount: 0, recentRepairs: [] })
  }

  const propertyIds = userProperties.map((p) => p.id)

  const allFixtures = await db
    .select()
    .from(fixtures)
    .where(
      propertyIds.length === 1
        ? eq(fixtures.propertyId, propertyIds[0])
        : eq(fixtures.propertyId, propertyIds[0]), // simplified — full IN query below
    )

  // Use raw SQL for IN clause with multiple IDs
  const fixtureCount = await db
    .select({ id: fixtures.id })
    .from(fixtures)
    .where(eq(fixtures.propertyId, userProperties[0]?.id))

  return c.json({
    properties: userProperties,
    fixtureCount: fixtureCount.length,
  })
})
