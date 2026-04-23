import { Hono } from 'hono'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { eq, and, inArray, isNull } from 'drizzle-orm'
import { db } from '@/db'
import {
  cleaningRequests,
  properties,
  propertyAssets,
  propertyAssetPhotos,
  propertySpaces,
  propertySpacePhotos,
} from '@/db/schema'
import { authMiddleware, type AuthEnv } from '../middleware/auth'
import { summarizeSpaces, summarizeSpacesByProperty } from '@/lib/property-space-summary'
import { notifyPropertySubmitted } from '../lib/notifications'

const CreatePropertySchema = z.object({
  name: z.string().min(1, { message: '숙소 이름을 입력해주세요.' }).trim(),
  address: z.string().min(1, { message: '주소를 입력해주세요.' }).trim(),
  addressDetail: z.string().optional(),
  propertyType: z.enum(['apartment', 'house', 'studio', 'villa', 'other']).default('apartment'),
  description: z.string().optional(),
  nearbyInfo: z.string().optional(),
  checkinInfo: z.string().optional(),
  wifiSsid: z.string().optional(),
  wifiPassword: z.string().optional(),
  airbnbListingId: z.string().optional(),
})

const UpdatePropertySchema = z.object({
  // Editable only while status is 'pending_activation' (used by onboarding edit flow)
  name: z.string().min(1, { message: '숙소 이름을 입력해주세요.' }).trim().optional(),
  address: z.string().min(1, { message: '주소를 입력해주세요.' }).trim().optional(),
  addressDetail: z.string().optional(),
  airbnbListingId: z.string().optional(),
  // Editable anytime by the host (출입·와이파이, 청소 준비 정보)
  entrancePassword: z.string().nullable().optional(),
  doorLockPassword: z.string().nullable().optional(),
  wifiSsid: z.string().nullable().optional(),
  wifiPassword: z.string().nullable().optional(),
  cleaningClosetLocation: z.string().nullable().optional(),
  extraLinenLocation: z.string().nullable().optional(),
  trashDisposalLocation: z.string().nullable().optional(),
})

export const propertiesRoutes = new Hono<AuthEnv>()

propertiesRoutes.use('*', authMiddleware)

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  )
}

async function createSignedUrlMap(paths: string[]) {
  const signedUrlMap = new Map<string, string | null>()
  if (paths.length === 0) return signedUrlMap

  const supabaseAdmin = getSupabaseAdmin()
  const { data } = await supabaseAdmin.storage
    .from('images')
    .createSignedUrls(paths, 60 * 60)

  data?.forEach((item, index) => {
    signedUrlMap.set(paths[index], item.signedUrl ?? null)
  })

  return signedUrlMap
}

// List all properties for the user
propertiesRoutes.get('/', async (c) => {
  const profileId = c.get('profileId')

  const result = await db
    .select()
    .from(properties)
    .where(and(eq(properties.hostId, profileId), isNull(properties.deletedAt)))

  const propertyIds = result.map((property) => property.id)
  const spaces = propertyIds.length > 0
    ? await db
      .select({
        propertyId: propertySpaces.propertyId,
        category: propertySpaces.category,
        pyeong: propertySpaces.pyeong,
      })
      .from(propertySpaces)
      .where(inArray(propertySpaces.propertyId, propertyIds))
    : []

  const summaries = summarizeSpacesByProperty(spaces)

  return c.json(
    result.map((property) => ({
      ...property,
      ...summaries.get(property.id),
    })),
  )
})

// Get single property with spaces and assets
propertiesRoutes.get('/:id', async (c) => {
  const profileId = c.get('profileId')
  const id = c.req.param('id')

  const [property] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.hostId, profileId), isNull(properties.deletedAt)))
    .limit(1)

  if (!property) {
    return c.json({ error: '숙소를 찾을 수 없거나 권한이 없습니다.' }, 404)
  }

  const spaces = await db
    .select()
    .from(propertySpaces)
    .where(eq(propertySpaces.propertyId, id))

  const spaceIds = spaces.map((space) => space.id)
  const spacePhotos = spaceIds.length > 0
    ? await db
      .select()
      .from(propertySpacePhotos)
      .where(inArray(propertySpacePhotos.propertySpaceId, spaceIds))
    : []

  const assets = await db
    .select({
      id: propertyAssets.id,
      propertyId: propertyAssets.propertyId,
      category: propertyAssets.category,
      name: propertyAssets.name,
      location: propertyAssets.location,
      brand: propertyAssets.brand,
      modelNumber: propertyAssets.modelNumber,
      specNotes: propertyAssets.specNotes,
      notes: propertyAssets.notes,
    })
    .from(propertyAssets)
    .where(eq(propertyAssets.propertyId, id))

  const assetIds = assets.map((asset) => asset.id)
  const assetPhotos = assetIds.length > 0
    ? await db
      .select()
      .from(propertyAssetPhotos)
      .where(inArray(propertyAssetPhotos.fixtureId, assetIds))
    : []

  const signedUrlMap = await createSignedUrlMap([
    ...spacePhotos.map((photo) => photo.storagePath),
    ...assetPhotos.map((photo) => photo.storagePath),
  ])

  const thumbnailSignedUrlMap = await createSignedUrlMap([
    ...spacePhotos.map((photo) => photo.thumbnailStoragePath),
    ...assetPhotos.map((photo) => photo.thumbnailStoragePath),
  ])

  return c.json({
    ...property,
    ...summarizeSpaces(spaces),
    spaces: spaces.map((space) => ({
      ...space,
      photos: spacePhotos
        .filter((photo) => photo.propertySpaceId === space.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((photo) => ({
          ...photo,
          signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
          thumbnailSignedUrl: thumbnailSignedUrlMap.get(photo.thumbnailStoragePath) ?? null,
        })),
    })),
    assets: assets.map((asset) => ({
      ...asset,
      photos: assetPhotos
        .filter((photo) => photo.fixtureId === asset.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((photo) => ({
          ...photo,
          signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
          thumbnailSignedUrl: thumbnailSignedUrlMap.get(photo.thumbnailStoragePath) ?? null,
        })),
    })),
  })
})

