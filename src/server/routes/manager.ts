import { Hono } from 'hono'
import { createClient } from '@supabase/supabase-js'
import { and, asc, desc, eq, inArray, isNull, ne, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import {
  cleaningManualStepChecks,
  cleaningRequestAssets,
  cleaningRequestPhotos,
  cleaningInspectionAssetPhotos,
  cleaningInspectionAssetReports,
  cleaningInspectionReports,
  cleaningRequests,
  managers,
  profiles,
  properties,
  propertyAssets,
  propertyAssetPhotos,
  propertyCleaningManualSteps,
  propertyCleaningPrepPhotos,
  propertySpaces,
  propertySpacePhotos,
  repairCompletionPhotos,
  repairCompletionReports,
  repairRequestAssets,
  repairRequestPhotos,
  repairRequests,
} from '@/db/schema'
import { authMiddleware, requireProfile, type AuthEnv } from '../middleware/auth'
import { summarizeSpaces, summarizeSpacesByProperty } from '@/lib/property-space-summary'
import { isPhotoSpaceCategory } from '@/lib/cleaning-photo-spaces'
import { loadCleaningManual } from './properties'
import {
  notifyCleaningAssigned,
  notifyCleaningCompleted,
  notifyCleaningStarted,
  notifyRepairCompleted,
  notifyRepairQuoted,
  notifyRepairStarted,
} from '../lib/notifications'

type ManagerEnv = {
  Variables: AuthEnv['Variables'] & {
    managerId: string
  }
}

export const managerRoutes = new Hono<ManagerEnv>()
const ManagerCleaningStatusUpdateSchema = z.object({
  status: z.enum(['in_progress', 'completed']),
})
const UpdateManagerMeSchema = z.object({
  name: z.string().min(1),
  phone: z
    .string()
    .min(1)
    .transform((value) => value.replace(/\D/g, ''))
    .refine((digits) => /^01\d{8,9}$/.test(digits), '올바른 전화번호 형식이 아니에요.'),
  avatarStoragePath: z.string().min(1),
  avatarThumbnailStoragePath: z.string().min(1),
})
const ManagerAvatarUploadSchema = z.object({
  fileName: z.string().min(1),
})
const ReportPhotoUploadSchema = z.object({
  assetId: z.string().uuid(),
  fileName: z.string().min(1),
})
const CleaningPhotoUploadSchema = z
  .object({
    fileName: z.string().min(1),
    kind: z.enum(['before', 'after']),
    propertySpaceId: z.string().uuid().optional(),
    propertyAssetId: z.string().uuid().optional(),
  })
  .refine(
    (data) => Boolean(data.propertySpaceId) !== Boolean(data.propertyAssetId),
    { message: '공간 또는 자산 중 하나만 지정해주세요.' },
  )
const ReportPhotoSchema = z.object({
  storagePath: z.string().min(1),
  thumbnailStoragePath: z.string().min(1),
})
const CleaningPhotoSchema = z.object({
  storagePath: z.string().min(1),
  thumbnailStoragePath: z.string().min(1),
  slotIndex: z.number().int().nonnegative().optional(),
})
const CleaningPhotosDraftSchema = z
  .object({
    propertySpaceId: z.string().uuid().optional(),
    propertyAssetId: z.string().uuid().optional(),
    kind: z.enum(['before', 'after']),
    photos: z.array(CleaningPhotoSchema).default([]),
  })
  .refine(
    (data) => Boolean(data.propertySpaceId) !== Boolean(data.propertyAssetId),
    { message: '공간 또는 자산 중 하나만 지정해주세요.' },
  )
const InspectionAssetDraftSchema = z.object({
  assetId: z.string().uuid(),
  status: z.enum(['normal', 'caution', 'defective']).nullable().optional(),
  memo: z.string().nullable().optional(),
  photos: z.array(ReportPhotoSchema).default([]),
})
const ManagerCleaningReportDraftSchema = z.object({
  summaryMemo: z.string().nullable().optional(),
  assets: z.array(InspectionAssetDraftSchema).default([]),
})

managerRoutes.use('*', authMiddleware)
managerRoutes.use('*', requireProfile)

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

async function getManagerCleaningDetail(managerId: string, id: string) {
  const [request] = await db
    .select({
      id: cleaningRequests.id,
      status: cleaningRequests.status,
      scheduledDate: cleaningRequests.scheduledDate,
      scheduledTime: cleaningRequests.scheduledTime,
      cleaningType: cleaningRequests.cleaningType,
      cleaningPlan: cleaningRequests.cleaningPlan,
      serviceType: cleaningRequests.serviceType,
      memo: cleaningRequests.memo,
      linenWash: cleaningRequests.linenWash,
      finalPrice: cleaningRequests.finalPrice,
      createdAt: cleaningRequests.createdAt,
      propertyId: properties.id,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyAddressDetail: properties.addressDetail,
      entrancePassword: properties.entrancePassword,
      doorLockPassword: properties.doorLockPassword,
      wifiSsid: properties.wifiSsid,
      wifiPassword: properties.wifiPassword,
      cleaningClosetLocation: properties.cleaningClosetLocation,
      extraLinenLocation: properties.extraLinenLocation,
      trashDisposalLocation: properties.trashDisposalLocation,
      linenWashLocation: properties.linenWashLocation,
      linenWashExternalAddress: properties.linenWashExternalAddress,
      linenWashExternalAddressDetail: properties.linenWashExternalAddressDetail,
    })
    .from(cleaningRequests)
    .innerJoin(properties, eq(cleaningRequests.propertyId, properties.id))
    .where(and(
      eq(cleaningRequests.id, id),
      isNull(properties.deletedAt),
      or(
        eq(cleaningRequests.managerId, managerId),
        and(
          eq(cleaningRequests.status, 'pending'),
          isNull(cleaningRequests.managerId),
        ),
      ),
    ))
    .limit(1)

  if (!request) {
    return null
  }

  const spaces = await db
    .select({
      id: propertySpaces.id,
      propertyId: propertySpaces.propertyId,
      category: propertySpaces.category,
      name: propertySpaces.name,
      pyeong: propertySpaces.pyeong,
      notes: propertySpaces.notes,
    })
    .from(propertySpaces)
    .where(eq(propertySpaces.propertyId, request.propertyId))

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
    .where(eq(propertyAssets.propertyId, request.propertyId))

  const spaceIds = spaces.map((space) => space.id)
  const spacePhotos = spaceIds.length > 0
    ? await db
        .select({
          id: propertySpacePhotos.id,
          propertySpaceId: propertySpacePhotos.propertySpaceId,
          storagePath: propertySpacePhotos.storagePath,
          thumbnailStoragePath: propertySpacePhotos.thumbnailStoragePath,
          sortOrder: propertySpacePhotos.sortOrder,
        })
        .from(propertySpacePhotos)
        .where(inArray(propertySpacePhotos.propertySpaceId, spaceIds))
    : []

  const assetIds = assets.map((asset) => asset.id)
  const assetPhotos = assetIds.length > 0
    ? await db
        .select({
          id: propertyAssetPhotos.id,
          fixtureId: propertyAssetPhotos.fixtureId,
          storagePath: propertyAssetPhotos.storagePath,
          thumbnailStoragePath: propertyAssetPhotos.thumbnailStoragePath,
          sortOrder: propertyAssetPhotos.sortOrder,
        })
        .from(propertyAssetPhotos)
        .where(inArray(propertyAssetPhotos.fixtureId, assetIds))
    : []
  const requestPhotos = await db
    .select({
      id: cleaningRequestPhotos.id,
      cleaningRequestId: cleaningRequestPhotos.cleaningRequestId,
      propertySpaceId: cleaningRequestPhotos.propertySpaceId,
      propertyAssetId: cleaningRequestPhotos.propertyAssetId,
      kind: cleaningRequestPhotos.kind,
      storagePath: cleaningRequestPhotos.storagePath,
      thumbnailStoragePath: cleaningRequestPhotos.thumbnailStoragePath,
      sortOrder: cleaningRequestPhotos.sortOrder,
    })
    .from(cleaningRequestPhotos)
    .where(eq(cleaningRequestPhotos.cleaningRequestId, request.id))

  const selectedAssetRows = request.serviceType === 'ac'
    ? await db
        .select({
          id: propertyAssets.id,
          name: propertyAssets.name,
          location: propertyAssets.location,
          brand: propertyAssets.brand,
          modelNumber: propertyAssets.modelNumber,
        })
        .from(cleaningRequestAssets)
        .innerJoin(propertyAssets, eq(cleaningRequestAssets.assetId, propertyAssets.id))
        .where(eq(cleaningRequestAssets.cleaningRequestId, request.id))
    : []
  const prepPhotos = await db
    .select({
      id: propertyCleaningPrepPhotos.id,
      kind: propertyCleaningPrepPhotos.kind,
      storagePath: propertyCleaningPrepPhotos.storagePath,
      thumbnailStoragePath: propertyCleaningPrepPhotos.thumbnailStoragePath,
      sortOrder: propertyCleaningPrepPhotos.sortOrder,
    })
    .from(propertyCleaningPrepPhotos)
    .where(eq(propertyCleaningPrepPhotos.propertyId, request.propertyId))
  const summary = summarizeSpaces(spaces)
  const propertySpaceNames = spaces.map((space) => space.name)

  const signedUrlMap = await createSignedUrlMap([
    ...requestPhotos.map((photo) => photo.storagePath),
    ...spacePhotos.map((photo) => photo.storagePath),
    ...assetPhotos.map((photo) => photo.storagePath),
    ...prepPhotos.map((photo) => photo.storagePath),
  ])
  const thumbnailSignedUrlMap = await createSignedUrlMap([
    ...requestPhotos.map((photo) => photo.thumbnailStoragePath),
    ...spacePhotos.map((photo) => photo.thumbnailStoragePath),
    ...assetPhotos.map((photo) => photo.thumbnailStoragePath),
    ...prepPhotos.map((photo) => photo.thumbnailStoragePath),
  ])

  const [manualCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(propertyCleaningManualSteps)
    .where(eq(propertyCleaningManualSteps.propertyId, request.propertyId))
  const cleaningManualStepCount = manualCountRow?.count ?? 0

  const cleaningPrepPhotosByKind = {
    cleaning_closet: [] as Array<{
      id: string
      storagePath: string
      thumbnailStoragePath: string
      signedUrl: string | null
      thumbnailSignedUrl: string | null
    }>,
    extra_linen: [] as Array<{
      id: string
      storagePath: string
      thumbnailStoragePath: string
      signedUrl: string | null
      thumbnailSignedUrl: string | null
    }>,
    trash_disposal: [] as Array<{
      id: string
      storagePath: string
      thumbnailStoragePath: string
      signedUrl: string | null
      thumbnailSignedUrl: string | null
    }>,
    linen_wash_external: [] as Array<{
      id: string
      storagePath: string
      thumbnailStoragePath: string
      signedUrl: string | null
      thumbnailSignedUrl: string | null
    }>,
  }
  for (const photo of prepPhotos.sort((a, b) => a.sortOrder - b.sortOrder)) {
    cleaningPrepPhotosByKind[photo.kind].push({
      id: photo.id,
      storagePath: photo.storagePath,
      thumbnailStoragePath: photo.thumbnailStoragePath,
      signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
      thumbnailSignedUrl: thumbnailSignedUrlMap.get(photo.thumbnailStoragePath) ?? null,
    })
  }

  const toCleaningPhoto = (photo: typeof requestPhotos[number]) => ({
    id: photo.id,
    storagePath: photo.storagePath,
    thumbnailStoragePath: photo.thumbnailStoragePath,
    sortOrder: photo.sortOrder,
    signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
    thumbnailSignedUrl: thumbnailSignedUrlMap.get(photo.thumbnailStoragePath) ?? null,
  })

  const cleaningPhotosBySpace = spaces
    .filter((space) => isPhotoSpaceCategory(space.category))
    .map((space) => ({
      spaceId: space.id,
      spaceName: space.name,
      category: space.category,
      before: requestPhotos
        .filter((p) => p.propertySpaceId === space.id && p.kind === 'before')
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(toCleaningPhoto),
      after: requestPhotos
        .filter((p) => p.propertySpaceId === space.id && p.kind === 'after')
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(toCleaningPhoto),
    }))

  const cleaningPhotosByAsset = selectedAssetRows.map((asset) => ({
    assetId: asset.id,
    assetName: asset.name,
    location: asset.location,
    before: requestPhotos
      .filter((p) => p.propertyAssetId === asset.id && p.kind === 'before')
      .map(toCleaningPhoto),
    after: requestPhotos
      .filter((p) => p.propertyAssetId === asset.id && p.kind === 'after')
      .map(toCleaningPhoto),
  }))

  const legacyCleaningPhotos = requestPhotos
    .filter((p) => p.propertySpaceId === null && p.propertyAssetId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((photo) => ({
      ...toCleaningPhoto(photo),
      kind: photo.kind,
    }))

  return {
    ...request,
    propertySpaceNames,
    propertyPyeong: summary.pyeong,
    propertyLivingRooms: summary.livingRooms,
    propertyBedrooms: summary.bedrooms,
    propertyBathrooms: summary.bathrooms,
    cleaningManualStepCount,
    cleaningPrepPhotos: cleaningPrepPhotosByKind,
    cleaningPhotosBySpace,
    cleaningPhotosByAsset,
    selectedAssets: selectedAssetRows,
    legacyCleaningPhotos,
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
  }
}

managerRoutes.use('*', async (c, next) => {
  const profileId = c.get('profileId')

  if (!profileId) {
    return c.json({ error: '프로필을 찾을 수 없어요.' }, 401)
  }

  const [linked] = await db
    .select({
      profileId: profiles.id,
      role: profiles.role,
      managerId: managers.id,
    })
    .from(profiles)
    .leftJoin(managers, eq(managers.profileId, profiles.id))
    .where(and(eq(profiles.id, profileId), isNull(profiles.deletedAt)))
    .limit(1)

  if (!linked || linked.role !== 'manager' || !linked.managerId) {
    return c.json({ error: '연결된 매니저 계정이 아니에요.' }, 403)
  }

  c.set('managerId', linked.managerId)
  await next()
})

managerRoutes.get('/me', async (c) => {
  const profileId = c.get('profileId')
  const managerId = c.get('managerId')

  const [result] = await db
    .select({
      profileId: profiles.id,
      email: profiles.email,
      fullName: profiles.fullName,
      phone: profiles.phone,
      avatarStoragePath: profiles.avatarStoragePath,
      avatarThumbnailStoragePath: profiles.avatarThumbnailStoragePath,
      role: profiles.role,
      managerId: managers.id,
      managerProfileId: managers.profileId,
      managerName: managers.name,
      managerPhone: managers.phone,
      managerMemo: managers.memo,
      managerIsActive: managers.isActive,
      managerCreatedAt: managers.createdAt,
    })
    .from(profiles)
    .innerJoin(managers, eq(managers.profileId, profiles.id))
    .where(and(eq(profiles.id, profileId), eq(managers.id, managerId), isNull(profiles.deletedAt)))
    .limit(1)

  if (!result) {
    return c.json({ error: '매니저 정보를 찾을 수 없어요.' }, 404)
  }

  const signedUrlMap = await createSignedUrlMap(
    [result.avatarStoragePath, result.avatarThumbnailStoragePath].filter((path): path is string => !!path),
  )

  return c.json({
    profile: {
      id: result.profileId,
      email: result.email,
      fullName: result.fullName,
      phone: result.phone,
      avatarStoragePath: result.avatarStoragePath,
      avatarThumbnailStoragePath: result.avatarThumbnailStoragePath,
      avatarSignedUrl: result.avatarStoragePath ? signedUrlMap.get(result.avatarStoragePath) ?? null : null,
      avatarThumbnailSignedUrl: result.avatarThumbnailStoragePath ? signedUrlMap.get(result.avatarThumbnailStoragePath) ?? null : null,
      role: result.role,
    },
    manager: {
      id: result.managerId,
      profileId: result.managerProfileId,
      name: result.managerName,
      phone: result.managerPhone,
      memo: result.managerMemo,
      isActive: result.managerIsActive,
      createdAt: result.managerCreatedAt,
    },
  })
})

managerRoutes.post('/me/upload-url', async (c) => {
  const body = await c.req.json()
  const validated = ManagerAvatarUploadSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const extension = validated.data.fileName.includes('.')
    ? validated.data.fileName.slice(validated.data.fileName.lastIndexOf('.')).toLowerCase()
    : '.jpg'
  const safeExtension = extension.match(/^\.[a-z0-9]+$/) ? extension : '.jpg'
  const fileId = crypto.randomUUID()
  const storagePath = `managers/profiles/original/${fileId}${safeExtension}`
  const thumbnailStoragePath = `managers/profiles/thumb/${fileId}.jpg`
  const supabaseAdmin = getSupabaseAdmin()
  const [{ data: originalData, error: originalError }, { data: thumbnailData, error: thumbnailError }] = await Promise.all([
    supabaseAdmin.storage.from('images').createSignedUploadUrl(storagePath),
    supabaseAdmin.storage.from('images').createSignedUploadUrl(thumbnailStoragePath),
  ])

  if (originalError || thumbnailError || !originalData || !thumbnailData) {
    return c.json({ error: originalError?.message || thumbnailError?.message || '업로드 URL을 만들 수 없어요.' }, 400)
  }

  return c.json({
    original: {
      path: storagePath,
      token: originalData.token,
    },
    thumbnail: {
      path: thumbnailStoragePath,
      token: thumbnailData.token,
    },
  })
})

managerRoutes.patch('/me', async (c) => {
  const profileId = c.get('profileId')
  const managerId = c.get('managerId')
  const body = await c.req.json()
  const validated = UpdateManagerMeSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const updated = await db.transaction(async (tx) => {
    const [profile] = await tx
      .update(profiles)
      .set({
        fullName: validated.data.name,
        phone: validated.data.phone,
        avatarStoragePath: validated.data.avatarStoragePath,
        avatarThumbnailStoragePath: validated.data.avatarThumbnailStoragePath,
        updatedAt: new Date(),
      })
      .where(and(eq(profiles.id, profileId), isNull(profiles.deletedAt)))
      .returning({
        id: profiles.id,
      })

    if (!profile) {
      return null
    }

    const [manager] = await tx
      .update(managers)
      .set({
        name: validated.data.name,
        phone: validated.data.phone,
        updatedAt: new Date(),
      })
      .where(eq(managers.id, managerId))
      .returning({
        id: managers.id,
      })

    if (!manager) {
      return null
    }

    return { success: true }
  })

  if (!updated) {
    return c.json({ error: '매니저 정보를 저장하지 못했어요.' }, 404)
  }

  return c.json(updated)
})

managerRoutes.post('/cleanings/:id/report/upload-url', async (c) => {
  const id = c.req.param('id')
  const managerId = c.get('managerId')
  const body = await c.req.json().catch(() => null)
  const validated = ReportPhotoUploadSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [request] = await db
    .select({ id: cleaningRequests.id })
    .from(cleaningRequests)
    .where(and(eq(cleaningRequests.id, id), eq(cleaningRequests.managerId, managerId)))
    .limit(1)

  if (!request) {
    return c.json({ error: '청소 요청을 찾을 수 없어요.' }, 404)
  }

  const extension = validated.data.fileName.includes('.')
    ? validated.data.fileName.slice(validated.data.fileName.lastIndexOf('.')).toLowerCase()
    : '.jpg'
  const safeExtension = extension.match(/^\.[a-z0-9]+$/) ? extension : '.jpg'
  const fileId = crypto.randomUUID()
  const storagePath = `cleanings/${id}/inspection-reports/${validated.data.assetId}/original/${fileId}${safeExtension}`
  const thumbnailStoragePath = `cleanings/${id}/inspection-reports/${validated.data.assetId}/thumb/${fileId}.jpg`
  const supabaseAdmin = getSupabaseAdmin()
  const [{ data: originalData, error: originalError }, { data: thumbnailData, error: thumbnailError }] = await Promise.all([
    supabaseAdmin.storage.from('images').createSignedUploadUrl(storagePath),
    supabaseAdmin.storage.from('images').createSignedUploadUrl(thumbnailStoragePath),
  ])

  if (originalError || thumbnailError || !originalData || !thumbnailData) {
    return c.json({ error: originalError?.message || thumbnailError?.message || '업로드 URL을 만들 수 없어요.' }, 400)
  }

  return c.json({
    original: {
      path: storagePath,
      token: originalData.token,
    },
    thumbnail: {
      path: thumbnailStoragePath,
      token: thumbnailData.token,
    },
  })
})

managerRoutes.post('/cleanings/:id/photos/upload-url', async (c) => {
  const id = c.req.param('id')
  const managerId = c.get('managerId')
  const body = await c.req.json().catch(() => null)
  const validated = CleaningPhotoUploadSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const { kind, propertySpaceId, propertyAssetId } = validated.data

  const [request] = await db
    .select({
      id: cleaningRequests.id,
      status: cleaningRequests.status,
      propertyId: cleaningRequests.propertyId,
      serviceType: cleaningRequests.serviceType,
    })
    .from(cleaningRequests)
    .where(and(eq(cleaningRequests.id, id), eq(cleaningRequests.managerId, managerId)))
    .limit(1)

  if (!request) {
    return c.json({ error: '청소 요청을 찾을 수 없어요.' }, 404)
  }

  if (kind === 'before' && request.status !== 'confirmed') {
    return c.json({ error: '청소 전 사진은 시작 전(배정 완료 상태)에만 올릴 수 있어요.' }, 400)
  }

  if (kind === 'after' && request.status !== 'in_progress') {
    return c.json({ error: '청소 후 사진은 청소 진행 중에만 올릴 수 있어요.' }, 400)
  }

  let scopePath: string
  if (propertyAssetId) {
    if (request.serviceType !== 'ac') {
      return c.json({ error: '이 청소 요청은 자산별 사진 업로드 대상이 아니에요.' }, 400)
    }
    const [link] = await db
      .select({ id: cleaningRequestAssets.id })
      .from(cleaningRequestAssets)
      .where(and(
        eq(cleaningRequestAssets.cleaningRequestId, request.id),
        eq(cleaningRequestAssets.assetId, propertyAssetId),
      ))
      .limit(1)
    if (!link) {
      return c.json({ error: '해당 에어컨은 이 요청에 포함되어 있지 않아요.' }, 404)
    }
    scopePath = `assets/${propertyAssetId}`
  } else {
    if (request.serviceType !== 'general') {
      return c.json({ error: '이 청소 요청은 공간별 사진 업로드 대상이 아니에요.' }, 400)
    }
    const [space] = await db
      .select({ id: propertySpaces.id, category: propertySpaces.category })
      .from(propertySpaces)
      .where(and(eq(propertySpaces.id, propertySpaceId!), eq(propertySpaces.propertyId, request.propertyId)))
      .limit(1)
    if (!space) {
      return c.json({ error: '해당 공간을 찾을 수 없어요.' }, 404)
    }
    if (!isPhotoSpaceCategory(space.category)) {
      return c.json({ error: '이 공간은 청소 사진 업로드 대상이 아니에요.' }, 400)
    }
    scopePath = `spaces/${propertySpaceId}`
  }

  const extension = validated.data.fileName.includes('.')
    ? validated.data.fileName.slice(validated.data.fileName.lastIndexOf('.')).toLowerCase()
    : '.jpg'
  const safeExtension = extension.match(/^\.[a-z0-9]+$/) ? extension : '.jpg'
  const fileId = crypto.randomUUID()
  const storagePath = `cleanings/${id}/photos/${kind}/${scopePath}/original/${fileId}${safeExtension}`
  const thumbnailStoragePath = `cleanings/${id}/photos/${kind}/${scopePath}/thumb/${fileId}.jpg`
  const supabaseAdmin = getSupabaseAdmin()
  const [{ data: originalData, error: originalError }, { data: thumbnailData, error: thumbnailError }] = await Promise.all([
    supabaseAdmin.storage.from('images').createSignedUploadUrl(storagePath),
    supabaseAdmin.storage.from('images').createSignedUploadUrl(thumbnailStoragePath),
  ])

  if (originalError || thumbnailError || !originalData || !thumbnailData) {
    return c.json({ error: originalError?.message || thumbnailError?.message || '업로드 URL을 만들 수 없어요.' }, 400)
  }

  return c.json({
    original: {
      path: storagePath,
      token: originalData.token,
    },
    thumbnail: {
      path: thumbnailStoragePath,
      token: thumbnailData.token,
    },
  })
})

managerRoutes.post('/cleanings/:id/photos', async (c) => {
  const id = c.req.param('id')
  const managerId = c.get('managerId')
  const body = await c.req.json().catch(() => null)
  const parsed = CleaningPhotosDraftSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: '청소 사진 정보가 올바르지 않아요.' }, 400)
  }

  const { propertySpaceId, propertyAssetId, kind } = parsed.data

  const [request] = await db
    .select({
      id: cleaningRequests.id,
      status: cleaningRequests.status,
      propertyId: cleaningRequests.propertyId,
      serviceType: cleaningRequests.serviceType,
    })
    .from(cleaningRequests)
    .where(and(eq(cleaningRequests.id, id), eq(cleaningRequests.managerId, managerId)))
    .limit(1)

  if (!request) {
    return c.json({ error: '청소 요청을 찾을 수 없어요.' }, 404)
  }

  if (kind === 'before' && request.status !== 'confirmed') {
    return c.json({ error: '청소 전 사진은 시작 전(배정 완료 상태)에만 저장할 수 있어요.' }, 400)
  }

  if (kind === 'after' && request.status !== 'in_progress') {
    return c.json({ error: '청소 후 사진은 청소 진행 중에만 저장할 수 있어요.' }, 400)
  }

  if (propertyAssetId) {
    if (request.serviceType !== 'ac') {
      return c.json({ error: '이 청소 요청은 자산별 사진 저장 대상이 아니에요.' }, 400)
    }
    const [link] = await db
      .select({ id: cleaningRequestAssets.id })
      .from(cleaningRequestAssets)
      .where(and(
        eq(cleaningRequestAssets.cleaningRequestId, request.id),
        eq(cleaningRequestAssets.assetId, propertyAssetId),
      ))
      .limit(1)
    if (!link) {
      return c.json({ error: '해당 에어컨은 이 요청에 포함되어 있지 않아요.' }, 404)
    }

    await db.delete(cleaningRequestPhotos).where(and(
      eq(cleaningRequestPhotos.cleaningRequestId, id),
      eq(cleaningRequestPhotos.propertyAssetId, propertyAssetId),
      eq(cleaningRequestPhotos.kind, kind),
    ))

    if (parsed.data.photos.length > 0) {
      await db.insert(cleaningRequestPhotos).values(
        parsed.data.photos.map((photo, index) => ({
          cleaningRequestId: id,
          propertyAssetId,
          kind,
          storagePath: photo.storagePath,
          thumbnailStoragePath: photo.thumbnailStoragePath,
          sortOrder: photo.slotIndex ?? index,
        })),
      )
    }

    const savedPhotos = await db
      .select({
        id: cleaningRequestPhotos.id,
        storagePath: cleaningRequestPhotos.storagePath,
        thumbnailStoragePath: cleaningRequestPhotos.thumbnailStoragePath,
        sortOrder: cleaningRequestPhotos.sortOrder,
      })
      .from(cleaningRequestPhotos)
      .where(and(
        eq(cleaningRequestPhotos.cleaningRequestId, id),
        eq(cleaningRequestPhotos.propertyAssetId, propertyAssetId),
        eq(cleaningRequestPhotos.kind, kind),
      ))

    return c.json({
      success: true,
      photos: savedPhotos
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((photo) => ({
          ...photo,
          signedUrl: null,
          thumbnailSignedUrl: null,
        })),
    })
  }

  // Space-scoped (general cleaning) — existing path
  if (request.serviceType !== 'general') {
    return c.json({ error: '이 청소 요청은 공간별 사진 저장 대상이 아니에요.' }, 400)
  }

  const [space] = await db
    .select({ id: propertySpaces.id, category: propertySpaces.category })
    .from(propertySpaces)
    .where(and(eq(propertySpaces.id, propertySpaceId!), eq(propertySpaces.propertyId, request.propertyId)))
    .limit(1)

  if (!space) {
    return c.json({ error: '해당 공간을 찾을 수 없어요.' }, 404)
  }

  if (!isPhotoSpaceCategory(space.category)) {
    return c.json({ error: '이 공간은 청소 사진 업로드 대상이 아니에요.' }, 400)
  }

  await db.delete(cleaningRequestPhotos).where(and(
    eq(cleaningRequestPhotos.cleaningRequestId, id),
    eq(cleaningRequestPhotos.propertySpaceId, propertySpaceId!),
    eq(cleaningRequestPhotos.kind, kind),
  ))

  if (parsed.data.photos.length > 0) {
    await db.insert(cleaningRequestPhotos).values(
      parsed.data.photos.map((photo, index) => ({
        cleaningRequestId: id,
        propertySpaceId,
        kind,
        storagePath: photo.storagePath,
        thumbnailStoragePath: photo.thumbnailStoragePath,
        sortOrder: photo.slotIndex ?? index,
      })),
    )
  }

  const savedPhotos = await db
    .select({
      id: cleaningRequestPhotos.id,
      storagePath: cleaningRequestPhotos.storagePath,
      thumbnailStoragePath: cleaningRequestPhotos.thumbnailStoragePath,
      sortOrder: cleaningRequestPhotos.sortOrder,
    })
    .from(cleaningRequestPhotos)
    .where(and(
      eq(cleaningRequestPhotos.cleaningRequestId, id),
      eq(cleaningRequestPhotos.propertySpaceId, propertySpaceId!),
      eq(cleaningRequestPhotos.kind, kind),
    ))

  return c.json({
    success: true,
    photos: savedPhotos
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((photo) => ({
        ...photo,
        signedUrl: null,
        thumbnailSignedUrl: null,
      })),
  })
})

