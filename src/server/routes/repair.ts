import { Hono } from 'hono'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { and, desc, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '@/db'
import {
  managers,
  profiles,
  properties,
  propertyAssets,
  propertyAssetPhotos,
  repairCompletionPhotos,
  repairCompletionReports,
  repairRequestAssets,
  repairRequestPhotos,
  repairRequests,
} from '@/db/schema'
import { authMiddleware, type AuthEnv } from '../middleware/auth'

const PhotoUploadSchema = z.object({
  fileName: z.string().min(1),
})

const PhotoInputSchema = z.object({
  storagePath: z.string().min(1),
  thumbnailStoragePath: z.string().min(1),
})

const RepairRequestCreateSchema = z.object({
  propertyId: z.string().uuid(),
  description: z.string().min(1, { message: '상세 설명을 입력해주세요.' }).trim(),
  preferredScheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredScheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  assetIds: z.array(z.string().uuid()).default([]),
  photos: z.array(PhotoInputSchema).default([]),
})

const ConfirmPaymentSchema = z.object({
  paymentKey: z.string(),
  orderId: z.string(),
  amount: z.number(),
})

export const repairRoutes = new Hono<AuthEnv>()

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

repairRoutes.use('*', authMiddleware)

// 호스트의 수리 요청 목록
repairRoutes.get('/', async (c) => {
  const profileId = c.get('profileId')

  const result = await db
    .select({
      id: repairRequests.id,
      propertyId: repairRequests.propertyId,
      hostId: repairRequests.hostId,
      status: repairRequests.status,
      description: repairRequests.description,
      preferredScheduledDate: repairRequests.preferredScheduledDate,
      preferredScheduledTime: repairRequests.preferredScheduledTime,
      scheduledDate: repairRequests.scheduledDate,
      scheduledTime: repairRequests.scheduledTime,
      quotedCost: repairRequests.quotedCost,
      quoteNote: repairRequests.quoteNote,
      orderId: repairRequests.orderId,
      paymentKey: repairRequests.paymentKey,
      createdAt: repairRequests.createdAt,
      cancelledAt: repairRequests.cancelledAt,
      propertyName: properties.name,
      propertyAddress: properties.address,
    })
    .from(repairRequests)
    .leftJoin(properties, eq(repairRequests.propertyId, properties.id))
    .where(eq(repairRequests.hostId, profileId))
    .orderBy(desc(repairRequests.createdAt))

  return c.json(result)
})

// 상세
repairRoutes.get('/:id', async (c) => {
  const profileId = c.get('profileId')
  const id = c.req.param('id')

  const [request] = await db
    .select({
      id: repairRequests.id,
      propertyId: repairRequests.propertyId,
      hostId: repairRequests.hostId,
      status: repairRequests.status,
      description: repairRequests.description,
      preferredScheduledDate: repairRequests.preferredScheduledDate,
      preferredScheduledTime: repairRequests.preferredScheduledTime,
      scheduledDate: repairRequests.scheduledDate,
      scheduledTime: repairRequests.scheduledTime,
      quotedCost: repairRequests.quotedCost,
      quoteNote: repairRequests.quoteNote,
      orderId: repairRequests.orderId,
      paymentKey: repairRequests.paymentKey,
      quotedAt: repairRequests.quotedAt,
      confirmedAt: repairRequests.confirmedAt,
      startedAt: repairRequests.startedAt,
      completedAt: repairRequests.completedAt,
      cancelledAt: repairRequests.cancelledAt,
      createdAt: repairRequests.createdAt,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyAddressDetail: properties.addressDetail,
      managerName: managers.name,
      managerPhone: managers.phone,
      managerAvatarStoragePath: profiles.avatarStoragePath,
      managerAvatarThumbnailStoragePath: profiles.avatarThumbnailStoragePath,
    })
    .from(repairRequests)
    .leftJoin(properties, eq(repairRequests.propertyId, properties.id))
    .leftJoin(managers, eq(repairRequests.managerId, managers.id))
    .leftJoin(profiles, eq(managers.profileId, profiles.id))
    .where(and(eq(repairRequests.id, id), eq(repairRequests.hostId, profileId)))
    .limit(1)

  if (!request) {
    return c.json({ error: '수리 요청을 찾을 수 없어요' }, 404)
  }

  const requestPhotos = await db
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
    })
    .from(repairRequestAssets)
    .innerJoin(propertyAssets, eq(repairRequestAssets.assetId, propertyAssets.id))
    .where(eq(repairRequestAssets.repairRequestId, id))

  const assetIds = linkedAssets.map((a) => a.id)
  const assetThumbPhotos = assetIds.length > 0
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

  const signedUrlMap = await createSignedUrlMap(
    [
      request.managerAvatarStoragePath,
      request.managerAvatarThumbnailStoragePath,
      ...requestPhotos.map((p) => p.storagePath),
      ...requestPhotos.map((p) => p.thumbnailStoragePath),
      ...assetThumbPhotos.map((p) => p.storagePath),
      ...assetThumbPhotos.map((p) => p.thumbnailStoragePath),
    ].filter((path): path is string => !!path),
  )

  const assetPhotoMap = new Map<string, { signedUrl: string | null; thumbnailSignedUrl: string | null }>()
  for (const assetId of assetIds) {
    const first = assetThumbPhotos
      .filter((p) => p.fixtureId === assetId)
      .sort((a, b) => a.sortOrder - b.sortOrder)[0]
    if (first) {
      assetPhotoMap.set(assetId, {
        signedUrl: signedUrlMap.get(first.storagePath) ?? null,
        thumbnailSignedUrl: signedUrlMap.get(first.thumbnailStoragePath) ?? null,
      })
    }
  }

  return c.json({
    ...request,
    managerAvatarSignedUrl: request.managerAvatarStoragePath
      ? signedUrlMap.get(request.managerAvatarStoragePath) ?? null
      : null,
    managerAvatarThumbnailSignedUrl: request.managerAvatarThumbnailStoragePath
      ? signedUrlMap.get(request.managerAvatarThumbnailStoragePath) ?? null
      : null,
    photos: requestPhotos
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((photo) => ({
        id: photo.id,
        storagePath: photo.storagePath,
        thumbnailStoragePath: photo.thumbnailStoragePath,
        signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
        thumbnailSignedUrl: signedUrlMap.get(photo.thumbnailStoragePath) ?? null,
      })),
    assets: linkedAssets.map((asset) => {
      const photo = assetPhotoMap.get(asset.id)
      return {
        ...asset,
        signedUrl: photo?.signedUrl ?? null,
        thumbnailSignedUrl: photo?.thumbnailSignedUrl ?? null,
      }
    }),
  })
})

