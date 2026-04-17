import { Hono } from 'hono'
import { createClient } from '@supabase/supabase-js'
import { and, asc, desc, eq, inArray, isNull, ne } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import {
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
  propertySpaces,
  propertySpacePhotos,
} from '@/db/schema'
import { authMiddleware, type AuthEnv } from '../middleware/auth'
import { summarizeSpaces, summarizeSpacesByProperty } from '@/lib/property-space-summary'

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
  phone: z.string().min(1),
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
const CleaningPhotoUploadSchema = z.object({
  fileName: z.string().min(1),
})
const ReportPhotoSchema = z.object({
  storagePath: z.string().min(1),
  thumbnailStoragePath: z.string().min(1),
})
const CleaningPhotoSchema = z.object({
  storagePath: z.string().min(1),
  thumbnailStoragePath: z.string().min(1),
})
const CleaningPhotosDraftSchema = z.object({
  photos: z.array(CleaningPhotoSchema).default([]),
})
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

async function getManagerCleaningDetail(managerId: string, id: string) {
  const [request] = await db
    .select({
      id: cleaningRequests.id,
      status: cleaningRequests.status,
      scheduledDate: cleaningRequests.scheduledDate,
      scheduledTime: cleaningRequests.scheduledTime,
      cleaningType: cleaningRequests.cleaningType,
      memo: cleaningRequests.memo,
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
    })
    .from(cleaningRequests)
    .innerJoin(properties, eq(cleaningRequests.propertyId, properties.id))
    .where(and(
      eq(cleaningRequests.id, id),
      eq(cleaningRequests.managerId, managerId),
      isNull(properties.deletedAt),
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
      floor: propertySpaces.floor,
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
      storagePath: cleaningRequestPhotos.storagePath,
      thumbnailStoragePath: cleaningRequestPhotos.thumbnailStoragePath,
      sortOrder: cleaningRequestPhotos.sortOrder,
    })
    .from(cleaningRequestPhotos)
    .where(eq(cleaningRequestPhotos.cleaningRequestId, request.id))
  const summary = summarizeSpaces(spaces)
  const propertySpaceNames = spaces.map((space) => space.name)

  const signedUrlMap = await createSignedUrlMap([
    ...requestPhotos.map((photo) => photo.storagePath),
    ...spacePhotos.map((photo) => photo.storagePath),
    ...assetPhotos.map((photo) => photo.storagePath),
  ])
  const thumbnailSignedUrlMap = await createSignedUrlMap([
    ...requestPhotos.map((photo) => photo.thumbnailStoragePath),
    ...spacePhotos.map((photo) => photo.thumbnailStoragePath),
    ...assetPhotos.map((photo) => photo.thumbnailStoragePath),
  ])

  return {
    ...request,
    propertySpaceNames,
    propertyPyeong: summary.pyeong,
    propertyLivingRooms: summary.livingRooms,
    propertyBedrooms: summary.bedrooms,
    propertyBathrooms: summary.bathrooms,
    cleaningPhotos: requestPhotos
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((photo) => ({
        ...photo,
        signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
        thumbnailSignedUrl: thumbnailSignedUrlMap.get(photo.thumbnailStoragePath) ?? null,
      })),
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

  const [request] = await db
    .select({ id: cleaningRequests.id, status: cleaningRequests.status })
    .from(cleaningRequests)
    .where(and(eq(cleaningRequests.id, id), eq(cleaningRequests.managerId, managerId)))
    .limit(1)

  if (!request) {
    return c.json({ error: '청소 요청을 찾을 수 없어요.' }, 404)
  }

  if (request.status !== 'in_progress') {
    return c.json({ error: '청소 진행 중일 때만 사진을 첨부할 수 있어요.' }, 400)
  }

  const extension = validated.data.fileName.includes('.')
    ? validated.data.fileName.slice(validated.data.fileName.lastIndexOf('.')).toLowerCase()
    : '.jpg'
  const safeExtension = extension.match(/^\.[a-z0-9]+$/) ? extension : '.jpg'
  const fileId = crypto.randomUUID()
  const storagePath = `cleanings/${id}/photos/original/${fileId}${safeExtension}`
  const thumbnailStoragePath = `cleanings/${id}/photos/thumb/${fileId}.jpg`
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

  const [request] = await db
    .select({ id: cleaningRequests.id, status: cleaningRequests.status })
    .from(cleaningRequests)
    .where(and(eq(cleaningRequests.id, id), eq(cleaningRequests.managerId, managerId)))
    .limit(1)

  if (!request) {
    return c.json({ error: '청소 요청을 찾을 수 없어요.' }, 404)
  }

  if (request.status !== 'in_progress') {
    return c.json({ error: '청소 진행 중일 때만 사진을 저장할 수 있어요.' }, 400)
  }

  await db.delete(cleaningRequestPhotos).where(eq(cleaningRequestPhotos.cleaningRequestId, id))

  if (parsed.data.photos.length > 0) {
    await db.insert(cleaningRequestPhotos).values(
      parsed.data.photos.map((photo, index) => ({
        cleaningRequestId: id,
        storagePath: photo.storagePath,
        thumbnailStoragePath: photo.thumbnailStoragePath,
        sortOrder: index,
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
    .where(eq(cleaningRequestPhotos.cleaningRequestId, id))

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
      memo: cleaningRequests.memo,
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
      memo: cleaningRequests.memo,
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
    })
    .from(cleaningRequests)
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

  return c.json({ success: true, id: claimed.id })
})
