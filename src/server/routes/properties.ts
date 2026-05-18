import { Hono } from 'hono'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { eq, and, inArray, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  cleaningRequests,
  profiles,
  properties,
  propertyAssets,
  propertyAssetPhotos,
  propertyCleaningManualStepPhotos,
  propertyCleaningManualSteps,
  propertyCleaningPrepPhotos,
  propertySpaces,
  propertySpacePhotos,
} from '@/db/schema'

const CleaningManualStepSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, '제목을 입력해주세요.').max(200),
  description: z.string().max(2000).nullable().optional(),
  photos: z
    .array(
      z.object({
        storagePath: z.string().min(1),
        thumbnailStoragePath: z.string().min(1),
      }),
    )
    .max(20),
})

const CleaningManualSchema = z.object({
  steps: z.array(CleaningManualStepSchema).max(50),
})

const CleaningManualUploadSchema = z.object({
  fileName: z.string().min(1),
})
import { authMiddleware, requireProfile, type AuthEnv } from '../middleware/auth'
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

const CleaningPrepPhotoSchema = z.object({
  storagePath: z.string().min(1),
  thumbnailStoragePath: z.string().min(1),
})

const CleaningPrepPhotosByKindSchema = z.object({
  cleaning_closet: z.array(CleaningPrepPhotoSchema).optional(),
  extra_linen: z.array(CleaningPrepPhotoSchema).optional(),
  trash_disposal: z.array(CleaningPrepPhotoSchema).optional(),
  linen_wash_external: z.array(CleaningPrepPhotoSchema).optional(),
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
  linenWashLocation: z.enum(['in_house', 'external']).nullable().optional(),
  linenWashExternalAddress: z.string().nullable().optional(),
  linenWashExternalAddressDetail: z.string().nullable().optional(),
  cleaningPrepPhotos: CleaningPrepPhotosByKindSchema.optional(),
})

const SignedUploadSchema = z.object({
  fileName: z.string().min(1),
  kind: z.literal('cleaning-prep'),
})

export const propertiesRoutes = new Hono<AuthEnv>()

propertiesRoutes.use('*', authMiddleware)
propertiesRoutes.use('*', requireProfile)

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  )
}