managerRoutes.get('/cleanings/open', async (c) => {
  const now = new Date()
  const currentDate = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const currentTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)

  const result = await db
    .select({
      id: cleaningRequests.id,
      status: cleaningRequests.status,
      scheduledDate: cleaningRequests.scheduledDate,
      scheduledTime: cleaningRequests.scheduledTime,
      cleaningType: cleaningRequests.cleaningType,
      cleaningPlan: cleaningRequests.cleaningPlan,
      serviceType: cleaningRequests.serviceType,
      memo: cleaningRequests.memo,
      linenWash: cleaningRequests.linenWash,
      finalPrice: cleaningRequests.finalPrice,
      createdAt: cleaningRequests.createdAt,
      propertyId: properties.id,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyAddressDetail: properties.addressDetail,
    })
    .from(cleaningRequests)
    .leftJoin(properties, eq(cleaningRequests.propertyId, properties.id))
    .where(and(
      eq(cleaningRequests.status, 'pending'),
      isNull(cleaningRequests.managerId),
      isNull(properties.deletedAt),
    ))
    .orderBy(asc(cleaningRequests.scheduledDate), asc(cleaningRequests.scheduledTime), desc(cleaningRequests.createdAt))
  const upcomingResult = result.filter((cleaning) =>
    cleaning.scheduledDate > currentDate ||
    (cleaning.scheduledDate === currentDate && cleaning.scheduledTime >= currentTime),
  )

  const propertyIds = Array.from(new Set(upcomingResult.map((cleaning) => cleaning.propertyId).filter((id): id is string => !!id)))
  const spaces = propertyIds.length > 0
    ? await db
        .select({
          propertyId: propertySpaces.propertyId,
          name: propertySpaces.name,
          category: propertySpaces.category,
          pyeong: propertySpaces.pyeong,
        })
        .from(propertySpaces)
        .where(inArray(propertySpaces.propertyId, propertyIds))
    : []
  const summaryByProperty = summarizeSpacesByProperty(spaces)
  const spaceNamesByProperty = new Map<string, string[]>()

  for (const space of spaces) {
    const current = spaceNamesByProperty.get(space.propertyId) ?? []
    current.push(space.name)
    spaceNamesByProperty.set(space.propertyId, current)
  }

  return c.json(
    upcomingResult.map((cleaning) => {
      const summary = cleaning.propertyId ? summaryByProperty.get(cleaning.propertyId) : null
      const spaceNames = cleaning.propertyId ? spaceNamesByProperty.get(cleaning.propertyId) ?? [] : []

      return {
        ...cleaning,
        propertySpaceNames: spaceNames,
        propertyPyeong: summary?.pyeong ?? null,
        propertyLivingRooms: summary?.livingRooms ?? null,
        propertyBedrooms: summary?.bedrooms ?? null,
        propertyBathrooms: summary?.bathrooms ?? null,
      }
    }),
  )
})

