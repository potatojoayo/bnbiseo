import { Context, Hono } from 'hono'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { eq, and, ne, or, desc, isNull, sql, count, inArray } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { db } from '@/db'
import {
  profiles,
  properties,
  cleaningRequests,
  cleaningRequestPhotos,
  managers,
  propertyAssets,
  propertyAssetPhotos,
  propertySpaces,
  propertySpacePhotos,
  repairRequests,
  repairRequestPhotos,
  repairCompletionReports,
  repairCompletionPhotos,
} from '@/db/schema'
import { authMiddleware, type AuthEnv } from '../middleware/auth'
import { summarizeSpaces, summarizeSpacesByProperty } from '@/lib/property-space-summary'
import {
  notifyCleaningAssigned,
  notifyCleaningBankTransferConfirmed,
  notifyCleaningCancelledByAdmin,
  notifyPropertyActivated,
} from '../lib/notifications'

export const adminRoutes = new Hono<AuthEnv>()

function warnJson<T extends Record<string, unknown>>(c: Context<AuthEnv>, payload: T, status: 400 | 403 | 404 | 500) {
  if (process.env.NODE_ENV !== 'production' && status >= 400) {
    console.warn('[admin api]', {
      method: c.req.method,
      path: c.req.path,
      status,
      payload,
    })
  }

  return c.json(payload, status)
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  )
}

const AdminCleaningStatusSchema = z.enum([
  'pending_payment',
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
])

// Admin auth: verify user + admin role
adminRoutes.use('*', authMiddleware)
adminRoutes.use('*', async (c, next) => {
  const userId = c.get('userId')
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)

  if (!profile || profile.role !== 'admin') {
    return warnJson(c, { error: '관리자 권한이 없습니다.' }, 403)
  }
  await next()
})

// ─── Dashboard Stats ────────────────────────────────────────────────────────