// Create property
propertiesRoutes.post('/', async (c) => {
  const profileId = c.get('profileId')
  const body = await c.req.json()
  const validated = CreatePropertySchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [created] = await db
    .insert(properties)
    .values({ hostId: profileId, ...validated.data })
    .returning()

  await notifyPropertySubmitted({
    propertyId: created.id,
    propertyName: created.name,
  })

  return c.json(created, 201)
})

// Update property
propertiesRoutes.patch('/:id', async (c) => {
  const profileId = c.get('profileId')
  const id = c.req.param('id')
  const body = await c.req.json()
  const validated = UpdatePropertySchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [existing] = await db
    .select({
      id: properties.id,
      status: properties.status,
    })
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.hostId, profileId), isNull(properties.deletedAt)))
    .limit(1)

  if (!existing) {
    return c.json({ error: '숙소를 찾을 수 없거나 권한이 없습니다.' }, 404)
  }

  if (
    existing.status === 'active'
    && (
      validated.data.name !== undefined
      || validated.data.address !== undefined
      || validated.data.addressDetail !== undefined
      || validated.data.airbnbListingId !== undefined
    )
  ) {
    return c.json({ error: '등록 완료 후에는 숙소 이름·주소·에어비앤비 링크를 수정할 수 없어요.' }, 400)
  }

  const trimToNullable = (value: string | null | undefined) => {
    if (value === undefined) return undefined
    if (value === null) return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  const updatePayload: Record<string, unknown> = { updatedAt: new Date() }
  if (validated.data.name !== undefined) updatePayload.name = validated.data.name
  if (validated.data.address !== undefined) updatePayload.address = validated.data.address
  if (validated.data.addressDetail !== undefined) {
    updatePayload.addressDetail = trimToNullable(validated.data.addressDetail)
  }
  if (validated.data.airbnbListingId !== undefined) {
    updatePayload.airbnbListingId = trimToNullable(validated.data.airbnbListingId)
  }
  const anytimeFields = [
    'entrancePassword',
    'doorLockPassword',
    'wifiSsid',
    'wifiPassword',
    'cleaningClosetLocation',
    'extraLinenLocation',
    'trashDisposalLocation',
  ] as const
  for (const field of anytimeFields) {
    const next = trimToNullable(validated.data[field])
    if (next !== undefined) updatePayload[field] = next
  }

  const [updated] = await db
    .update(properties)
    .set(updatePayload)
    .where(and(eq(properties.id, id), eq(properties.hostId, profileId), isNull(properties.deletedAt)))
    .returning()

  if (!updated) {
    return c.json({ error: '숙소를 찾을 수 없거나 권한이 없습니다.' }, 404)
  }

  return c.json(updated)
})

// Soft delete property
propertiesRoutes.delete('/:id', async (c) => {
  const profileId = c.get('profileId')
  const id = c.req.param('id')
  const deletedAt = new Date()

  const [deleted] = await db
    .update(properties)
    .set({ deletedAt })
    .where(and(eq(properties.id, id), eq(properties.hostId, profileId), isNull(properties.deletedAt)))
    .returning({ id: properties.id })

  if (!deleted) {
    return c.json({ error: '숙소를 찾을 수 없거나 권한이 없습니다.' }, 404)
  }

  await db
    .update(cleaningRequests)
    .set({
      status: 'cancelled',
      cancelledAt: deletedAt,
      updatedAt: deletedAt,
    })
    .where(and(
      eq(cleaningRequests.propertyId, id),
      eq(cleaningRequests.hostId, profileId),
      eq(cleaningRequests.status, 'pending'),
    ))

  return c.json({ success: true })
})

// Hard delete property
propertiesRoutes.delete('/:id/permanent', async (c) => {
  const profileId = c.get('profileId')
  const id = c.req.param('id')

  const [deleted] = await db
    .delete(properties)
    .where(and(eq(properties.id, id), eq(properties.hostId, profileId)))
    .returning({ id: properties.id })

  if (!deleted) {
    return c.json({ error: '숙소를 찾을 수 없거나 권한이 없습니다.' }, 404)
  }

  return c.json({ success: true })
})

// Dashboard summary
propertiesRoutes.get('/summary/dashboard', async (c) => {
  const profileId = c.get('profileId')

  const userProperties = await db
    .select()
    .from(properties)
    .where(and(eq(properties.hostId, profileId), isNull(properties.deletedAt)))

  if (!userProperties.length) {
    return c.json({ properties: [], fixtureCount: 0, repairCount: 0, recentRepairs: [] })
  }

  const propertyIds = userProperties.map((p) => p.id)

  const allFixtures = await db
    .select()
    .from(propertyAssets)
    .where(
      propertyIds.length === 1
        ? eq(propertyAssets.propertyId, propertyIds[0])
        : eq(propertyAssets.propertyId, propertyIds[0]), // simplified — full IN query below
    )

  // Use raw SQL for IN clause with multiple IDs
  const fixtureCount = await db
    .select({ id: propertyAssets.id })
    .from(propertyAssets)
    .where(eq(propertyAssets.propertyId, userProperties[0]?.id))

  return c.json({
    properties: userProperties,
    fixtureCount: fixtureCount.length,
  })
})