managerRoutes.get('/cleanings/me', async (c) => {
  const managerId = c.get('managerId')

  const result = await db
    .select({
      id: cleaningRequests.id,
      status: cleaningRequests.status,
      scheduledDate: cleaningRequests.scheduledDate,
      scheduledTime: cleaningRequests.scheduledTime,
      cleaningType: cleaningRequests.cleaningType,
      cleaningPlan: cleaningRequests.cleaningPlan,
      serviceType: cleaningRequests.serviceType,
      memo: cleaningRequests.memo,
      linenWash: cleaningRequests.linenWash,
      finalPrice: cleaningRequests.finalPrice,
      createdAt: cleaningRequests.createdAt,
      propertyId: properties.id,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyAddressDetail: properties.addressDetail,
    })
    .from(cleaningRequests)
    .leftJoin(properties, eq(cleaningRequests.propertyId, properties.id))
    .where(and(
      eq(cleaningRequests.managerId, managerId),
      ne(cleaningRequests.status, 'pending_payment'),
      ne(cleaningRequests.status, 'cancelled'),
    ))
    .orderBy(asc(cleaningRequests.scheduledDate), asc(cleaningRequests.scheduledTime), desc(cleaningRequests.createdAt))

  const propertyIds = Array.from(new Set(result.map((cleaning) => cleaning.propertyId).filter((id): id is string => !!id)))
  const spaces = propertyIds.length > 0
    ? await db
        .select({
          propertyId: propertySpaces.propertyId,
          name: propertySpaces.name,
          category: propertySpaces.category,
          pyeong: propertySpaces.pyeong,
        })
        .from(propertySpaces)
        .where(inArray(propertySpaces.propertyId, propertyIds))
    : []
  const summaryByProperty = summarizeSpacesByProperty(spaces)
  const spaceNamesByProperty = new Map<string, string[]>()

  for (const space of spaces) {
    const current = spaceNamesByProperty.get(space.propertyId) ?? []
    current.push(space.name)
    spaceNamesByProperty.set(space.propertyId, current)
  }

  return c.json(
    result.map((cleaning) => {
      const summary = cleaning.propertyId ? summaryByProperty.get(cleaning.propertyId) : null
      const spaceNames = cleaning.propertyId ? spaceNamesByProperty.get(cleaning.propertyId) ?? [] : []

      return {
        ...cleaning,
        propertySpaceNames: spaceNames,
        propertyPyeong: summary?.pyeong ?? null,
        propertyLivingRooms: summary?.livingRooms ?? null,
        propertyBedrooms: summary?.bedrooms ?? null,
        propertyBathrooms: summary?.bathrooms ?? null,
      }
    }),
  )
})