async function createSignedUrlMap(paths: string[]) {
  const map = new Map<string, string | null>()
  if (paths.length === 0) return map

  const supabaseAdmin = getSupabaseAdmin()
  for (const path of paths) {
    const { data } = supabaseAdmin.storage.from('images').getPublicUrl(path)
    map.set(path, data?.publicUrl ?? null)
  }

  return map
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

  const beddingAssets = propertyIds.length > 0
    ? await db
      .select({ propertyId: propertyAssets.propertyId })
      .from(propertyAssets)
      .where(and(
        inArray(propertyAssets.propertyId, propertyIds),
        eq(propertyAssets.category, 'bedding'),
        eq(propertyAssets.isActive, true),
      ))
    : []

  const beddingCounts = new Map<string, number>()
  for (const row of beddingAssets) {
    beddingCounts.set(row.propertyId, (beddingCounts.get(row.propertyId) ?? 0) + 1)
  }

  const summaries = summarizeSpacesByProperty(spaces)

  return c.json(
    result.map((property) => ({
      ...property,
      ...summaries.get(property.id),
      beddings: beddingCounts.get(property.id) ?? 0,
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
      isActive: propertyAssets.isActive,
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

  const prepPhotos = await db
    .select()
    .from(propertyCleaningPrepPhotos)
    .where(eq(propertyCleaningPrepPhotos.propertyId, id))

  const signedUrlMap = await createSignedUrlMap([
    ...spacePhotos.map((photo) => photo.storagePath),
    ...assetPhotos.map((photo) => photo.storagePath),
    ...prepPhotos.map((photo) => photo.storagePath),
  ])

  const thumbnailSignedUrlMap = await createSignedUrlMap([
    ...spacePhotos.map((photo) => photo.thumbnailStoragePath),
    ...assetPhotos.map((photo) => photo.thumbnailStoragePath),
    ...prepPhotos.map((photo) => photo.thumbnailStoragePath),
  ])

  const beddings = assets.filter((asset) => asset.category === 'bedding' && asset.isActive).length

  const [manualCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(propertyCleaningManualSteps)
    .where(eq(propertyCleaningManualSteps.propertyId, id))
  const cleaningManualStepCount = manualCountRow?.count ?? 0

  const cleaningPrepPhotosByKind = {
    cleaning_closet: [] as Array<typeof prepPhotos[number] & { signedUrl: string | null; thumbnailSignedUrl: string | null }>,
    extra_linen: [] as Array<typeof prepPhotos[number] & { signedUrl: string | null; thumbnailSignedUrl: string | null }>,
    trash_disposal: [] as Array<typeof prepPhotos[number] & { signedUrl: string | null; thumbnailSignedUrl: string | null }>,
    linen_wash_external: [] as Array<typeof prepPhotos[number] & { signedUrl: string | null; thumbnailSignedUrl: string | null }>,
  }
  for (const photo of prepPhotos.sort((a, b) => a.sortOrder - b.sortOrder)) {
    cleaningPrepPhotosByKind[photo.kind].push({
      ...photo,
      signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
      thumbnailSignedUrl: thumbnailSignedUrlMap.get(photo.thumbnailStoragePath) ?? null,
    })
  }

  return c.json({
    ...property,
    ...summarizeSpaces(spaces),
    beddings,
    cleaningManualStepCount,
    cleaningPrepPhotos: cleaningPrepPhotosByKind,
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

  const [host] = await db
    .select({ fullName: profiles.fullName, email: profiles.email })
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1)

  await notifyPropertySubmitted({
    propertyId: created.id,
    propertyName: created.name,
    hostName: host?.fullName ?? null,
    hostEmail: host?.email ?? null,
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
    'linenWashExternalAddress',
    'linenWashExternalAddressDetail',
  ] as const
  for (const field of anytimeFields) {
    const next = trimToNullable(validated.data[field])
    if (next !== undefined) updatePayload[field] = next
  }
  if (validated.data.linenWashLocation !== undefined) {
    updatePayload.linenWashLocation = validated.data.linenWashLocation
    if (validated.data.linenWashLocation !== 'external') {
      updatePayload.linenWashExternalAddress = null
      updatePayload.linenWashExternalAddressDetail = null
    }
  }

  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(properties)
      .set(updatePayload)
      .where(and(eq(properties.id, id), eq(properties.hostId, profileId), isNull(properties.deletedAt)))
      .returning({ id: properties.id })

    if (!updated) return null

    if (validated.data.cleaningPrepPhotos) {
      const kinds: Array<keyof typeof validated.data.cleaningPrepPhotos> = [
        'cleaning_closet',
        'extra_linen',
        'trash_disposal',
        'linen_wash_external',
      ]
      for (const kind of kinds) {
        const next = validated.data.cleaningPrepPhotos[kind]
        if (!next) continue
        await tx
          .delete(propertyCleaningPrepPhotos)
          .where(and(
            eq(propertyCleaningPrepPhotos.propertyId, id),
            eq(propertyCleaningPrepPhotos.kind, kind),
          ))
        if (next.length > 0) {
          await tx.insert(propertyCleaningPrepPhotos).values(
            next.map((photo, index) => ({
              propertyId: id,
              kind,
              storagePath: photo.storagePath,
              thumbnailStoragePath: photo.thumbnailStoragePath,
              sortOrder: index,
            })),
          )
        }
      }
    }

    return updated
  })

  if (!result) {
    return c.json({ error: '숙소를 찾을 수 없거나 권한이 없습니다.' }, 404)
  }

  return c.json({ success: true })
})

// Signed upload URL for host cleaning prep photos
propertiesRoutes.post('/:id/upload-url', async (c) => {
  const profileId = c.get('profileId')
  const id = c.req.param('id')
  const body = await c.req.json()
  const validated = SignedUploadSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [property] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.hostId, profileId), isNull(properties.deletedAt)))
    .limit(1)

  if (!property) {
    return c.json({ error: '숙소를 찾을 수 없거나 권한이 없습니다.' }, 404)
  }

  const ext = validated.data.fileName.split('.').pop()?.toLowerCase() || 'jpg'
  const fileId = crypto.randomUUID()
  const originalPath = `properties/${id}/${validated.data.kind}/original/${fileId}.${ext}`
  const thumbnailStoragePath = `properties/${id}/${validated.data.kind}/thumb/${fileId}.jpg`

  const supabaseAdmin = getSupabaseAdmin()
  const [{ data: originalData, error: originalError }, { data: thumbnailData, error: thumbnailError }] = await Promise.all([
    supabaseAdmin.storage.from('images').createSignedUploadUrl(originalPath),
    supabaseAdmin.storage.from('images').createSignedUploadUrl(thumbnailStoragePath),
  ])

  if (originalError || thumbnailError || !originalData || !thumbnailData) {
    return c.json({ error: originalError?.message || thumbnailError?.message || '업로드 URL을 만들 수 없어요.' }, 400)
  }

  return c.json({
    original: { path: originalPath, token: originalData.token },
    thumbnail: { path: thumbnailStoragePath, token: thumbnailData.token },
  })
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

propertiesRoutes.get('/:id/cleaning-manual', async (c) => {
  const profileId = c.get('profileId')
  const id = c.req.param('id')

  const [property] = await db
    .select({ id: properties.id, name: properties.name })
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.hostId, profileId), isNull(properties.deletedAt)))
    .limit(1)

  if (!property) {
    return c.json({ error: '숙소를 찾을 수 없거나 권한이 없습니다.' }, 404)
  }

  return c.json(await loadCleaningManual(id, property.name))
})