// 완료 조치 보고서
repairRoutes.get('/:id/report', async (c) => {
  const profileId = c.get('profileId')
  const id = c.req.param('id')

  const [request] = await db
    .select({
      id: repairRequests.id,
      propertyName: properties.name,
      status: repairRequests.status,
    })
    .from(repairRequests)
    .innerJoin(properties, eq(repairRequests.propertyId, properties.id))
    .where(and(eq(repairRequests.id, id), eq(repairRequests.hostId, profileId), isNull(properties.deletedAt)))
    .limit(1)

  if (!request) {
    return c.json({ error: '수리 요청을 찾을 수 없어요' }, 404)
  }

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

  if (!report) {
    return c.json({ error: '조치 보고서가 아직 작성되지 않았어요' }, 404)
  }

  const photos = await db
    .select({
      id: repairCompletionPhotos.id,
      storagePath: repairCompletionPhotos.storagePath,
      thumbnailStoragePath: repairCompletionPhotos.thumbnailStoragePath,
      sortOrder: repairCompletionPhotos.sortOrder,
    })
    .from(repairCompletionPhotos)
    .where(eq(repairCompletionPhotos.completionReportId, report.id))

  const signedUrlMap = await createSignedUrlMap([
    ...photos.map((p) => p.storagePath),
    ...photos.map((p) => p.thumbnailStoragePath),
  ])

  return c.json({
    id: request.id,
    propertyName: request.propertyName,
    status: request.status,
    report: {
      id: report.id,
      actionNotes: report.actionNotes,
      additionalNotes: report.additionalNotes,
      createdAt: report.createdAt,
      photos: photos
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((photo) => ({
          id: photo.id,
          storagePath: photo.storagePath,
          thumbnailStoragePath: photo.thumbnailStoragePath,
          signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
          thumbnailSignedUrl: signedUrlMap.get(photo.thumbnailStoragePath) ?? null,
        })),
    },
  })
})