managerRoutes.get('/cleanings/:id', async (c) => {
  const id = c.req.param('id')
  const managerId = c.get('managerId')
  const detail = await getManagerCleaningDetail(managerId, id)

  if (!detail) {
    return c.json({ error: '청소 요청을 찾을 수 없어요.' }, 404)
  }

  return c.json(detail)
})

managerRoutes.get('/cleanings/:id/cleaning-manual', async (c) => {
  const id = c.req.param('id')
  const managerId = c.get('managerId')

  const [request] = await db
    .select({ id: cleaningRequests.id, propertyId: cleaningRequests.propertyId })
    .from(cleaningRequests)
    .where(and(
      eq(cleaningRequests.id, id),
      or(
        eq(cleaningRequests.managerId, managerId),
        and(
          eq(cleaningRequests.status, 'pending'),
          isNull(cleaningRequests.managerId),
        ),
      ),
    ))
    .limit(1)

  if (!request) {
    return c.json({ error: '청소 요청을 찾을 수 없어요.' }, 404)
  }

  const [property] = await db
    .select({ id: properties.id, name: properties.name })
    .from(properties)
    .where(eq(properties.id, request.propertyId))
    .limit(1)

  if (!property) {
    return c.json({ error: '숙소를 찾을 수 없어요.' }, 404)
  }

  const manual = await loadCleaningManual(property.id, property.name)
  const checkedRows = await db
    .select({ stepId: cleaningManualStepChecks.stepId })
    .from(cleaningManualStepChecks)
    .where(eq(cleaningManualStepChecks.cleaningRequestId, request.id))

  return c.json({
    ...manual,
    checkedStepIds: checkedRows.map((row) => row.stepId),
  })
})

