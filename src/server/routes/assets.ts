import { Hono } from 'hono'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { propertyAssets, propertyAssetPhotos, properties } from '@/db/schema'
import { authMiddleware, requireProfile, type AuthEnv } from '../middleware/auth'

const AssetSchema = z.object({
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
  photos: z.array(z.object({
    storagePath: z.string().min(1),
    thumbnailStoragePath: z.string().min(1),
  })).optional(),
})

async function verifyPropertyOwnership(propertyId: string, profileId: string) {
  const result = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, propertyId), eq(properties.hostId, profileId)))
    .limit(1)
  return result.length > 0
}

export const assetsRoutes = new Hono<AuthEnv>()

assetsRoutes.use('*', authMiddleware)
assetsRoutes.use('*', requireProfile)

// Get single fixture with photos
assetsRoutes.get('/:id', async (c) => {
  const profileId = c.get('profileId')
  const id = c.req.param('id')

  const [fixture] = await db
    .select()
    .from(propertyAssets)
    .where(eq(propertyAssets.id, id))
    .limit(1)

  if (!fixture) {
    return c.json({ error: '시설물을 찾을 수 없습니다.' }, 404)
  }

  const owned = await verifyPropertyOwnership(fixture.propertyId, profileId)
  if (!owned) {
    return c.json({ error: '권한이 없습니다.' }, 403)
  }

  const photos = await db
    .select()
    .from(propertyAssetPhotos)
    .where(eq(propertyAssetPhotos.fixtureId, id))

  return c.json({ ...fixture, photos })
})

// Create fixture
assetsRoutes.post('/', async (c) => {
  const profileId = c.get('profileId')
  const body = await c.req.json()
  const validated = AssetSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const { propertyId, photos, installedAt, ...rest } = validated.data

  const owned = await verifyPropertyOwnership(propertyId, profileId)
  if (!owned) {
    return c.json({ error: '권한이 없습니다.' }, 403)
  }

  const [created] = await db
    .insert(propertyAssets)
    .values({
      propertyId,
      ...rest,
      installedAt: installedAt || null,
    })
    .returning()

  if (photos?.length) {
    await db.insert(propertyAssetPhotos).values(
      photos.map((photo, i) => ({
        fixtureId: created.id,
        storagePath: photo.storagePath,
        thumbnailStoragePath: photo.thumbnailStoragePath,
        sortOrder: i,
      })),
    )
  }

  return c.json(created, 201)
})

// Update fixture
assetsRoutes.patch('/:id', async (c) => {
  const profileId = c.get('profileId')
  const id = c.req.param('id')
  const body = await c.req.json()

  const [existing] = await db
    .select({ propertyId: propertyAssets.propertyId })
    .from(propertyAssets)
    .where(eq(propertyAssets.id, id))
    .limit(1)

  if (!existing) {
    return c.json({ error: '시설물을 찾을 수 없습니다.' }, 404)
  }

  const owned = await verifyPropertyOwnership(existing.propertyId, profileId)
  if (!owned) {
    return c.json({ error: '권한이 없습니다.' }, 403)
  }

  const validated = AssetSchema.omit({ propertyId: true }).safeParse(body)
  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const { photos, installedAt, ...rest } = validated.data

  const [updated] = await db
    .update(propertyAssets)
    .set({ ...rest, installedAt: installedAt || null, updatedAt: new Date() })
    .where(eq(propertyAssets.id, id))
    .returning()

  if (photos?.length) {
    const existingPhotos = await db
      .select({ sortOrder: propertyAssetPhotos.sortOrder })
      .from(propertyAssetPhotos)
      .where(eq(propertyAssetPhotos.fixtureId, id))

    const maxOrder = existingPhotos.length > 0
      ? Math.max(...existingPhotos.map((p) => p.sortOrder ?? 0))
      : -1

    await db.insert(propertyAssetPhotos).values(
      photos.map((photo, i) => ({
        fixtureId: id,
        storagePath: photo.storagePath,
        thumbnailStoragePath: photo.thumbnailStoragePath,
        sortOrder: maxOrder + 1 + i,
      })),
    )
  }

  return c.json(updated)
})

// Delete fixture
assetsRoutes.delete('/:id', async (c) => {
  const profileId = c.get('profileId')
  const id = c.req.param('id')

  const [existing] = await db
    .select({ propertyId: propertyAssets.propertyId })
    .from(propertyAssets)
    .where(eq(propertyAssets.id, id))
    .limit(1)

  if (!existing) {
    return c.json({ error: '시설물을 찾을 수 없습니다.' }, 404)
  }

  const owned = await verifyPropertyOwnership(existing.propertyId, profileId)
  if (!owned) {
    return c.json({ error: '권한이 없습니다.' }, 403)
  }

  await db.delete(propertyAssets).where(eq(propertyAssets.id, id))

  return c.json({ success: true })
})

// Delete fixture photo
assetsRoutes.delete('/photos/:photoId', async (c) => {
  const profileId = c.get('profileId')
  const photoId = c.req.param('photoId')

  const [photo] = await db
    .select({ fixtureId: propertyAssetPhotos.fixtureId })
    .from(propertyAssetPhotos)
    .where(eq(propertyAssetPhotos.id, photoId))
    .limit(1)

  if (!photo) {
    return c.json({ error: '사진을 찾을 수 없습니다.' }, 404)
  }

  const [fixture] = await db
    .select({ propertyId: propertyAssets.propertyId })
    .from(propertyAssets)
    .where(eq(propertyAssets.id, photo.fixtureId))
    .limit(1)

  if (!fixture) {
    return c.json({ error: '시설물을 찾을 수 없습니다.' }, 404)
  }

  const owned = await verifyPropertyOwnership(fixture.propertyId, profileId)
  if (!owned) {
    return c.json({ error: '권한이 없습니다.' }, 403)
  }

  await db.delete(propertyAssetPhotos).where(eq(propertyAssetPhotos.id, photoId))

  return c.json({ success: true })
})