// Orphan upload URL (요청 생성 전 사진 업로드)
repairRoutes.post('/photos/upload-url', async (c) => {
  const body = await c.req.json().catch(() => null)
  const validated = PhotoUploadSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const extension = validated.data.fileName.includes('.')
    ? validated.data.fileName.slice(validated.data.fileName.lastIndexOf('.')).toLowerCase()
    : '.jpg'
  const safeExtension = extension.match(/^\.[a-z0-9]+$/) ? extension : '.jpg'
  const fileId = crypto.randomUUID()
  const storagePath = `repairs/drafts/original/${fileId}${safeExtension}`
  const thumbnailStoragePath = `repairs/drafts/thumb/${fileId}.jpg`

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

// 수리 요청 생성 (submitted 상태로 바로 생성, 결제 없음)
repairRoutes.post('/', async (c) => {
  const profileId = c.get('profileId')
  const body = await c.req.json()
  const validated = RepairRequestCreateSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const { propertyId, description, preferredScheduledDate, preferredScheduledTime, assetIds, photos } = validated.data

  const [property] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.id, propertyId), eq(properties.hostId, profileId), isNull(properties.deletedAt)))
    .limit(1)

  if (!property) {
    return c.json({ error: '숙소를 찾을 수 없어요' }, 404)
  }

  if (property.status !== 'active') {
    return c.json({ error: '등록 완료된 숙소만 수리를 요청할 수 있어요' }, 400)
  }

  // 자산 소유권 검증
  if (assetIds.length > 0) {
    const validAssets = await db
      .select({ id: propertyAssets.id })
      .from(propertyAssets)
      .where(and(
        inArray(propertyAssets.id, assetIds),
        eq(propertyAssets.propertyId, propertyId),
      ))

    if (validAssets.length !== assetIds.length) {
      return c.json({ error: '선택한 시설물이 올바르지 않아요' }, 400)
    }
  }

  const [created] = await db
    .insert(repairRequests)
    .values({
      propertyId,
      hostId: profileId,
      status: 'submitted',
      description,
      preferredScheduledDate,
      preferredScheduledTime,
    })
    .returning()

  if (assetIds.length > 0) {
    await db.insert(repairRequestAssets).values(
      assetIds.map((assetId) => ({
        repairRequestId: created.id,
        assetId,
      })),
    )
  }

  if (photos.length > 0) {
    await db.insert(repairRequestPhotos).values(
      photos.map((photo, index) => ({
        repairRequestId: created.id,
        storagePath: photo.storagePath,
        thumbnailStoragePath: photo.thumbnailStoragePath,
        sortOrder: index,
      })),
    )
  }

  return c.json(created, 201)
})

// 견적 결제 승인 (success 페이지에서 호출)
repairRoutes.post('/:id/confirm-payment', async (c) => {
  const profileId = c.get('profileId')
  const id = c.req.param('id')
  const body = await c.req.json()
  const validated = ConfirmPaymentSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const { paymentKey, orderId, amount } = validated.data

  const [request] = await db
    .select()
    .from(repairRequests)
    .where(and(
      eq(repairRequests.id, id),
      eq(repairRequests.orderId, orderId),
      eq(repairRequests.hostId, profileId),
    ))
    .limit(1)

  if (!request) {
    return c.json({ error: '주문을 찾을 수 없어요' }, 404)
  }

  // 멱등: 이미 확정된 경우
  if (request.status === 'confirmed' && request.paymentKey) {
    return c.json(request)
  }

  if (request.status !== 'quoted') {
    return c.json({ error: '결제할 수 없는 상태에요' }, 400)
  }

  if (amount !== request.quotedCost) {
    return c.json({ error: '결제 금액이 일치하지 않아요' }, 400)
  }

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

  const now = new Date()
  const [updated] = await db
    .update(repairRequests)
    .set({
      status: 'confirmed',
      paymentKey,
      confirmedAt: now,
      updatedAt: now,
    })
    .where(eq(repairRequests.id, request.id))
    .returning()

  const [property] = await db
    .select({
      name: properties.name,
      address: properties.address,
      addressDetail: properties.addressDetail,
    })
    .from(properties)
    .where(eq(properties.id, request.propertyId))
    .limit(1)

  return c.json({
    ...updated,
    property: property ?? null,
  })
})

// 취소
repairRoutes.post('/:id/cancel', async (c) => {
  const profileId = c.get('profileId')
  const id = c.req.param('id')

  const [request] = await db
    .select()
    .from(repairRequests)
    .where(and(eq(repairRequests.id, id), eq(repairRequests.hostId, profileId)))
    .limit(1)

  if (!request) {
    return c.json({ error: '요청을 찾을 수 없어요' }, 404)
  }

  const cancellable = ['submitted', 'quoted', 'confirmed']
  if (!cancellable.includes(request.status)) {
    return c.json({ error: '취소할 수 없는 요청이에요' }, 400)
  }

  // confirmed 상태: 방문 예정일 24시간 전까지만
  if (request.status === 'confirmed' && request.scheduledDate && request.scheduledTime) {
    const scheduledAt = new Date(`${request.scheduledDate}T${request.scheduledTime}:00+09:00`)
    const hoursUntil = (scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntil < 24) {
      return c.json({ error: '방문 예정일 24시간 이내에는 취소가 불가해요' }, 400)
    }
  }

  // 결제 완료(confirmed)는 Toss 결제 취소
  if (request.paymentKey && request.status === 'confirmed') {
    const secretKey = process.env.TOSS_SECRET_KEY
    if (!secretKey) {
      return c.json({ error: '결제 설정 오류' }, 500)
    }

    const authHeader = `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
    const tossRes = await fetch(`https://api.tosspayments.com/v1/payments/${request.paymentKey}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cancelReason: '고객 요청에 의한 취소' }),
    })

    if (!tossRes.ok) {
      const tossError = await tossRes.json()
      return c.json({
        error: tossError.message || '결제 취소에 실패했어요',
        code: tossError.code,
      }, 400)
    }
  }

  const now = new Date()
  const [updated] = await db
    .update(repairRequests)
    .set({
      status: 'cancelled',
      cancelledAt: now,
      updatedAt: now,
    })
    .where(eq(repairRequests.id, id))
    .returning()

  return c.json(updated)
})