const ManualCheckSchema = z.object({
  stepId: z.string().uuid(),
  checked: z.boolean(),
})

managerRoutes.post('/cleanings/:id/cleaning-manual/check', async (c) => {
  const id = c.req.param('id')
  const managerId = c.get('managerId')
  const body = await c.req.json().catch(() => null)
  const validated = ManualCheckSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [request] = await db
    .select({ id: cleaningRequests.id, propertyId: cleaningRequests.propertyId, status: cleaningRequests.status })
    .from(cleaningRequests)
    .where(and(
      eq(cleaningRequests.id, id),
      eq(cleaningRequests.managerId, managerId),
    ))
    .limit(1)

  if (!request) {
    return c.json({ error: '청소 요청을 찾을 수 없어요.' }, 404)
  }

  if (request.status !== 'in_progress') {
    return c.json({ error: '청소 진행 중에만 체크할 수 있어요.' }, 400)
  }

  const [step] = await db
    .select({ id: propertyCleaningManualSteps.id })
    .from(propertyCleaningManualSteps)
    .where(and(
      eq(propertyCleaningManualSteps.id, validated.data.stepId),
      eq(propertyCleaningManualSteps.propertyId, request.propertyId),
    ))
    .limit(1)

  if (!step) {
    return c.json({ error: '단계를 찾을 수 없어요.' }, 404)
  }

  if (validated.data.checked) {
    await db
      .insert(cleaningManualStepChecks)
      .values({ cleaningRequestId: id, stepId: validated.data.stepId })
      .onConflictDoNothing({
        target: [cleaningManualStepChecks.cleaningRequestId, cleaningManualStepChecks.stepId],
      })
  } else {
    await db
      .delete(cleaningManualStepChecks)
      .where(and(
        eq(cleaningManualStepChecks.cleaningRequestId, id),
        eq(cleaningManualStepChecks.stepId, validated.data.stepId),
      ))
  }

  return c.json({ success: true })
})

managerRoutes.get('/cleanings/:id/report', async (c) => {
  const id = c.req.param('id')
  const managerId = c.get('managerId')
  const detail = await getManagerCleaningDetail(managerId, id)

  if (!detail) {
    return c.json({ error: '청소 요청을 찾을 수 없어요.' }, 404)
  }

  const [report] = await db
    .select({
      id: cleaningInspectionReports.id,
      summaryMemo: cleaningInspectionReports.summaryMemo,
    })
    .from(cleaningInspectionReports)
    .where(eq(cleaningInspectionReports.cleaningRequestId, id))
    .limit(1)

  const assetReports = report
    ? await db
        .select({
          id: cleaningInspectionAssetReports.id,
          assetId: cleaningInspectionAssetReports.assetId,
          status: cleaningInspectionAssetReports.status,
          memo: cleaningInspectionAssetReports.memo,
        })
        .from(cleaningInspectionAssetReports)
        .where(eq(cleaningInspectionAssetReports.reportId, report.id))
    : []

  const reportPhotos = assetReports.length > 0
    ? await db
        .select({
          id: cleaningInspectionAssetPhotos.id,
          assetReportId: cleaningInspectionAssetPhotos.assetReportId,
          storagePath: cleaningInspectionAssetPhotos.storagePath,
          thumbnailStoragePath: cleaningInspectionAssetPhotos.thumbnailStoragePath,
          sortOrder: cleaningInspectionAssetPhotos.sortOrder,
        })
        .from(cleaningInspectionAssetPhotos)
        .where(inArray(cleaningInspectionAssetPhotos.assetReportId, assetReports.map((item) => item.id)))
    : []
  const reportSignedUrlMap = await createSignedUrlMap([
    ...reportPhotos.map((photo) => photo.storagePath),
    ...reportPhotos.map((photo) => photo.thumbnailStoragePath),
  ])

  return c.json({
    ...detail,
    report: {
      summaryMemo: report?.summaryMemo ?? '',
      assets: assetReports.map((item) => ({
        assetId: item.assetId,
        status: item.status,
        memo: item.memo,
        photos: reportPhotos
          .filter((photo) => photo.assetReportId === item.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((photo) => ({
            id: photo.id,
            storagePath: photo.storagePath,
            thumbnailStoragePath: photo.thumbnailStoragePath,
            signedUrl: reportSignedUrlMap.get(photo.storagePath) ?? null,
            thumbnailSignedUrl: reportSignedUrlMap.get(photo.thumbnailStoragePath) ?? null,
          })),
      })),
    },
  })
})

managerRoutes.post('/cleanings/:id/report/draft', async (c) => {
  const id = c.req.param('id')
  const managerId = c.get('managerId')
  const body = await c.req.json().catch(() => null)
  const parsed = ManagerCleaningReportDraftSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: '점검 리포트 내용이 올바르지 않아요.' }, 400)
  }

  const detail = await getManagerCleaningDetail(managerId, id)

  if (!detail) {
    return c.json({ error: '청소 요청을 찾을 수 없어요.' }, 404)
  }

  const allowedAssetIds = new Set(detail.assets.map((asset) => asset.id))
  const normalizedSummaryMemo = parsed.data.summaryMemo?.trim() || null
  const normalizedAssets = parsed.data.assets
    .filter((asset) => allowedAssetIds.has(asset.assetId))
    .map((asset) => ({
      assetId: asset.assetId,
      status: asset.status ?? null,
      memo: asset.memo?.trim() || null,
      photos: asset.photos,
    }))
  const hasAnyAssetDraft = normalizedAssets.some((asset) => asset.status || asset.memo || asset.photos.length > 0)

  const [existingReport] = await db
    .select({
      id: cleaningInspectionReports.id,
    })
    .from(cleaningInspectionReports)
    .where(eq(cleaningInspectionReports.cleaningRequestId, id))
    .limit(1)

  if (!normalizedSummaryMemo && !hasAnyAssetDraft) {
    if (existingReport) {
      await db
        .delete(cleaningInspectionReports)
        .where(eq(cleaningInspectionReports.id, existingReport.id))
    }

    return c.json({ success: true, report: null })
  }

  const report = existingReport
    ? (await db
        .update(cleaningInspectionReports)
        .set({
          summaryMemo: normalizedSummaryMemo,
          updatedAt: new Date(),
        })
        .where(eq(cleaningInspectionReports.id, existingReport.id))
        .returning({
          id: cleaningInspectionReports.id,
          summaryMemo: cleaningInspectionReports.summaryMemo,
        }))[0]
    : (await db
        .insert(cleaningInspectionReports)
        .values({
          cleaningRequestId: id,
          summaryMemo: normalizedSummaryMemo,
        })
        .returning({
          id: cleaningInspectionReports.id,
          summaryMemo: cleaningInspectionReports.summaryMemo,
        }))[0]

  const existingAssetReports = await db
    .select({
      id: cleaningInspectionAssetReports.id,
      assetId: cleaningInspectionAssetReports.assetId,
    })
    .from(cleaningInspectionAssetReports)
    .where(eq(cleaningInspectionAssetReports.reportId, report.id))
  const existingAssetReportMap = new Map(existingAssetReports.map((item) => [item.assetId, item.id]))

  for (const asset of normalizedAssets) {
    const existingAssetReportId = existingAssetReportMap.get(asset.assetId)

    if (!asset.status && !asset.memo && asset.photos.length === 0) {
      if (existingAssetReportId) {
        await db
          .delete(cleaningInspectionAssetPhotos)
          .where(eq(cleaningInspectionAssetPhotos.assetReportId, existingAssetReportId))
        await db
          .delete(cleaningInspectionAssetReports)
          .where(eq(cleaningInspectionAssetReports.id, existingAssetReportId))
      }
      continue
    }

    if (existingAssetReportId) {
      await db
        .delete(cleaningInspectionAssetPhotos)
        .where(eq(cleaningInspectionAssetPhotos.assetReportId, existingAssetReportId))
      await db
        .update(cleaningInspectionAssetReports)
        .set({
          status: asset.status,
          memo: asset.memo,
          updatedAt: new Date(),
        })
        .where(eq(cleaningInspectionAssetReports.id, existingAssetReportId))
      if (asset.photos.length > 0) {
        await db.insert(cleaningInspectionAssetPhotos).values(
          asset.photos.map((photo, index) => ({
            assetReportId: existingAssetReportId,
            storagePath: photo.storagePath,
            thumbnailStoragePath: photo.thumbnailStoragePath,
            sortOrder: index,
          })),
        )
      }
      continue
    }

    const [inserted] = await db
      .insert(cleaningInspectionAssetReports)
      .values({
        reportId: report.id,
        assetId: asset.assetId,
        status: asset.status,
        memo: asset.memo,
      })
      .returning({ id: cleaningInspectionAssetReports.id })

    if (asset.photos.length > 0) {
      await db.insert(cleaningInspectionAssetPhotos).values(
        asset.photos.map((photo, index) => ({
          assetReportId: inserted.id,
          storagePath: photo.storagePath,
          thumbnailStoragePath: photo.thumbnailStoragePath,
          sortOrder: index,
        })),
      )
    }
  }

  const savedAssetReports = await db
    .select({
      id: cleaningInspectionAssetReports.id,
      assetId: cleaningInspectionAssetReports.assetId,
      status: cleaningInspectionAssetReports.status,
      memo: cleaningInspectionAssetReports.memo,
    })
    .from(cleaningInspectionAssetReports)
    .where(eq(cleaningInspectionAssetReports.reportId, report.id))

  const savedPhotos = savedAssetReports.length > 0
    ? await db
        .select({
          id: cleaningInspectionAssetPhotos.id,
          assetReportId: cleaningInspectionAssetPhotos.assetReportId,
          storagePath: cleaningInspectionAssetPhotos.storagePath,
          thumbnailStoragePath: cleaningInspectionAssetPhotos.thumbnailStoragePath,
          sortOrder: cleaningInspectionAssetPhotos.sortOrder,
        })
        .from(cleaningInspectionAssetPhotos)
        .where(inArray(cleaningInspectionAssetPhotos.assetReportId, savedAssetReports.map((item) => item.id)))
    : []

  return c.json({
    success: true,
    report: {
      summaryMemo: report.summaryMemo ?? '',
      assets: savedAssetReports.map((item) => ({
        assetId: item.assetId,
        status: item.status,
        memo: item.memo,
        photos: savedPhotos
          .filter((photo) => photo.assetReportId === item.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((photo) => ({
            id: photo.id,
            storagePath: photo.storagePath,
            thumbnailStoragePath: photo.thumbnailStoragePath,
            signedUrl: null,
            thumbnailSignedUrl: null,
          })),
      })),
    },
  })
})