adminRoutes.get('/stats', async (c) => {
  const today = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })
    .replace(/\. /g, '-').replace('.', '').replace(/(\d+)-(\d+)-(\d+)/, (_, y, m, d) =>
      `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)

  // Today's cleaning by status
  const todayCleanings = await db
    .select({
      status: cleaningRequests.status,
      count: count(),
    })
    .from(cleaningRequests)
    .where(eq(cleaningRequests.scheduledDate, today))
    .groupBy(cleaningRequests.status)

  const todayCleaning = { pending: 0, confirmed: 0, inProgress: 0, completed: 0 }
  for (const row of todayCleanings) {
    if (row.status === 'pending') todayCleaning.pending = row.count
    if (row.status === 'confirmed') todayCleaning.confirmed = row.count
    if (row.status === 'in_progress') todayCleaning.inProgress = row.count
    if (row.status === 'completed') todayCleaning.completed = row.count
  }

  // Today's revenue (cleaning + repair)
  const [todayCleaningRevenueRow] = await db
    .select({ total: sql<number>`coalesce(sum(${cleaningRequests.finalPrice}), 0)` })
    .from(cleaningRequests)
    .where(and(
      eq(cleaningRequests.scheduledDate, today),
      ne(cleaningRequests.status, 'pending_payment'),
      ne(cleaningRequests.status, 'cancelled'),
    ))

  const [todayRepairRevenueRow] = await db
    .select({ total: sql<number>`coalesce(sum(${repairRequests.quotedCost}), 0)` })
    .from(repairRequests)
    .where(and(
      eq(repairRequests.scheduledDate, today),
      inArray(repairRequests.status, ['confirmed', 'in_progress', 'completed']),
    ))

  const todayRevenue = Number(todayCleaningRevenueRow.total) + Number(todayRepairRevenueRow.total)

  // This month's revenue (cleaning + repair)
  const monthStart = today.slice(0, 7) + '-01'
  const [monthCleaningRevenueRow] = await db
    .select({ total: sql<number>`coalesce(sum(${cleaningRequests.finalPrice}), 0)` })
    .from(cleaningRequests)
    .where(and(
      sql`${cleaningRequests.scheduledDate} >= ${monthStart}`,
      ne(cleaningRequests.status, 'pending_payment'),
      ne(cleaningRequests.status, 'cancelled'),
    ))

  const [monthRepairRevenueRow] = await db
    .select({ total: sql<number>`coalesce(sum(${repairRequests.quotedCost}), 0)` })
    .from(repairRequests)
    .where(and(
      sql`${repairRequests.scheduledDate} >= ${monthStart}`,
      inArray(repairRequests.status, ['confirmed', 'in_progress', 'completed']),
    ))

  const monthRevenue = Number(monthCleaningRevenueRow.total) + Number(monthRepairRevenueRow.total)

  // Pending assignment (up to 5)
  const pendingAssignment = await db
    .select({
      id: cleaningRequests.id,
      scheduledDate: cleaningRequests.scheduledDate,
      scheduledTime: cleaningRequests.scheduledTime,
      cleaningType: cleaningRequests.cleaningType,
      finalPrice: cleaningRequests.finalPrice,
      propertyName: properties.name,
      hostName: profiles.fullName,
    })
    .from(cleaningRequests)
    .leftJoin(properties, eq(cleaningRequests.propertyId, properties.id))
    .leftJoin(profiles, eq(cleaningRequests.hostId, profiles.id))
    .where(and(eq(cleaningRequests.status, 'pending'), isNull(properties.deletedAt)))
    .orderBy(cleaningRequests.scheduledDate, cleaningRequests.scheduledTime)
    .limit(5)

  // Today's schedule (무통장 입금 대기 건도 노출 — 관리자가 당일 입금 확인해야 함)
  const todaySchedule = await db
    .select({
      id: cleaningRequests.id,
      scheduledTime: cleaningRequests.scheduledTime,
      status: cleaningRequests.status,
      cleaningType: cleaningRequests.cleaningType,
      propertyName: properties.name,
      managerName: managers.name,
    })
    .from(cleaningRequests)
    .leftJoin(properties, eq(cleaningRequests.propertyId, properties.id))
    .leftJoin(managers, eq(cleaningRequests.managerId, managers.id))
    .where(and(
      eq(cleaningRequests.scheduledDate, today),
      or(
        ne(cleaningRequests.status, 'pending_payment'),
        eq(cleaningRequests.paymentMethod, 'bank_transfer'),
      ),
      ne(cleaningRequests.status, 'cancelled'),
    ))
    .orderBy(cleaningRequests.scheduledTime)

  const [propCount] = await db.select({ count: count() }).from(properties).where(isNull(properties.deletedAt))
  const [userCount] = await db.select({ count: count() }).from(profiles).where(and(isNull(profiles.deletedAt), eq(profiles.role, 'user')))
  const [managerCount] = await db.select({ count: count() }).from(managers).where(eq(managers.isActive, true))

  // Repair counts (open = not completed/cancelled, pendingAssignment = no manager)
  const [repairOpenRow] = await db
    .select({ count: count() })
    .from(repairRequests)
    .where(and(
      ne(repairRequests.status, 'completed'),
      ne(repairRequests.status, 'cancelled'),
    ))

  const [repairUnassignedRow] = await db
    .select({ count: count() })
    .from(repairRequests)
    .where(and(
      isNull(repairRequests.managerId),
      ne(repairRequests.status, 'completed'),
      ne(repairRequests.status, 'cancelled'),
    ))

  const [repairInProgressRow] = await db
    .select({ count: count() })
    .from(repairRequests)
    .where(eq(repairRequests.status, 'in_progress'))

  return c.json({
    todayCleaning,
    todayRevenue,
    monthRevenue,
    pendingAssignment,
    todaySchedule,
    totalProperties: propCount.count,
    totalUsers: userCount.count,
    totalManagers: managerCount.count,
    repair: {
      open: repairOpenRow.count,
      unassigned: repairUnassignedRow.count,
      inProgress: repairInProgressRow.count,
    },
  })
})

// ─── Cleaning Management ────────────────────────────────────────────────────

// List all cleaning requests
adminRoutes.get('/cleaning', async (c) => {
  const statusQuery = c.req.query('status')
  const status = statusQuery ? AdminCleaningStatusSchema.safeParse(statusQuery) : null

  if (statusQuery && !status?.success) {
    return warnJson(c, { error: '유효하지 않은 상태값입니다.' }, 400)
  }

  const result = await db
    .select({
      id: cleaningRequests.id,
      propertyId: cleaningRequests.propertyId,
      hostId: cleaningRequests.hostId,
      managerId: cleaningRequests.managerId,
      cleaningType: cleaningRequests.cleaningType,
      status: cleaningRequests.status,
      scheduledDate: cleaningRequests.scheduledDate,
      scheduledTime: cleaningRequests.scheduledTime,
      memo: cleaningRequests.memo,
      price: cleaningRequests.price,
      discount: cleaningRequests.discount,
      finalPrice: cleaningRequests.finalPrice,
      paymentMethod: cleaningRequests.paymentMethod,
      paidAt: cleaningRequests.paidAt,
      createdAt: cleaningRequests.createdAt,
      propertyName: properties.name,
      propertyAddress: properties.address,
      hostName: profiles.fullName,
      hostEmail: profiles.email,
      managerName: managers.name,
    })
    .from(cleaningRequests)
    .leftJoin(properties, eq(cleaningRequests.propertyId, properties.id))
    .leftJoin(profiles, eq(cleaningRequests.hostId, profiles.id))
    .leftJoin(managers, eq(cleaningRequests.managerId, managers.id))
    .where(and(
      // 카드 결제 진행 중인 pending_payment는 숨기고 무통장 입금 대기 건만 노출
      or(
        ne(cleaningRequests.status, 'pending_payment'),
        eq(cleaningRequests.paymentMethod, 'bank_transfer'),
      ),
      status?.success ? eq(cleaningRequests.status, status.data) : undefined,
    ))
    .orderBy(desc(cleaningRequests.createdAt))

  return c.json(result)
})

// Get cleaning request detail
adminRoutes.get('/cleaning/:id', async (c) => {
  const id = c.req.param('id')

  const hostProfiles = alias(profiles, 'host_profiles')
  const managerProfiles = alias(profiles, 'manager_profiles')

  const [request] = await db
    .select({
      id: cleaningRequests.id,
      propertyId: cleaningRequests.propertyId,
      hostId: cleaningRequests.hostId,
      managerId: cleaningRequests.managerId,
      cleaningType: cleaningRequests.cleaningType,
      status: cleaningRequests.status,
      scheduledDate: cleaningRequests.scheduledDate,
      scheduledTime: cleaningRequests.scheduledTime,
      memo: cleaningRequests.memo,
      linenWash: cleaningRequests.linenWash,
      price: cleaningRequests.price,
      discount: cleaningRequests.discount,
      finalPrice: cleaningRequests.finalPrice,
      paymentMethod: cleaningRequests.paymentMethod,
      paidAt: cleaningRequests.paidAt,
      createdAt: cleaningRequests.createdAt,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyAddressDetail: properties.addressDetail,
      hostName: hostProfiles.fullName,
      hostEmail: hostProfiles.email,
      hostPhone: hostProfiles.phone,
      managerName: managers.name,
      managerPhone: managers.phone,
      managerAvatarStoragePath: managerProfiles.avatarStoragePath,
      managerAvatarThumbnailStoragePath: managerProfiles.avatarThumbnailStoragePath,
    })
    .from(cleaningRequests)
    .leftJoin(properties, eq(cleaningRequests.propertyId, properties.id))
    .leftJoin(hostProfiles, eq(cleaningRequests.hostId, hostProfiles.id))
    .leftJoin(managers, eq(cleaningRequests.managerId, managers.id))
    .leftJoin(managerProfiles, eq(managers.profileId, managerProfiles.id))
    .where(eq(cleaningRequests.id, id))
    .limit(1)

  if (!request) {
    return warnJson(c, { error: '청소 요청을 찾을 수 없어요' }, 404)
  }

  const spaces = request.propertyId
    ? await db
        .select({
          id: propertySpaces.id,
          category: propertySpaces.category,
          floor: propertySpaces.floor,
          name: propertySpaces.name,
          pyeong: propertySpaces.pyeong,
        })
        .from(propertySpaces)
        .where(eq(propertySpaces.propertyId, request.propertyId))
    : []

  const requestPhotoRows = await db
    .select({
      id: cleaningRequestPhotos.id,
      storagePath: cleaningRequestPhotos.storagePath,
      thumbnailStoragePath: cleaningRequestPhotos.thumbnailStoragePath,
      sortOrder: cleaningRequestPhotos.sortOrder,
    })
    .from(cleaningRequestPhotos)
    .where(eq(cleaningRequestPhotos.cleaningRequestId, request.id))

  const summary = summarizeSpaces(spaces)

  const signedUrlMap = await createSignedUrlMap([
    ...requestPhotoRows.map((photo) => photo.storagePath),
    ...requestPhotoRows.map((photo) => photo.thumbnailStoragePath),
    ...(request.managerAvatarStoragePath ? [request.managerAvatarStoragePath] : []),
    ...(request.managerAvatarThumbnailStoragePath ? [request.managerAvatarThumbnailStoragePath] : []),
  ])

  return c.json({
    ...request,
    propertyPyeong: summary.pyeong,
    propertyLivingRooms: summary.livingRooms,
    propertyBedrooms: summary.bedrooms,
    propertyBathrooms: summary.bathrooms,
    managerAvatarSignedUrl: request.managerAvatarStoragePath
      ? signedUrlMap.get(request.managerAvatarStoragePath) ?? null
      : null,
    managerAvatarThumbnailSignedUrl: request.managerAvatarThumbnailStoragePath
      ? signedUrlMap.get(request.managerAvatarThumbnailStoragePath) ?? null
      : null,
    cleaningPhotos: requestPhotoRows
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((photo) => ({
        id: photo.id,
        signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
        thumbnailSignedUrl: signedUrlMap.get(photo.thumbnailStoragePath) ?? null,
      })),
  })
})

// Assign manager to cleaning request
const AssignManagerSchema = z.object({
  managerId: z.string().uuid(),
})

adminRoutes.post('/cleaning/:id/assign', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const validated = AssignManagerSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [updated] = await db
    .update(cleaningRequests)
    .set({
      managerId: validated.data.managerId,
      status: 'confirmed',
      updatedAt: new Date(),
    })
    .where(eq(cleaningRequests.id, id))
    .returning()

  if (!updated) {
    return warnJson(c, { error: '청소 요청을 찾을 수 없어요' }, 404)
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
      cleaningRequestId: updated.id,
      hostProfileId: detail.hostId,
      managerId: detail.managerId,
      propertyName: detail.propertyName || '숙소',
      scheduledDate: detail.scheduledDate,
      scheduledTime: detail.scheduledTime,
      managerName: detail.managerName || '매니저',
    })
  }

  return c.json(updated)
})

// 무통장 입금 확인 — pending_payment + bank_transfer 건을 pending으로 전환
adminRoutes.post('/cleaning/:id/confirm-bank-transfer', async (c) => {
  const id = c.req.param('id')

  const [request] = await db
    .select()
    .from(cleaningRequests)
    .where(eq(cleaningRequests.id, id))
    .limit(1)

  if (!request) {
    return warnJson(c, { error: '청소 요청을 찾을 수 없어요' }, 404)
  }

  if (request.paymentMethod !== 'bank_transfer') {
    return warnJson(c, { error: '무통장 입금 요청이 아니에요' }, 400)
  }

  if (request.status !== 'pending_payment') {
    return warnJson(c, { error: '이미 입금이 확인되었거나 처리할 수 없는 상태에요' }, 400)
  }

  const [updated] = await db
    .update(cleaningRequests)
    .set({
      status: 'pending',
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(cleaningRequests.id, id))
    .returning()

  const [property] = await db
    .select({ name: properties.name })
    .from(properties)
    .where(eq(properties.id, updated.propertyId))
    .limit(1)

  await notifyCleaningBankTransferConfirmed({
    cleaningRequestId: updated.id,
    hostProfileId: updated.hostId,
    propertyName: property?.name || '숙소',
    scheduledDate: updated.scheduledDate,
    scheduledTime: updated.scheduledTime,
    isUrgent: updated.cleaningType === 'urgent',
  })

  return c.json(updated)
})

// Update cleaning status
const UpdateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']),
})

adminRoutes.post('/cleaning/:id/status', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const validated = UpdateStatusSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [updated] = await db
    .update(cleaningRequests)
    .set({
      status: validated.data.status,
      updatedAt: new Date(),
    })
    .where(eq(cleaningRequests.id, id))
    .returning()

  if (!updated) {
    return warnJson(c, { error: '청소 요청을 찾을 수 없어요' }, 404)
  }

  if (validated.data.status === 'cancelled') {
    const [detail] = await db
      .select({
        hostId: cleaningRequests.hostId,
        managerId: cleaningRequests.managerId,
        scheduledDate: cleaningRequests.scheduledDate,
        scheduledTime: cleaningRequests.scheduledTime,
        propertyName: properties.name,
      })
      .from(cleaningRequests)
      .leftJoin(properties, eq(cleaningRequests.propertyId, properties.id))
      .where(eq(cleaningRequests.id, id))
      .limit(1)

    if (detail) {
      await notifyCleaningCancelledByAdmin({
        cleaningRequestId: updated.id,
        hostProfileId: detail.hostId,
        managerId: detail.managerId,
        propertyName: detail.propertyName || '숙소',
        scheduledDate: detail.scheduledDate,
        scheduledTime: detail.scheduledTime,
      })
    }
  }

  return c.json(updated)
})

// ─── Repair Management ──────────────────────────────────────────────────────

const AdminRepairStatusSchema = z.enum([
  'submitted',
  'quoted',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
])

adminRoutes.get('/repair', async (c) => {
  const statusQuery = c.req.query('status')
  const status = statusQuery ? AdminRepairStatusSchema.safeParse(statusQuery) : null

  if (statusQuery && !status?.success) {
    return warnJson(c, { error: '유효하지 않은 상태값입니다.' }, 400)
  }

  const result = await db
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
      createdAt: repairRequests.createdAt,
      cancelledAt: repairRequests.cancelledAt,
      propertyName: properties.name,
      propertyAddress: properties.address,
      hostName: profiles.fullName,
      hostEmail: profiles.email,
      managerName: managers.name,
    })
    .from(repairRequests)
    .leftJoin(properties, eq(repairRequests.propertyId, properties.id))
    .leftJoin(profiles, eq(repairRequests.hostId, profiles.id))
    .leftJoin(managers, eq(repairRequests.managerId, managers.id))
    .where(status?.success ? eq(repairRequests.status, status.data) : undefined)
    .orderBy(desc(repairRequests.createdAt))

  return c.json(result)
})

adminRoutes.get('/repair/:id', async (c) => {
  const id = c.req.param('id')

  const hostProfiles = alias(profiles, 'host_profiles_repair')
  const managerProfiles = alias(profiles, 'manager_profiles_repair')

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
      hostName: hostProfiles.fullName,
      hostEmail: hostProfiles.email,
      hostPhone: hostProfiles.phone,
      managerName: managers.name,
      managerPhone: managers.phone,
      managerAvatarStoragePath: managerProfiles.avatarStoragePath,
      managerAvatarThumbnailStoragePath: managerProfiles.avatarThumbnailStoragePath,
    })
    .from(repairRequests)
    .leftJoin(properties, eq(repairRequests.propertyId, properties.id))
    .leftJoin(hostProfiles, eq(repairRequests.hostId, hostProfiles.id))
    .leftJoin(managers, eq(repairRequests.managerId, managers.id))
    .leftJoin(managerProfiles, eq(managers.profileId, managerProfiles.id))
    .where(eq(repairRequests.id, id))
    .limit(1)

  if (!request) {
    return warnJson(c, { error: '수리 요청을 찾을 수 없어요' }, 404)
  }

  const requestPhotoRows = await db
    .select({
      id: repairRequestPhotos.id,
      storagePath: repairRequestPhotos.storagePath,
      thumbnailStoragePath: repairRequestPhotos.thumbnailStoragePath,
      sortOrder: repairRequestPhotos.sortOrder,
    })
    .from(repairRequestPhotos)
    .where(eq(repairRequestPhotos.repairRequestId, request.id))

  const [report] = await db
    .select({
      id: repairCompletionReports.id,
      actionNotes: repairCompletionReports.actionNotes,
      additionalNotes: repairCompletionReports.additionalNotes,
      createdAt: repairCompletionReports.createdAt,
    })
    .from(repairCompletionReports)
    .where(eq(repairCompletionReports.repairRequestId, request.id))
    .limit(1)

  const reportPhotoRows = report
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
    ...requestPhotoRows.map((photo) => photo.storagePath),
    ...requestPhotoRows.map((photo) => photo.thumbnailStoragePath),
    ...reportPhotoRows.map((photo) => photo.storagePath),
    ...reportPhotoRows.map((photo) => photo.thumbnailStoragePath),
    ...(request.managerAvatarStoragePath ? [request.managerAvatarStoragePath] : []),
    ...(request.managerAvatarThumbnailStoragePath ? [request.managerAvatarThumbnailStoragePath] : []),
  ])

  return c.json({
    ...request,
    managerAvatarSignedUrl: request.managerAvatarStoragePath
      ? signedUrlMap.get(request.managerAvatarStoragePath) ?? null
      : null,
    managerAvatarThumbnailSignedUrl: request.managerAvatarThumbnailStoragePath
      ? signedUrlMap.get(request.managerAvatarThumbnailStoragePath) ?? null
      : null,
    photos: requestPhotoRows
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((photo) => ({
        id: photo.id,
        signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
        thumbnailSignedUrl: signedUrlMap.get(photo.thumbnailStoragePath) ?? null,
      })),
    report: report
      ? {
          id: report.id,
          actionNotes: report.actionNotes,
          additionalNotes: report.additionalNotes,
          createdAt: report.createdAt,
          photos: reportPhotoRows
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((photo) => ({
              id: photo.id,
              signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
              thumbnailSignedUrl: signedUrlMap.get(photo.thumbnailStoragePath) ?? null,
            })),
        }
      : null,
  })
})

adminRoutes.post('/repair/:id/assign', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const validated = AssignManagerSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [updated] = await db
    .update(repairRequests)
    .set({
      managerId: validated.data.managerId,
      updatedAt: new Date(),
    })
    .where(eq(repairRequests.id, id))
    .returning()

  if (!updated) {
    return warnJson(c, { error: '수리 요청을 찾을 수 없어요' }, 404)
  }

  return c.json(updated)
})

// ─── Manager Management ─────────────────────────────────────────────────────

const PhoneDigits = z
  .string()
  .min(1)
  .transform((value) => value.replace(/\D/g, ''))
  .refine((digits) => /^01\d{8,9}$/.test(digits), '올바른 전화번호 형식이 아니에요.')

const CreateManagerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: PhoneDigits,
  memo: z.string().optional(),
  avatarStoragePath: z.string().min(1),
  avatarThumbnailStoragePath: z.string().min(1),
})

const UpdateManagerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: PhoneDigits.optional(),
  memo: z.string().optional(),
  avatarStoragePath: z.string().min(1).optional(),
  avatarThumbnailStoragePath: z.string().min(1).optional(),
})

const PhotoUploadSchema = z.object({
  storagePath: z.string().min(1),
  thumbnailStoragePath: z.string().min(1),
})

const FixtureRegistrationSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.enum([
    'lighting',
    'furniture',
    'faucet',
    'boiler',
    'appliance',
    'lock',
    'ac',
    'washer',
    'dryer',
    'vent',
    'other',
  ]),
  name: z.string().min(1),
  location: z.string().min(1),
  brand: z.string().optional(),
  modelNumber: z.string().optional(),
  specNotes: z.string().optional(),
  notes: z.string().optional(),
  photos: z.array(PhotoUploadSchema).min(1, '사진을 최소 1장 추가해주세요.'),
})

const PropertyRegistrationSchema = z.object({
  entrancePassword: z.string().optional(),
  doorLockPassword: z.string().min(1),
  wifiSsid: z.string().optional(),
  wifiPassword: z.string().optional(),
  cleaningClosetLocation: z.string().optional(),
  extraLinenLocation: z.string().optional(),
  trashDisposalLocation: z.string().optional(),
  linenWashLocation: z.enum(['in_house', 'external']).nullable().optional(),
  fixtures: z.array(FixtureRegistrationSchema),
})

const PropertyRegistrationDraftSchema = z.object({
  entrancePassword: z.string().optional(),
  doorLockPassword: z.string().optional(),
  wifiSsid: z.string().optional(),
  wifiPassword: z.string().optional(),
  cleaningClosetLocation: z.string().optional(),
  extraLinenLocation: z.string().optional(),
  trashDisposalLocation: z.string().optional(),
  linenWashLocation: z.enum(['in_house', 'external']).nullable().optional(),
})

const CreateFixtureSchema = z.object({
  category: z.enum([
    'lighting',
    'furniture',
    'faucet',
    'boiler',
    'appliance',
    'lock',
    'ac',
    'washer',
    'dryer',
    'vent',
    'other',
  ]),
  name: z.string().min(1),
  location: z.string().min(1),
  brand: z.string().optional(),
  modelNumber: z.string().optional(),
  specNotes: z.string().optional(),
  notes: z.string().optional(),
  photos: z.array(PhotoUploadSchema).min(1, '사진을 최소 1장 추가해주세요.'),
})

const SignedUploadSchema = z.object({
  propertyId: z.string().uuid(),
  fileName: z.string().min(1),
  kind: z.enum(['assets', 'spaces']).optional(),
})

const ManagerAvatarUploadSchema = z.object({
  fileName: z.string().min(1),
})

const PropertySpaceSchema = z.object({
  category: z.enum(['living_room', 'bedroom', 'bathroom']),
  floor: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
  name: z.string().min(1),
  pyeong: z.coerce.number().int().positive(),
  notes: z.string().optional(),
  photos: z.array(PhotoUploadSchema).min(1, '사진을 최소 1장 추가해주세요.'),
})

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

// List managers
adminRoutes.get('/managers', async (c) => {
  const result = await db
    .select({
      id: managers.id,
      profileId: managers.profileId,
      name: managers.name,
      phone: managers.phone,
      memo: managers.memo,
      isActive: managers.isActive,
      createdAt: managers.createdAt,
      email: profiles.email,
      avatarStoragePath: profiles.avatarStoragePath,
      avatarThumbnailStoragePath: profiles.avatarThumbnailStoragePath,
    })
    .from(managers)
    .leftJoin(profiles, eq(managers.profileId, profiles.id))
    .orderBy(desc(managers.createdAt))

  const signedUrlMap = await createSignedUrlMap(
    result
      .flatMap((manager) => [manager.avatarStoragePath, manager.avatarThumbnailStoragePath])
      .filter((path): path is string => !!path),
  )

  return c.json(result.map((manager) => ({
    ...manager,
    avatarSignedUrl: manager.avatarStoragePath ? signedUrlMap.get(manager.avatarStoragePath) ?? null : null,
    avatarThumbnailSignedUrl: manager.avatarThumbnailStoragePath ? signedUrlMap.get(manager.avatarThumbnailStoragePath) ?? null : null,
  })))
})

// Create manager
adminRoutes.post('/managers', async (c) => {
  const body = await c.req.json()
  const validated = CreateManagerSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [existingProfile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.email, validated.data.email), isNull(profiles.deletedAt)))
    .limit(1)

  if (existingProfile) {
    return warnJson(c, { error: '이미 사용 중인 이메일이에요.' }, 400)
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data: authUserData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: validated.data.email,
    password: validated.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: validated.data.name,
    },
  })

  if (authError || !authUserData.user) {
    return warnJson(c, { error: authError?.message || '매니저 계정을 만들 수 없어요.' }, 400)
  }

  try {
    const created = await db.transaction(async (tx) => {
      const [profile] = await tx
        .insert(profiles)
        .values({
          userId: authUserData.user.id,
          email: validated.data.email,
          fullName: validated.data.name,
          phone: validated.data.phone,
          avatarStoragePath: validated.data.avatarStoragePath,
          avatarThumbnailStoragePath: validated.data.avatarThumbnailStoragePath,
          role: 'manager',
          onboardingCompleted: true,
        })
        .returning()

      const [manager] = await tx
        .insert(managers)
        .values({
          profileId: profile.id,
          name: validated.data.name,
          phone: validated.data.phone,
          memo: validated.data.memo,
        })
        .returning()

      return {
        ...manager,
        email: profile.email,
      }
    })

    return c.json(created, 201)
  } catch {
    await supabaseAdmin.auth.admin.deleteUser(authUserData.user.id)
    return warnJson(c, { error: '매니저 정보를 저장하지 못했어요.' }, 500)
  }
})

adminRoutes.post('/managers/upload-url', async (c) => {
  const body = await c.req.json()
  const validated = ManagerAvatarUploadSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
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
    return warnJson(c, { error: originalError?.message || thumbnailError?.message || '업로드 URL을 만들 수 없어요.' }, 400)
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

// Update manager
adminRoutes.patch('/managers/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const validated = UpdateManagerSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [current] = await db
    .select({
      id: managers.id,
      profileId: managers.profileId,
    })
    .from(managers)
    .where(eq(managers.id, id))
    .limit(1)

  if (!current) {
    return warnJson(c, { error: '매니저를 찾을 수 없어요' }, 404)
  }

  const updated = await db.transaction(async (tx) => {
    const [manager] = await tx
      .update(managers)
      .set({ ...validated.data, updatedAt: new Date() })
      .where(eq(managers.id, id))
      .returning()

    if (validated.data.name || validated.data.phone) {
      await tx
        .update(profiles)
        .set({
          ...(validated.data.name !== undefined ? { fullName: validated.data.name } : {}),
          ...(validated.data.phone !== undefined ? { phone: validated.data.phone } : {}),
          ...(validated.data.avatarStoragePath !== undefined ? { avatarStoragePath: validated.data.avatarStoragePath } : {}),
          ...(validated.data.avatarThumbnailStoragePath !== undefined ? { avatarThumbnailStoragePath: validated.data.avatarThumbnailStoragePath } : {}),
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, current.profileId))
    }

    return manager
  })

  if (!updated) {
    return warnJson(c, { error: '매니저를 찾을 수 없어요' }, 404)
  }

  return c.json(updated)
})

// Toggle manager active
adminRoutes.post('/managers/:id/toggle', async (c) => {
  const id = c.req.param('id')

  const [manager] = await db.select().from(managers).where(eq(managers.id, id)).limit(1)
  if (!manager) return warnJson(c, { error: '매니저를 찾을 수 없어요' }, 404)

  const [updated] = await db
    .update(managers)
    .set({ isActive: !manager.isActive, updatedAt: new Date() })
    .where(eq(managers.id, id))
    .returning()

  return c.json(updated)
})

// Delete manager
adminRoutes.delete('/managers/:id', async (c) => {
  const id = c.req.param('id')

  const [deleted] = await db
    .delete(managers)
    .where(eq(managers.id, id))
    .returning()

  if (!deleted) {
    return warnJson(c, { error: '매니저를 찾을 수 없어요' }, 404)
  }

  return c.json({ success: true })
})

// ─── Users ──────────────────────────────────────────────────────────────────

adminRoutes.get('/users', async (c) => {
  const result = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      fullName: profiles.fullName,
      phone: profiles.phone,
      role: profiles.role,
      onboardingCompleted: profiles.onboardingCompleted,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(isNull(profiles.deletedAt))
    .orderBy(desc(profiles.createdAt))

  return c.json(result)
})

// ─── Properties ─────────────────────────────────────────────────────────────

adminRoutes.get('/properties', async (c) => {
  const result = await db
    .select({
      id: properties.id,
      status: properties.status,
      name: properties.name,
      address: properties.address,
      hostName: profiles.fullName,
      hostEmail: profiles.email,
      hostPhone: profiles.phone,
      createdAt: properties.createdAt,
      activatedAt: properties.activatedAt,
    })
    .from(properties)
    .leftJoin(profiles, eq(properties.hostId, profiles.id))
    .where(isNull(properties.deletedAt))
    .orderBy(desc(properties.createdAt))

  const spaces = result.length > 0
    ? await db
      .select({
        propertyId: propertySpaces.propertyId,
        category: propertySpaces.category,
        pyeong: propertySpaces.pyeong,
      })
      .from(propertySpaces)
      .where(inArray(propertySpaces.propertyId, result.map((property) => property.id)))
    : []

  const summaries = summarizeSpacesByProperty(spaces)

  return c.json(
    result.map((property) => ({
      ...property,
      ...summaries.get(property.id),
    })),
  )
})

adminRoutes.get('/properties/:id/registration', async (c) => {
  const id = c.req.param('id')

  const [property] = await db
    .select({
      id: properties.id,
      status: properties.status,
      name: properties.name,
      address: properties.address,
      addressDetail: properties.addressDetail,
      entrancePassword: properties.entrancePassword,
      doorLockPassword: properties.doorLockPassword,
      wifiSsid: properties.wifiSsid,
      wifiPassword: properties.wifiPassword,
      cleaningClosetLocation: properties.cleaningClosetLocation,
      extraLinenLocation: properties.extraLinenLocation,
      trashDisposalLocation: properties.trashDisposalLocation,
      linenWashLocation: properties.linenWashLocation,
      hostName: profiles.fullName,
      hostEmail: profiles.email,
      hostPhone: profiles.phone,
    })
    .from(properties)
    .leftJoin(profiles, eq(properties.hostId, profiles.id))
    .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
    .limit(1)

  if (!property) {
    return warnJson(c, { error: '숙소를 찾을 수 없어요' }, 404)
  }

  const propertyFixtures = await db
    .select({
      id: propertyAssets.id,
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

  const spaces = await db
    .select({
      id: propertySpaces.id,
      category: propertySpaces.category,
      floor: propertySpaces.floor,
      name: propertySpaces.name,
      pyeong: propertySpaces.pyeong,
      notes: propertySpaces.notes,
    })
    .from(propertySpaces)
    .where(eq(propertySpaces.propertyId, id))

  const fixtureIds = propertyFixtures.map((fixture) => fixture.id)
  const fixturePhotoRows = fixtureIds.length > 0
    ? await db
      .select({
        id: propertyAssetPhotos.id,
        fixtureId: propertyAssetPhotos.fixtureId,
        storagePath: propertyAssetPhotos.storagePath,
        thumbnailStoragePath: propertyAssetPhotos.thumbnailStoragePath,
        sortOrder: propertyAssetPhotos.sortOrder,
      })
      .from(propertyAssetPhotos)
      .where(inArray(propertyAssetPhotos.fixtureId, fixtureIds))
    : []

  const spaceIds = spaces.map((space) => space.id)
  const spacePhotoRows = spaceIds.length > 0
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

  const signedUrlMap = await createSignedUrlMap([
    ...fixturePhotoRows.map((photo) => photo.storagePath),
    ...spacePhotoRows.map((photo) => photo.storagePath),
  ])
  const thumbnailSignedUrlMap = await createSignedUrlMap([
    ...fixturePhotoRows.map((photo) => photo.thumbnailStoragePath),
    ...spacePhotoRows.map((photo) => photo.thumbnailStoragePath),
  ])

  const fixturesWithPhotos = propertyFixtures.map((fixture) => ({
    ...fixture,
    photos: fixturePhotoRows
      .filter((photo) => photo.fixtureId === fixture.id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((photo) => ({
        id: photo.id,
        storagePath: photo.storagePath,
        thumbnailStoragePath: photo.thumbnailStoragePath,
        signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
        thumbnailSignedUrl: thumbnailSignedUrlMap.get(photo.thumbnailStoragePath) ?? null,
      })),
  }))

  const spacesWithPhotos = spaces.map((space) => ({
    ...space,
    photos: spacePhotoRows
      .filter((photo) => photo.propertySpaceId === space.id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((photo) => ({
        id: photo.id,
        storagePath: photo.storagePath,
        thumbnailStoragePath: photo.thumbnailStoragePath,
        signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
        thumbnailSignedUrl: thumbnailSignedUrlMap.get(photo.thumbnailStoragePath) ?? null,
      })),
  }))

  return c.json({
    ...property,
    ...summarizeSpaces(spaces),
    spaces: spacesWithPhotos,
    fixtures: fixturesWithPhotos,
  })
})

adminRoutes.delete('/properties/:id', async (c) => {
  const id = c.req.param('id')

  const [deleted] = await db
    .update(properties)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
    .returning({ id: properties.id })

  if (!deleted) {
    return warnJson(c, { error: '숙소를 찾을 수 없어요' }, 404)
  }

  return c.json({ success: true })
})

adminRoutes.post('/properties/:id/registration/upload-url', async (c) => {
  const propertyId = c.req.param('id')
  const body = await c.req.json()
  const validated = SignedUploadSchema.safeParse({
    ...body,
    propertyId,
  })

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [property] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, propertyId), isNull(properties.deletedAt)))
    .limit(1)

  if (!property) {
    return warnJson(c, { error: '숙소를 찾을 수 없어요' }, 404)
  }

  const kind = validated.data.kind ?? 'assets'
  const ext = validated.data.fileName.split('.').pop()?.toLowerCase() || 'jpg'
  const fileId = crypto.randomUUID()
  const originalPath = `properties/${propertyId}/${kind}/original/${fileId}.${ext}`
  const thumbnailStoragePath = `properties/${propertyId}/${kind}/thumb/${fileId}.jpg`
  const supabaseAdmin = getSupabaseAdmin()
  const [{ data: originalData, error: originalError }, { data: thumbnailData, error: thumbnailError }] = await Promise.all([
    supabaseAdmin.storage.from('images').createSignedUploadUrl(originalPath),
    supabaseAdmin.storage.from('images').createSignedUploadUrl(thumbnailStoragePath),
  ])

  if (originalError || thumbnailError || !originalData || !thumbnailData) {
    return warnJson(c, { error: originalError?.message || thumbnailError?.message || '업로드 URL을 만들 수 없어요.' }, 400)
  }

  return c.json({
    original: {
      path: originalPath,
      token: originalData.token,
    },
    thumbnail: {
      path: thumbnailStoragePath,
      token: thumbnailData.token,
    },
  })
})

adminRoutes.post('/properties/:id/registration/draft', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const validated = PropertyRegistrationDraftSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [updated] = await db
    .update(properties)
    .set({
      entrancePassword: validated.data.entrancePassword?.trim() || null,
      doorLockPassword: validated.data.doorLockPassword?.trim() || null,
      wifiSsid: validated.data.wifiSsid?.trim() || null,
      wifiPassword: validated.data.wifiPassword?.trim() || null,
      cleaningClosetLocation: validated.data.cleaningClosetLocation?.trim() || null,
      extraLinenLocation: validated.data.extraLinenLocation?.trim() || null,
      trashDisposalLocation: validated.data.trashDisposalLocation?.trim() || null,
      linenWashLocation: validated.data.linenWashLocation ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
    .returning({ id: properties.id })

  if (!updated) {
    return warnJson(c, { error: '숙소를 찾을 수 없어요' }, 404)
  }

  return c.json({ success: true })
})

adminRoutes.post('/properties/:id/registration/spaces', async (c) => {
  const propertyId = c.req.param('id')
  const body = await c.req.json()
  const validated = PropertySpaceSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [property] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, propertyId), isNull(properties.deletedAt)))
    .limit(1)

  if (!property) {
    return warnJson(c, { error: '숙소를 찾을 수 없어요' }, 404)
  }

  const created = await db.transaction(async (tx) => {
    const [space] = await tx
      .insert(propertySpaces)
      .values({
        propertyId,
        category: validated.data.category,
        floor: validated.data.floor,
        name: validated.data.name.trim(),
        pyeong: validated.data.pyeong,
        notes: validated.data.notes?.trim() || null,
      })
      .returning()

    if (validated.data.photos.length > 0) {
      await tx.insert(propertySpacePhotos).values(
        validated.data.photos.map((photo, index) => ({
          propertySpaceId: space.id,
          storagePath: photo.storagePath,
          thumbnailStoragePath: photo.thumbnailStoragePath,
          sortOrder: index,
        })),
      )
    }

    return space
  })

  return c.json(created, 201)
})

adminRoutes.patch('/properties/:id/registration/spaces/:spaceId', async (c) => {
  const propertyId = c.req.param('id')
  const spaceId = c.req.param('spaceId')
  const body = await c.req.json()
  const validated = PropertySpaceSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [space] = await db
    .select({ id: propertySpaces.id, name: propertySpaces.name })
    .from(propertySpaces)
    .where(and(eq(propertySpaces.id, spaceId), eq(propertySpaces.propertyId, propertyId)))
    .limit(1)

  if (!space) {
    return warnJson(c, { error: '공간 정보를 찾을 수 없어요' }, 404)
  }

  await db.transaction(async (tx) => {
    await tx
      .update(propertySpaces)
      .set({
        category: validated.data.category,
        floor: validated.data.floor,
        name: validated.data.name.trim(),
        pyeong: validated.data.pyeong,
        notes: validated.data.notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(propertySpaces.id, spaceId))

    await tx.delete(propertySpacePhotos).where(eq(propertySpacePhotos.propertySpaceId, spaceId))

    if (validated.data.photos.length > 0) {
      await tx.insert(propertySpacePhotos).values(
        validated.data.photos.map((photo, index) => ({
          propertySpaceId: spaceId,
          storagePath: photo.storagePath,
          thumbnailStoragePath: photo.thumbnailStoragePath,
          sortOrder: index,
        })),
      )
    }
  })

  return c.json({ success: true })
})

adminRoutes.delete('/properties/:id/registration/spaces/:spaceId', async (c) => {
  const propertyId = c.req.param('id')
  const spaceId = c.req.param('spaceId')

  const [space] = await db
    .select({ id: propertySpaces.id, name: propertySpaces.name })
    .from(propertySpaces)
    .where(and(eq(propertySpaces.id, spaceId), eq(propertySpaces.propertyId, propertyId)))
    .limit(1)

  if (!space) {
    return warnJson(c, { error: '공간 정보를 찾을 수 없어요' }, 404)
  }

  const [linkedFixture] = await db
    .select({ id: propertyAssets.id })
    .from(propertyAssets)
    .where(
      and(
        eq(propertyAssets.propertyId, propertyId),
        sql`${propertyAssets.location} = ${space.name} or ${propertyAssets.location} like ${space.name + ' · %'}`,
      ),
    )
    .limit(1)

  if (linkedFixture) {
    return warnJson(c, { error: '연결된 시설물이 있어 공간을 삭제할 수 없어요.' }, 400)
  }

  await db.delete(propertySpaces).where(eq(propertySpaces.id, spaceId))

  return c.json({ success: true })
})

adminRoutes.post('/properties/:id/registration/assets', async (c) => {
  const propertyId = c.req.param('id')
  const body = await c.req.json()
  const validated = CreateFixtureSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [property] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, propertyId), isNull(properties.deletedAt)))
    .limit(1)

  if (!property) {
    return warnJson(c, { error: '숙소를 찾을 수 없어요' }, 404)
  }

  const created = await db.transaction(async (tx) => {
    const [fixture] = await tx
      .insert(propertyAssets)
      .values({
        propertyId,
        category: validated.data.category,
        name: validated.data.name.trim(),
        location: validated.data.location.trim(),
        brand: validated.data.brand?.trim() || null,
        modelNumber: validated.data.modelNumber?.trim() || null,
        specNotes: validated.data.specNotes?.trim() || null,
        notes: validated.data.notes?.trim() || null,
      })
      .returning()

    if (validated.data.photos.length > 0) {
      await tx.insert(propertyAssetPhotos).values(
        validated.data.photos.map((photo, index) => ({
          fixtureId: fixture.id,
          storagePath: photo.storagePath,
          thumbnailStoragePath: photo.thumbnailStoragePath,
          sortOrder: index,
        })),
      )
    }

    return fixture
  })

  return c.json(created, 201)
})

adminRoutes.patch('/properties/:id/registration/assets/:fixtureId', async (c) => {
  const propertyId = c.req.param('id')
  const fixtureId = c.req.param('fixtureId')
  const body = await c.req.json()
  const validated = CreateFixtureSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [fixture] = await db
    .select({ id: propertyAssets.id })
    .from(propertyAssets)
    .where(and(eq(propertyAssets.id, fixtureId), eq(propertyAssets.propertyId, propertyId)))
    .limit(1)

  if (!fixture) {
    return warnJson(c, { error: '시설물을 찾을 수 없어요' }, 404)
  }

  await db.transaction(async (tx) => {
    await tx
      .update(propertyAssets)
      .set({
        category: validated.data.category,
        name: validated.data.name.trim(),
        location: validated.data.location.trim(),
        brand: validated.data.brand?.trim() || null,
        modelNumber: validated.data.modelNumber?.trim() || null,
        specNotes: validated.data.specNotes?.trim() || null,
        notes: validated.data.notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(propertyAssets.id, fixtureId))

    await tx.delete(propertyAssetPhotos).where(eq(propertyAssetPhotos.fixtureId, fixtureId))

    if (validated.data.photos.length > 0) {
      await tx.insert(propertyAssetPhotos).values(
        validated.data.photos.map((photo, index) => ({
          fixtureId,
          storagePath: photo.storagePath,
          thumbnailStoragePath: photo.thumbnailStoragePath,
          sortOrder: index,
        })),
      )
    }
  })

  return c.json({ success: true })
})

adminRoutes.delete('/properties/:id/registration/assets/:fixtureId', async (c) => {
  const propertyId = c.req.param('id')
  const fixtureId = c.req.param('fixtureId')

  const [fixture] = await db
    .select({ id: propertyAssets.id })
    .from(propertyAssets)
    .where(and(eq(propertyAssets.id, fixtureId), eq(propertyAssets.propertyId, propertyId)))
    .limit(1)

  if (!fixture) {
    return warnJson(c, { error: '시설물을 찾을 수 없어요' }, 404)
  }

  await db.delete(propertyAssets).where(eq(propertyAssets.id, fixtureId))

  return c.json({ success: true })
})

adminRoutes.post('/properties/:id/registration', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const validated = PropertyRegistrationSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [property] = await db
    .select({ id: properties.id, hostId: properties.hostId, name: properties.name, status: properties.status })
    .from(properties)
    .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
    .limit(1)

  if (!property) {
    return warnJson(c, { error: '숙소를 찾을 수 없어요' }, 404)
  }

  const wasPendingActivation = property.status === 'pending_activation'

  await db.transaction(async (tx) => {
    await tx
      .update(properties)
      .set({
        entrancePassword: validated.data.entrancePassword || null,
        doorLockPassword: validated.data.doorLockPassword,
        wifiSsid: validated.data.wifiSsid || null,
        wifiPassword: validated.data.wifiPassword || null,
        cleaningClosetLocation: validated.data.cleaningClosetLocation?.trim() || null,
        extraLinenLocation: validated.data.extraLinenLocation?.trim() || null,
        trashDisposalLocation: validated.data.trashDisposalLocation?.trim() || null,
        linenWashLocation: validated.data.linenWashLocation ?? null,
        // 최초 등록 완료 시에만 active로 전환 + activatedAt 기록. 이미 active인 숙소 수정 시 덮어쓰지 않음.
        ...(wasPendingActivation
          ? { status: 'active' as const, activatedAt: new Date() }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id))

    const existingFixtures = await tx
      .select({ id: propertyAssets.id })
      .from(propertyAssets)
      .where(eq(propertyAssets.propertyId, id))

    const incomingIds = validated.data.fixtures
      .map((fixture) => fixture.id)
      .filter((fixtureId): fixtureId is string => Boolean(fixtureId))

    const fixturesToDelete = existingFixtures
      .map((fixture) => fixture.id)
      .filter((fixtureId) => !incomingIds.includes(fixtureId))

    if (fixturesToDelete.length > 0) {
      await tx.delete(propertyAssets).where(inArray(propertyAssets.id, fixturesToDelete))
    }

    for (const fixture of validated.data.fixtures) {
      let fixtureId = fixture.id

      if (fixtureId) {
        await tx
          .update(propertyAssets)
          .set({
            category: fixture.category,
            name: fixture.name,
            location: fixture.location,
            brand: fixture.brand || null,
            modelNumber: fixture.modelNumber || null,
            specNotes: fixture.specNotes || null,
            notes: fixture.notes || null,
            updatedAt: new Date(),
          })
          .where(eq(propertyAssets.id, fixtureId))

        await tx.delete(propertyAssetPhotos).where(eq(propertyAssetPhotos.fixtureId, fixtureId))
      } else {
        const [createdFixture] = await tx
          .insert(propertyAssets)
          .values({
            propertyId: id,
            category: fixture.category,
            name: fixture.name,
            location: fixture.location,
            brand: fixture.brand || null,
            modelNumber: fixture.modelNumber || null,
            specNotes: fixture.specNotes || null,
            notes: fixture.notes || null,
          })
          .returning({ id: propertyAssets.id })

        fixtureId = createdFixture.id
      }

      if (fixture.photos.length > 0) {
        await tx.insert(propertyAssetPhotos).values(
          fixture.photos.map((photo, index) => ({
            fixtureId: fixtureId!,
            storagePath: photo.storagePath,
            thumbnailStoragePath: photo.thumbnailStoragePath,
            sortOrder: index,
          })),
        )
      }
    }
  })

  if (wasPendingActivation) {
    await notifyPropertyActivated({
      hostProfileId: property.hostId,
      propertyId: property.id,
      propertyName: property.name,
    })
  }

  return c.json({ success: true })
})

adminRoutes.post('/properties/:id/activate', async (c) => {
  const id = c.req.param('id')

  const [updated] = await db
    .update(properties)
    .set({
      status: 'active',
      activatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
    .returning({
      id: properties.id,
      hostId: properties.hostId,
      name: properties.name,
      status: properties.status,
      activatedAt: properties.activatedAt,
    })

  if (!updated) {
    return warnJson(c, { error: '숙소를 찾을 수 없어요' }, 404)
  }

  await notifyPropertyActivated({
    hostProfileId: updated.hostId,
    propertyId: updated.id,
    propertyName: updated.name,
  })

  return c.json(updated)
})