propertiesRoutes.post('/:id/cleaning-manual/upload-url', async (c) => {
  const profileId = c.get('profileId')
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const validated = CleaningManualUploadSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [property] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.hostId, profileId), isNull(properties.deletedAt)))
    .limit(1)

  if (!property) {
    return c.json({ error: '숙소를 찾을 수 없거나 권한이 없습니다.' }, 404)
  }

  const extension = validated.data.fileName.includes('.')
    ? validated.data.fileName.slice(validated.data.fileName.lastIndexOf('.')).toLowerCase()
    : '.jpg'
  const safeExtension = extension.match(/^\.[a-z0-9]+$/) ? extension : '.jpg'
  const fileId = crypto.randomUUID()
  const storagePath = `properties/${id}/cleaning-manual/original/${fileId}${safeExtension}`
  const thumbnailStoragePath = `properties/${id}/cleaning-manual/thumb/${fileId}.jpg`
  const supabaseAdmin = getSupabaseAdmin()
  const [{ data: originalData, error: originalError }, { data: thumbnailData, error: thumbnailError }] = await Promise.all([
    supabaseAdmin.storage.from('images').createSignedUploadUrl(storagePath),
    supabaseAdmin.storage.from('images').createSignedUploadUrl(thumbnailStoragePath),
  ])

  if (originalError || thumbnailError || !originalData || !thumbnailData) {
    return c.json({ error: originalError?.message || thumbnailError?.message || '업로드 URL을 만들 수 없어요.' }, 400)
  }

  return c.json({
    original: { path: storagePath, token: originalData.token },
    thumbnail: { path: thumbnailStoragePath, token: thumbnailData.token },
  })
})