managerRoutes.post('/cleanings/:id/status', async (c) => {
  const id = c.req.param('id')
  const managerId = c.get('managerId')
  const body = await c.req.json().catch(() => null)
  const parsed = ManagerCleaningStatusUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: '변경할 상태가 올바르지 않아요.' }, 400)
  }

  const [request] = await db
    .select({
      id: cleaningRequests.id,
      status: cleaningRequests.status,
      hostId: cleaningRequests.hostId,
      propertyId: cleaningRequests.propertyId,
      serviceType: cleaningRequests.serviceType,
      propertyName: properties.name,
    })
    .from(cleaningRequests)
    .leftJoin(properties, eq(cleaningRequests.propertyId, properties.id))
    .where(and(eq(cleaningRequests.id, id), eq(cleaningRequests.managerId, managerId)))
    .limit(1)

  if (!request) {
    return c.json({ error: '청소 요청을 찾을 수 없어요.' }, 404)
  }

  if (parsed.data.status === 'in_progress' && request.status !== 'confirmed') {
    return c.json({ error: '배정 완료된 요청만 시작할 수 있어요.' }, 400)
  }

  if (parsed.data.status === 'completed' && request.status !== 'in_progress') {
    return c.json({ error: '진행 중인 요청만 완료할 수 있어요.' }, 400)
  }

  // Validate photo completeness — depends on service type
  if (parsed.data.status === 'in_progress' || parsed.data.status === 'completed') {
    if (request.serviceType === 'ac') {
      const linkedAssets = await db
        .select({ assetId: cleaningRequestAssets.assetId })
        .from(cleaningRequestAssets)
        .where(eq(cleaningRequestAssets.cleaningRequestId, id))

      if (linkedAssets.length === 0) {
        return c.json({ error: '청소할 에어컨이 등록되어 있지 않아요.' }, 400)
      }

      const pairRows = await db
        .select({
          propertyAssetId: cleaningRequestPhotos.propertyAssetId,
          kind: cleaningRequestPhotos.kind,
        })
        .from(cleaningRequestPhotos)
        .where(eq(cleaningRequestPhotos.cleaningRequestId, id))

      const requiredKind = parsed.data.status === 'in_progress' ? 'before' : 'after'
      const withKind = new Set(
        pairRows
          .filter((p) => p.kind === requiredKind && p.propertyAssetId)
          .map((p) => p.propertyAssetId as string),
      )
      const missing = linkedAssets.filter((row) => !withKind.has(row.assetId))
      if (missing.length > 0) {
        return c.json({
          error: requiredKind === 'before'
            ? '모든 에어컨의 청소 전 사진을 올려야 시작할 수 있어요.'
            : '모든 에어컨의 청소 후 사진을 올려야 완료할 수 있어요.',
        }, 400)
      }
    } else {
      const propertySpaceRows = await db
        .select({ id: propertySpaces.id, category: propertySpaces.category })
        .from(propertySpaces)
        .where(eq(propertySpaces.propertyId, request.propertyId))

      const propertySpaceList = propertySpaceRows.filter((space) => isPhotoSpaceCategory(space.category))

      if (propertySpaceList.length === 0) {
        return c.json({ error: '청소 사진 대상 공간(거실/침실/화장실)이 등록되어 있지 않아요.' }, 400)
      }

      if (parsed.data.status === 'in_progress') {
        const beforePhotos = await db
          .select({ propertySpaceId: cleaningRequestPhotos.propertySpaceId })
          .from(cleaningRequestPhotos)
          .where(and(
            eq(cleaningRequestPhotos.cleaningRequestId, id),
            eq(cleaningRequestPhotos.kind, 'before'),
          ))
        const withBefore = new Set(
          beforePhotos.map((p) => p.propertySpaceId).filter((v): v is string => v !== null),
        )
        const missing = propertySpaceList.filter((space) => !withBefore.has(space.id))
        if (missing.length > 0) {
          return c.json({
            error: '모든 공간의 청소 전 사진을 1장 이상 올려야 시작할 수 있어요.',
          }, 400)
        }
      } else {
        const pairRows = await db
          .select({
            propertySpaceId: cleaningRequestPhotos.propertySpaceId,
            kind: cleaningRequestPhotos.kind,
            sortOrder: cleaningRequestPhotos.sortOrder,
          })
          .from(cleaningRequestPhotos)
          .where(eq(cleaningRequestPhotos.cleaningRequestId, id))

        const beforeKeys = new Set<string>()
        const afterKeys = new Set<string>()
        for (const row of pairRows) {
          if (!row.propertySpaceId) continue
          const key = `${row.propertySpaceId}|${row.sortOrder}`
          if (row.kind === 'before') beforeKeys.add(key)
          else afterKeys.add(key)
        }
        const missingPair = [...beforeKeys].filter((key) => !afterKeys.has(key))
        if (missingPair.length > 0) {
          return c.json({
            error: '모든 청소 전 사진에 대응하는 청소 후 사진을 올려야 완료할 수 있어요.',
          }, 400)
        }
      }
    }
  }

  if (parsed.data.status === 'completed') {
    const manualSteps = await db
      .select({ id: propertyCleaningManualSteps.id })
      .from(propertyCleaningManualSteps)
      .where(eq(propertyCleaningManualSteps.propertyId, request.propertyId))

    if (manualSteps.length > 0) {
      const checks = await db
        .select({ stepId: cleaningManualStepChecks.stepId })
        .from(cleaningManualStepChecks)
        .where(eq(cleaningManualStepChecks.cleaningRequestId, id))
      const checkedSet = new Set(checks.map((c) => c.stepId))
      const missing = manualSteps.filter((step) => !checkedSet.has(step.id))
      if (missing.length > 0) {
        return c.json({
          error: '청소 매뉴얼의 모든 단계를 체크해야 완료할 수 있어요.',
        }, 400)
      }
    }
  }

  const [updated] = await db
    .update(cleaningRequests)
    .set({
      status: parsed.data.status,
      updatedAt: new Date(),
    })
    .where(eq(cleaningRequests.id, id))
    .returning({
      id: cleaningRequests.id,
      status: cleaningRequests.status,
    })

  if (updated.status === 'in_progress') {
    await notifyCleaningStarted({
      cleaningRequestId: updated.id,
      hostProfileId: request.hostId,
      propertyName: request.propertyName || '숙소',
    })
  }

  if (updated.status === 'completed') {
    await notifyCleaningCompleted({
      cleaningRequestId: updated.id,
      hostProfileId: request.hostId,
      propertyName: request.propertyName || '숙소',
    })
  }

  return c.json(updated)
})

