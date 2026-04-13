import { Hono } from 'hono'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { fixtures, fixturePhotos, properties } from '@/db/schema'
import { authMiddleware, type AuthEnv } from '../middleware/auth'

const FixtureSchema = z.object({
  propertyId: z.string().uuid(),
  category: z.enum([
    'lighting', 'faucet', 'boiler', 'appliance', 'lock',
    'ac', 'washer', 'dryer', 'vent', 'other',
  ]),
  name: z.string().min(1, { message: '시설물 이름을 입력해주세요.' }).trim(),
  location: z.string().min(1, { message: '위치를 입력해주세요.' }).trim(),
  brand: z.string().optional(),
  modelNumber: z.string().optional(),
  specNotes: z.string().optional(),
  installedAt: z.string().optional(),
  notes: z.string().optional(),
  photoPaths: z.array(z.string()).optional(),
})

async function verifyPropertyOwnership(propertyId: string, userId: string) {
  const result = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, propertyId), eq(properties.hostId, userId)))
    .limit(1)
  return result.length > 0
}

export const fixturesRoutes = new Hono<AuthEnv>()

fixturesRoutes.use('*', authMiddleware)

// Get single fixture with photos
fixturesRoutes.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const [fixture] = await db
    .select()
    .from(fixtures)
    .where(eq(fixtures.id, id))
    .limit(1)

  if (!fixture) {
    return c.json({ error: '시설물을 찾을 수 없습니다.' }, 404)
  }

  const owned = await verifyPropertyOwnership(fixture.propertyId, userId)
  if (!owned) {
    return c.json({ error: '권한이 없습니다.' }, 403)
  }

  const photos = await db
    .select()
    .from(fixturePhotos)
    .where(eq(fixturePhotos.fixtureId, id))

  return c.json({ ...fixture, photos })
})

// Create fixture
fixturesRoutes.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const validated = FixtureSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const { propertyId, photoPaths, installedAt, ...rest } = validated.data

  const owned = await verifyPropertyOwnership(propertyId, userId)
  if (!owned) {
    return c.json({ error: '권한이 없습니다.' }, 403)
  }

  const [created] = await db
    .insert(fixtures)
    .values({
      propertyId,
      ...rest,
      installedAt: installedAt || null,
    })
    .returning()

  if (photoPaths?.length) {
    await db.insert(fixturePhotos).values(
      photoPaths.map((path, i) => ({
        fixtureId: created.id,
        storagePath: path,
        sortOrder: i,
      })),
    )
  }

  return c.json(created, 201)
})

// Update fixture
fixturesRoutes.patch('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const body = await c.req.json()

  const [existing] = await db
    .select({ propertyId: fixtures.propertyId })
    .from(fixtures)
    .where(eq(fixtures.id, id))
    .limit(1)

  if (!existing) {
    return c.json({ error: '시설물을 찾을 수 없습니다.' }, 404)
  }

  const owned = await verifyPropertyOwnership(existing.propertyId, userId)
  if (!owned) {
    return c.json({ error: '권한이 없습니다.' }, 403)
  }

  const validated = FixtureSchema.omit({ propertyId: true }).safeParse(body)
  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const { photoPaths, installedAt, ...rest } = validated.data

  const [updated] = await db
    .update(fixtures)
    .set({ ...rest, installedAt: installedAt || null, updatedAt: new Date() })
    .where(eq(fixtures.id, id))
    .returning()

  if (photoPaths?.length) {
    const existingPhotos = await db
      .select({ sortOrder: fixturePhotos.sortOrder })
      .from(fixturePhotos)
      .where(eq(fixturePhotos.fixtureId, id))

    const maxOrder = existingPhotos.length > 0
      ? Math.max(...existingPhotos.map((p) => p.sortOrder ?? 0))
      : -1

    await db.insert(fixturePhotos).values(
      photoPaths.map((path, i) => ({
        fixtureId: id,
        storagePath: path,
        sortOrder: maxOrder + 1 + i,
      })),
    )
  }

  return c.json(updated)
})

// Delete fixture
fixturesRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const [existing] = await db
    .select({ propertyId: fixtures.propertyId })
    .from(fixtures)
    .where(eq(fixtures.id, id))
    .limit(1)

  if (!existing) {
    return c.json({ error: '시설물을 찾을 수 없습니다.' }, 404)
  }

  const owned = await verifyPropertyOwnership(existing.propertyId, userId)
  if (!owned) {
    return c.json({ error: '권한이 없습니다.' }, 403)
  }

  await db.delete(fixtures).where(eq(fixtures.id, id))

  return c.json({ success: true })
})

// Delete fixture photo
fixturesRoutes.delete('/photos/:photoId', async (c) => {
  const userId = c.get('userId')
  const photoId = c.req.param('photoId')

  const [photo] = await db
    .select({ fixtureId: fixturePhotos.fixtureId })
    .from(fixturePhotos)
    .where(eq(fixturePhotos.id, photoId))
    .limit(1)

  if (!photo) {
    return c.json({ error: '사진을 찾을 수 없습니다.' }, 404)
  }

  const [fixture] = await db
    .select({ propertyId: fixtures.propertyId })
    .from(fixtures)
    .where(eq(fixtures.id, photo.fixtureId))
    .limit(1)

  if (!fixture) {
    return c.json({ error: '시설물을 찾을 수 없습니다.' }, 404)
  }

  const owned = await verifyPropertyOwnership(fixture.propertyId, userId)
  if (!owned) {
    return c.json({ error: '권한이 없습니다.' }, 403)
  }

  await db.delete(fixturePhotos).where(eq(fixturePhotos.id, photoId))

  return c.json({ success: true })
})