propertiesRoutes.put('/:id/cleaning-manual', async (c) => {
  const profileId = c.get('profileId')
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const validated = CleaningManualSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [property] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.hostId, profileId), isNull(properties.deletedAt)))
    .limit(1)

  if (!property) {
    return c.json({ error: '숙소를 찾을 수 없거나 권한이 없습니다.' }, 404)
  }

  await db.transaction(async (tx) => {
    const existingSteps = await tx
      .select({ id: propertyCleaningManualSteps.id })
      .from(propertyCleaningManualSteps)
      .where(eq(propertyCleaningManualSteps.propertyId, id))

    const incomingIds = validated.data.steps
      .map((step) => step.id)
      .filter((stepId): stepId is string => Boolean(stepId))

    const stepsToDelete = existingSteps
      .map((step) => step.id)
      .filter((stepId) => !incomingIds.includes(stepId))

    if (stepsToDelete.length > 0) {
      await tx.delete(propertyCleaningManualSteps).where(inArray(propertyCleaningManualSteps.id, stepsToDelete))
    }

    for (const [index, step] of validated.data.steps.entries()) {
      let stepId = step.id
      const description = step.description?.trim() || null

      if (stepId) {
        await tx
          .update(propertyCleaningManualSteps)
          .set({
            title: step.title.trim(),
            description,
            sortOrder: index,
            updatedAt: new Date(),
          })
          .where(eq(propertyCleaningManualSteps.id, stepId))
        await tx
          .delete(propertyCleaningManualStepPhotos)
          .where(eq(propertyCleaningManualStepPhotos.stepId, stepId))
      } else {
        const [created] = await tx
          .insert(propertyCleaningManualSteps)
          .values({
            propertyId: id,
            title: step.title.trim(),
            description,
            sortOrder: index,
          })
          .returning({ id: propertyCleaningManualSteps.id })
        stepId = created.id
      }

      if (step.photos.length > 0) {
        await tx.insert(propertyCleaningManualStepPhotos).values(
          step.photos.map((photo, photoIndex) => ({
            stepId: stepId!,
            storagePath: photo.storagePath,
            thumbnailStoragePath: photo.thumbnailStoragePath,
            sortOrder: photoIndex,
          })),
        )
      }
    }
  })

  return c.json({ success: true })
})

export async function loadCleaningManual(propertyId: string, propertyName: string) {
  const steps = await db
    .select({
      id: propertyCleaningManualSteps.id,
      title: propertyCleaningManualSteps.title,
      description: propertyCleaningManualSteps.description,
      sortOrder: propertyCleaningManualSteps.sortOrder,
    })
    .from(propertyCleaningManualSteps)
    .where(eq(propertyCleaningManualSteps.propertyId, propertyId))
    .orderBy(propertyCleaningManualSteps.sortOrder)

  const stepIds = steps.map((step) => step.id)
  const photos = stepIds.length > 0
    ? await db
        .select({
          id: propertyCleaningManualStepPhotos.id,
          stepId: propertyCleaningManualStepPhotos.stepId,
          storagePath: propertyCleaningManualStepPhotos.storagePath,
          thumbnailStoragePath: propertyCleaningManualStepPhotos.thumbnailStoragePath,
          sortOrder: propertyCleaningManualStepPhotos.sortOrder,
        })
        .from(propertyCleaningManualStepPhotos)
        .where(inArray(propertyCleaningManualStepPhotos.stepId, stepIds))
        .orderBy(propertyCleaningManualStepPhotos.sortOrder)
    : []

  const signedUrlMap = await createSignedUrlMap([
    ...photos.map((photo) => photo.storagePath),
    ...photos.map((photo) => photo.thumbnailStoragePath),
  ])

  const photosByStep = new Map<string, Array<{
    id: string
    storagePath: string
    thumbnailStoragePath: string
    sortOrder: number
    signedUrl: string | null
    thumbnailSignedUrl: string | null
  }>>()

  for (const photo of photos) {
    const list = photosByStep.get(photo.stepId) ?? []
    list.push({
      id: photo.id,
      storagePath: photo.storagePath,
      thumbnailStoragePath: photo.thumbnailStoragePath,
      sortOrder: photo.sortOrder,
      signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
      thumbnailSignedUrl: signedUrlMap.get(photo.thumbnailStoragePath) ?? null,
    })
    photosByStep.set(photo.stepId, list)
  }

  return {
    propertyName,
    steps: steps.map((step) => ({
      ...step,
      photos: photosByStep.get(step.id) ?? [],
    })),
  }
}

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