managerRoutes.post('/cleanings/:id/claim', async (c) => {
  const id = c.req.param('id')
  const managerId = c.get('managerId')

  const [claimable] = await db
    .select({ id: cleaningRequests.id })
    .from(cleaningRequests)
    .leftJoin(properties, eq(cleaningRequests.propertyId, properties.id))
    .where(and(
      eq(cleaningRequests.id, id),
      eq(cleaningRequests.status, 'pending'),
      isNull(cleaningRequests.managerId),
      isNull(properties.deletedAt),
    ))
    .limit(1)

  if (!claimable) {
    return c.json({ error: '다른 매니저가 먼저 배정했어요.' }, 409)
  }

  const [claimed] = await db
    .update(cleaningRequests)
    .set({
      managerId,
      status: 'confirmed',
      updatedAt: new Date(),
    })
    .where(and(
      eq(cleaningRequests.id, id),
      eq(cleaningRequests.status, 'pending'),
      isNull(cleaningRequests.managerId),
    ))
    .returning({ id: cleaningRequests.id })

  if (!claimed) {
    return c.json({ error: '다른 매니저가 먼저 배정했어요.' }, 409)
  }

  const [detail] = await db
    .select({
      hostId: cleaningRequests.hostId,
      managerId: cleaningRequests.managerId,
      scheduledDate: cleaningRequests.scheduledDate,
      scheduledTime: cleaningRequests.scheduledTime,
      propertyName: properties.name,
      managerName: managers.name,
    })
    .from(cleaningRequests)
    .leftJoin(properties, eq(cleaningRequests.propertyId, properties.id))
    .leftJoin(managers, eq(cleaningRequests.managerId, managers.id))
    .where(eq(cleaningRequests.id, id))
    .limit(1)

  if (detail) {
    await notifyCleaningAssigned({
      cleaningRequestId: claimed.id,
      hostProfileId: detail.hostId,
      managerId: detail.managerId,
      propertyName: detail.propertyName || '숙소',
      scheduledDate: detail.scheduledDate,
      scheduledTime: detail.scheduledTime,
      managerName: detail.managerName || '매니저',
    })
  }

  return c.json({ success: true, id: claimed.id })
})

// ─── 수리 요청 ─────────────────────────────────────────────────────────────

const RepairQuoteSchema = z.object({
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  quotedCost: z.number().int().positive(),
  quoteNote: z.string().optional(),
})

const RepairCompletionPhotoUploadSchema = z.object({
  fileName: z.string().min(1),
})

const RepairCompletionPhotoSchema = z.object({
  storagePath: z.string().min(1),
  thumbnailStoragePath: z.string().min(1),
})

const RepairCompletionSchema = z.object({
  actionNotes: z.string().min(1, { message: '조치 내용을 입력해주세요.' }).trim(),
  additionalNotes: z.string().optional(),
  photos: z.array(RepairCompletionPhotoSchema).min(1, { message: '완료 사진을 최소 1장 첨부해주세요.' }),
})

async function getManagerRepairDetail(id: string) {
  const [request] = await db
    .select({
      id: repairRequests.id,
      propertyId: repairRequests.propertyId,
      hostId: repairRequests.hostId,
      managerId: repairRequests.managerId,
      status: repairRequests.status,
      description: repairRequests.description,
      preferredScheduledDate: repairRequests.preferredScheduledDate,
      preferredScheduledTime: repairRequests.preferredScheduledTime,
      scheduledDate: repairRequests.scheduledDate,
      scheduledTime: repairRequests.scheduledTime,
      quotedCost: repairRequests.quotedCost,
      quoteNote: repairRequests.quoteNote,
      quotedAt: repairRequests.quotedAt,
      confirmedAt: repairRequests.confirmedAt,
      startedAt: repairRequests.startedAt,
      completedAt: repairRequests.completedAt,
      cancelledAt: repairRequests.cancelledAt,
      createdAt: repairRequests.createdAt,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyAddressDetail: properties.addressDetail,
    })
    .from(repairRequests)
    .leftJoin(properties, eq(repairRequests.propertyId, properties.id))
    .where(eq(repairRequests.id, id))
    .limit(1)

  if (!request) return null

  const reqPhotos = await db
    .select({
      id: repairRequestPhotos.id,
      storagePath: repairRequestPhotos.storagePath,
      thumbnailStoragePath: repairRequestPhotos.thumbnailStoragePath,
      sortOrder: repairRequestPhotos.sortOrder,
    })
    .from(repairRequestPhotos)
    .where(eq(repairRequestPhotos.repairRequestId, id))

  const linkedAssets = await db
    .select({
      id: propertyAssets.id,
      category: propertyAssets.category,
      name: propertyAssets.name,
      location: propertyAssets.location,
      brand: propertyAssets.brand,
      modelNumber: propertyAssets.modelNumber,
      purchaseUrl: propertyAssets.purchaseUrl,
      notes: propertyAssets.notes,
    })
    .from(repairRequestAssets)
    .innerJoin(propertyAssets, eq(repairRequestAssets.assetId, propertyAssets.id))
    .where(eq(repairRequestAssets.repairRequestId, id))

  const assetIds = linkedAssets.map((a) => a.id)
  const assetPhotos = assetIds.length > 0
    ? await db
      .select({
        fixtureId: propertyAssetPhotos.fixtureId,
        storagePath: propertyAssetPhotos.storagePath,
        thumbnailStoragePath: propertyAssetPhotos.thumbnailStoragePath,
        sortOrder: propertyAssetPhotos.sortOrder,
      })
      .from(propertyAssetPhotos)
      .where(inArray(propertyAssetPhotos.fixtureId, assetIds))
    : []

  const [report] = await db
    .select({
      id: repairCompletionReports.id,
      actionNotes: repairCompletionReports.actionNotes,
      additionalNotes: repairCompletionReports.additionalNotes,
      createdAt: repairCompletionReports.createdAt,
    })
    .from(repairCompletionReports)
    .where(eq(repairCompletionReports.repairRequestId, id))
    .limit(1)

  const reportPhotos = report
    ? await db
      .select({
        id: repairCompletionPhotos.id,
        storagePath: repairCompletionPhotos.storagePath,
        thumbnailStoragePath: repairCompletionPhotos.thumbnailStoragePath,
        sortOrder: repairCompletionPhotos.sortOrder,
      })
      .from(repairCompletionPhotos)
      .where(eq(repairCompletionPhotos.completionReportId, report.id))
    : []

  const signedUrlMap = await createSignedUrlMap([
    ...reqPhotos.map((p) => p.storagePath),
    ...reqPhotos.map((p) => p.thumbnailStoragePath),
    ...assetPhotos.map((p) => p.storagePath),
    ...assetPhotos.map((p) => p.thumbnailStoragePath),
    ...reportPhotos.map((p) => p.storagePath),
    ...reportPhotos.map((p) => p.thumbnailStoragePath),
  ])

  return {
    ...request,
    photos: reqPhotos
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((photo) => ({
        id: photo.id,
        storagePath: photo.storagePath,
        thumbnailStoragePath: photo.thumbnailStoragePath,
        signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
        thumbnailSignedUrl: signedUrlMap.get(photo.thumbnailStoragePath) ?? null,
      })),
    assets: linkedAssets.map((asset) => ({
      ...asset,
      photos: assetPhotos
        .filter((p) => p.fixtureId === asset.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((photo) => ({
          storagePath: photo.storagePath,
          thumbnailStoragePath: photo.thumbnailStoragePath,
          signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
          thumbnailSignedUrl: signedUrlMap.get(photo.thumbnailStoragePath) ?? null,
        })),
    })),
    completionReport: report
      ? {
          id: report.id,
          actionNotes: report.actionNotes,
          additionalNotes: report.additionalNotes,
          createdAt: report.createdAt,
          photos: reportPhotos
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((photo) => ({
              id: photo.id,
              storagePath: photo.storagePath,
              thumbnailStoragePath: photo.thumbnailStoragePath,
              signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
              thumbnailSignedUrl: signedUrlMap.get(photo.thumbnailStoragePath) ?? null,
            })),
        }
      : null,
  }
}

// 담당 없는 신규 수리 요청 (submitted, 자유 픽업)
managerRoutes.get('/repairs/open', async (c) => {
  const result = await db
    .select({
      id: repairRequests.id,
      status: repairRequests.status,
      description: repairRequests.description,
      preferredScheduledDate: repairRequests.preferredScheduledDate,
      preferredScheduledTime: repairRequests.preferredScheduledTime,
      createdAt: repairRequests.createdAt,
      propertyId: properties.id,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyAddressDetail: properties.addressDetail,
    })
    .from(repairRequests)
    .leftJoin(properties, eq(repairRequests.propertyId, properties.id))
    .where(and(
      eq(repairRequests.status, 'submitted'),
      isNull(repairRequests.managerId),
      isNull(properties.deletedAt),
    ))
    .orderBy(asc(repairRequests.preferredScheduledDate), asc(repairRequests.preferredScheduledTime), desc(repairRequests.createdAt))

  return c.json(result)
})

// 내가 담당하는 수리 목록
managerRoutes.get('/repairs/me', async (c) => {
  const managerId = c.get('managerId')

  const result = await db
    .select({
      id: repairRequests.id,
      status: repairRequests.status,
      description: repairRequests.description,
      preferredScheduledDate: repairRequests.preferredScheduledDate,
      preferredScheduledTime: repairRequests.preferredScheduledTime,
      scheduledDate: repairRequests.scheduledDate,
      scheduledTime: repairRequests.scheduledTime,
      quotedCost: repairRequests.quotedCost,
      createdAt: repairRequests.createdAt,
      propertyId: properties.id,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyAddressDetail: properties.addressDetail,
    })
    .from(repairRequests)
    .leftJoin(properties, eq(repairRequests.propertyId, properties.id))
    .where(and(
      eq(repairRequests.managerId, managerId),
      ne(repairRequests.status, 'cancelled'),
    ))
    .orderBy(desc(repairRequests.createdAt))

  return c.json(result)
})

// 상세
managerRoutes.get('/repairs/:id', async (c) => {
  const id = c.req.param('id')
  const detail = await getManagerRepairDetail(id)

  if (!detail) {
    return c.json({ error: '수리 요청을 찾을 수 없어요.' }, 404)
  }

  return c.json(detail)
})

// 픽업 (submitted → 매니저 배정)
managerRoutes.post('/repairs/:id/claim', async (c) => {
  const id = c.req.param('id')
  const managerId = c.get('managerId')

  const [claimable] = await db
    .select({ id: repairRequests.id })
    .from(repairRequests)
    .leftJoin(properties, eq(repairRequests.propertyId, properties.id))
    .where(and(
      eq(repairRequests.id, id),
      eq(repairRequests.status, 'submitted'),
      isNull(repairRequests.managerId),
      isNull(properties.deletedAt),
    ))
    .limit(1)

  if (!claimable) {
    return c.json({ error: '다른 매니저가 먼저 배정했어요.' }, 409)
  }

  const [claimed] = await db
    .update(repairRequests)
    .set({
      managerId,
      updatedAt: new Date(),
    })
    .where(and(
      eq(repairRequests.id, id),
      eq(repairRequests.status, 'submitted'),
      isNull(repairRequests.managerId),
    ))
    .returning({ id: repairRequests.id })

  if (!claimed) {
    return c.json({ error: '다른 매니저가 먼저 배정했어요.' }, 409)
  }

  return c.json({ success: true, id: claimed.id })
})

// 견적 + 확정 일정 발송 (submitted/quoted → quoted)
managerRoutes.post('/repairs/:id/quote', async (c) => {
  const id = c.req.param('id')
  const managerId = c.get('managerId')
  const body = await c.req.json().catch(() => null)
  const validated = RepairQuoteSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [request] = await db
    .select({ id: repairRequests.id, status: repairRequests.status, orderId: repairRequests.orderId })
    .from(repairRequests)
    .where(and(eq(repairRequests.id, id), eq(repairRequests.managerId, managerId)))
    .limit(1)

  if (!request) {
    return c.json({ error: '수리 요청을 찾을 수 없어요.' }, 404)
  }

  if (!['submitted', 'quoted'].includes(request.status)) {
    return c.json({ error: '견적을 발송할 수 없는 상태에요.' }, 400)
  }

  const now = new Date()

  // 처음 발송 시 orderId 생성 (재발송 시 기존 orderId 유지)
  const orderId = request.orderId ?? `rep-${crypto.randomUUID().slice(0, 8)}-${Date.now()}`

  const [updated] = await db
    .update(repairRequests)
    .set({
      status: 'quoted',
      scheduledDate: validated.data.scheduledDate,
      scheduledTime: validated.data.scheduledTime,
      quotedCost: validated.data.quotedCost,
      quoteNote: validated.data.quoteNote || null,
      orderId,
      quotedAt: request.status === 'submitted' ? now : undefined,
      updatedAt: now,
    })
    .where(eq(repairRequests.id, id))
    .returning()

  const [property] = await db
    .select({ name: properties.name })
    .from(properties)
    .where(eq(properties.id, updated.propertyId))
    .limit(1)

  await notifyRepairQuoted({
    repairRequestId: updated.id,
    hostProfileId: updated.hostId,
    propertyName: property?.name || '숙소',
    quotedCost: validated.data.quotedCost,
    scheduledDate: validated.data.scheduledDate,
    scheduledTime: validated.data.scheduledTime,
  })

  return c.json(updated)
})

// 작업 시작 (confirmed → in_progress)
managerRoutes.post('/repairs/:id/start', async (c) => {
  const id = c.req.param('id')
  const managerId = c.get('managerId')

  const [request] = await db
    .select({ id: repairRequests.id, status: repairRequests.status })
    .from(repairRequests)
    .where(and(eq(repairRequests.id, id), eq(repairRequests.managerId, managerId)))
    .limit(1)

  if (!request) {
    return c.json({ error: '수리 요청을 찾을 수 없어요.' }, 404)
  }

  if (request.status !== 'confirmed') {
    return c.json({ error: '결제 완료된 요청만 시작할 수 있어요.' }, 400)
  }

  const now = new Date()
  const [updated] = await db
    .update(repairRequests)
    .set({ status: 'in_progress', startedAt: now, updatedAt: now })
    .where(eq(repairRequests.id, id))
    .returning()

  const [property] = await db
    .select({ name: properties.name })
    .from(properties)
    .where(eq(properties.id, updated.propertyId))
    .limit(1)

  await notifyRepairStarted({
    repairRequestId: updated.id,
    hostProfileId: updated.hostId,
    propertyName: property?.name || '숙소',
  })

  return c.json(updated)
})

// 완료 보고서 사진 업로드 URL
managerRoutes.post('/repairs/:id/complete-report/upload-url', async (c) => {
  const id = c.req.param('id')
  const managerId = c.get('managerId')
  const body = await c.req.json().catch(() => null)
  const validated = RepairCompletionPhotoUploadSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [request] = await db
    .select({ id: repairRequests.id, status: repairRequests.status })
    .from(repairRequests)
    .where(and(eq(repairRequests.id, id), eq(repairRequests.managerId, managerId)))
    .limit(1)

  if (!request) {
    return c.json({ error: '수리 요청을 찾을 수 없어요.' }, 404)
  }

  if (!['in_progress', 'completed'].includes(request.status)) {
    return c.json({ error: '작업 진행 중이거나 완료된 요청만 사진을 첨부할 수 있어요.' }, 400)
  }

  const extension = validated.data.fileName.includes('.')
    ? validated.data.fileName.slice(validated.data.fileName.lastIndexOf('.')).toLowerCase()
    : '.jpg'
  const safeExtension = extension.match(/^\.[a-z0-9]+$/) ? extension : '.jpg'
  const fileId = crypto.randomUUID()
  const storagePath = `repairs/${id}/completion/original/${fileId}${safeExtension}`
  const thumbnailStoragePath = `repairs/${id}/completion/thumb/${fileId}.jpg`

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

// 완료 보고서 저장/수정
managerRoutes.post('/repairs/:id/complete', async (c) => {
  const id = c.req.param('id')
  const managerId = c.get('managerId')
  const body = await c.req.json().catch(() => null)
  const validated = RepairCompletionSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [request] = await db
    .select({ id: repairRequests.id, status: repairRequests.status })
    .from(repairRequests)
    .where(and(eq(repairRequests.id, id), eq(repairRequests.managerId, managerId)))
    .limit(1)

  if (!request) {
    return c.json({ error: '수리 요청을 찾을 수 없어요.' }, 404)
  }

  if (!['in_progress', 'completed'].includes(request.status)) {
    return c.json({ error: '작업 진행 중이거나 완료된 요청만 보고서를 저장할 수 있어요.' }, 400)
  }

  const now = new Date()

  // upsert: 기존 보고서 있으면 덮어씀
  const [existingReport] = await db
    .select({ id: repairCompletionReports.id })
    .from(repairCompletionReports)
    .where(eq(repairCompletionReports.repairRequestId, id))
    .limit(1)

  let reportId: string
  if (existingReport) {
    await db
      .update(repairCompletionReports)
      .set({
        actionNotes: validated.data.actionNotes,
        additionalNotes: validated.data.additionalNotes || null,
        updatedAt: now,
      })
      .where(eq(repairCompletionReports.id, existingReport.id))
    await db
      .delete(repairCompletionPhotos)
      .where(eq(repairCompletionPhotos.completionReportId, existingReport.id))
    reportId = existingReport.id
  } else {
    const [created] = await db
      .insert(repairCompletionReports)
      .values({
        repairRequestId: id,
        actionNotes: validated.data.actionNotes,
        additionalNotes: validated.data.additionalNotes || null,
      })
      .returning({ id: repairCompletionReports.id })
    reportId = created.id
  }

  await db.insert(repairCompletionPhotos).values(
    validated.data.photos.map((photo, index) => ({
      completionReportId: reportId,
      storagePath: photo.storagePath,
      thumbnailStoragePath: photo.thumbnailStoragePath,
      sortOrder: index,
    })),
  )

  const [updated] = await db
    .update(repairRequests)
    .set({
      status: 'completed',
      completedAt: request.status === 'completed' ? undefined : now,
      updatedAt: now,
    })
    .where(eq(repairRequests.id, id))
    .returning()

  const [property] = await db
    .select({ name: properties.name })
    .from(properties)
    .where(eq(properties.id, updated.propertyId))
    .limit(1)

  await notifyRepairCompleted({
    repairRequestId: updated.id,
    hostProfileId: updated.hostId,
    propertyName: property?.name || '숙소',
  })

  return c.json(updated)
})
