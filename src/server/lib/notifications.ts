import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { managers, notifications, profiles } from '@/db/schema'

type NotificationType = typeof notifications.$inferInsert.type

type CreateNotificationInput = {
  profileId: string
  type: NotificationType
  title: string
  body: string
  targetPath: string
  entityType?: string
  entityId?: string
  payload?: Record<string, unknown>
}

export async function createNotifications(inputs: CreateNotificationInput[]) {
  if (inputs.length === 0) return []

  return db
    .insert(notifications)
    .values(inputs)
    .returning({ id: notifications.id })
}

export async function getAdminProfileIds() {
  const rows = await db
    .select({ profileId: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.role, 'admin'), isNull(profiles.deletedAt)))

  return rows.map((row) => row.profileId)
}

export async function getActiveManagerRecipientProfiles() {
  return db
    .select({
      profileId: profiles.id,
      managerId: managers.id,
    })
    .from(managers)
    .innerJoin(profiles, eq(managers.profileId, profiles.id))
    .where(and(eq(managers.isActive, true), isNull(profiles.deletedAt)))
}

export async function getManagerRecipientProfile(managerId: string) {
  const [row] = await db
    .select({
      profileId: profiles.id,
      managerId: managers.id,
    })
    .from(managers)
    .innerJoin(profiles, eq(managers.profileId, profiles.id))
    .where(and(eq(managers.id, managerId), isNull(profiles.deletedAt)))
    .limit(1)

  return row ?? null
}

export async function notifyPropertySubmitted(input: {
  propertyId: string
  propertyName: string
}) {
  const adminProfileIds = await getAdminProfileIds()

  return createNotifications(
    adminProfileIds.map((profileId) => ({
      profileId,
      type: 'property_submitted',
      title: '새 숙소 등록 요청',
      body: `${input.propertyName} 숙소 등록 요청이 들어왔어요.`,
      targetPath: '/admin/properties',
      entityType: 'property',
      entityId: input.propertyId,
    })),
  )
}

export async function notifyPropertyActivated(input: {
  hostProfileId: string
  propertyId: string
  propertyName: string
}) {
  return createNotifications([
    {
      profileId: input.hostProfileId,
      type: 'property_activated',
      title: '숙소 등록 완료',
      body: `${input.propertyName} 숙소 등록이 완료되었어요.`,
      targetPath: `/my/properties/${input.propertyId}`,
      entityType: 'property',
      entityId: input.propertyId,
    },
  ])
}

export async function notifyCleaningRequested(input: {
  cleaningRequestId: string
  hostProfileId: string
  propertyName: string
  scheduledDate: string
  scheduledTime: string
  isUrgent: boolean
}) {
  const managerRecipients = await getActiveManagerRecipientProfiles()

  return createNotifications([
    {
      profileId: input.hostProfileId,
      type: 'cleaning_requested',
      title: '청소 요청 접수',
      body: `${input.propertyName} 청소 요청이 접수되었어요.`,
      targetPath: `/cleaning/${input.cleaningRequestId}`,
      entityType: 'cleaning_request',
      entityId: input.cleaningRequestId,
    },
    ...managerRecipients.map((recipient) => ({
      profileId: recipient.profileId,
      type: input.isUrgent ? 'cleaning_urgent_requested' : 'cleaning_requested',
      title: input.isUrgent ? '긴급 청소 요청' : '새 청소 요청',
      body: `${input.propertyName} · ${input.scheduledDate} ${input.scheduledTime}`,
      targetPath: '/manager/cleanings',
      entityType: 'cleaning_request',
      entityId: input.cleaningRequestId,
      payload: {
        managerId: recipient.managerId,
        isUrgent: input.isUrgent,
      },
    })),
  ])
}

export async function notifyCleaningAssigned(input: {
  cleaningRequestId: string
  hostProfileId: string
  managerId: string | null
  propertyName: string
}) {
  const recipient = input.managerId ? await getManagerRecipientProfile(input.managerId) : null

  return createNotifications([
    {
      profileId: input.hostProfileId,
      type: 'cleaning_assigned',
      title: '매니저 배정 완료',
      body: `${input.propertyName} 청소에 매니저가 배정되었어요.`,
      targetPath: `/cleaning/${input.cleaningRequestId}`,
      entityType: 'cleaning_request',
      entityId: input.cleaningRequestId,
    },
    ...(recipient
      ? [{
          profileId: recipient.profileId,
          type: 'cleaning_assigned' as const,
          title: '새 청소 일정 배정',
          body: `${input.propertyName} 청소 일정이 배정되었어요.`,
          targetPath: `/manager/cleanings/${input.cleaningRequestId}`,
          entityType: 'cleaning_request',
          entityId: input.cleaningRequestId,
        }]
      : []),
  ])
}

export async function notifyCleaningStarted(input: {
  cleaningRequestId: string
  hostProfileId: string
  propertyName: string
}) {
  return createNotifications([
    {
      profileId: input.hostProfileId,
      type: 'cleaning_started',
      title: '청소 시작',
      body: `${input.propertyName} 청소가 시작되었어요.`,
      targetPath: `/cleaning/${input.cleaningRequestId}`,
      entityType: 'cleaning_request',
      entityId: input.cleaningRequestId,
    },
  ])
}

export async function notifyCleaningCompleted(input: {
  cleaningRequestId: string
  hostProfileId: string
  propertyName: string
}) {
  return createNotifications([
    {
      profileId: input.hostProfileId,
      type: 'cleaning_completed',
      title: '청소 완료',
      body: `${input.propertyName} 청소가 완료되었어요. 리포트를 확인해보세요.`,
      targetPath: `/cleaning/${input.cleaningRequestId}`,
      entityType: 'cleaning_request',
      entityId: input.cleaningRequestId,
    },
  ])
}

export async function notifyCleaningCancelledByHost(input: {
  cleaningRequestId: string
  hostProfileId: string
  managerId: string | null
  propertyName: string
}) {
  const recipient = input.managerId ? await getManagerRecipientProfile(input.managerId) : null

  return createNotifications([
    {
      profileId: input.hostProfileId,
      type: 'cleaning_cancelled_by_host',
      title: '청소 요청 취소',
      body: `${input.propertyName} 청소 요청이 취소되었어요.`,
      targetPath: `/cleaning/${input.cleaningRequestId}/cancelled`,
      entityType: 'cleaning_request',
      entityId: input.cleaningRequestId,
    },
    ...(recipient
      ? [{
          profileId: recipient.profileId,
          type: 'cleaning_cancelled_by_host' as const,
          title: '청소 일정 취소',
          body: `${input.propertyName} 담당 청소 일정이 취소되었어요.`,
          targetPath: '/manager/cleanings',
          entityType: 'cleaning_request',
          entityId: input.cleaningRequestId,
        }]
      : []),
  ])
}

export async function notifyCleaningCancelledByAdmin(input: {
  cleaningRequestId: string
  hostProfileId: string
  managerId: string | null
  propertyName: string
}) {
  const recipient = input.managerId ? await getManagerRecipientProfile(input.managerId) : null

  return createNotifications([
    {
      profileId: input.hostProfileId,
      type: 'cleaning_cancelled_by_admin',
      title: '청소 일정 취소',
      body: `${input.propertyName} 청소 일정이 운영 사유로 취소되었어요.`,
      targetPath: `/cleaning/${input.cleaningRequestId}/cancelled`,
      entityType: 'cleaning_request',
      entityId: input.cleaningRequestId,
    },
    ...(recipient
      ? [{
          profileId: recipient.profileId,
          type: 'cleaning_cancelled_by_admin' as const,
          title: '청소 일정 취소',
          body: `${input.propertyName} 담당 청소 일정이 취소되었어요.`,
          targetPath: '/manager/cleanings',
          entityType: 'cleaning_request',
          entityId: input.cleaningRequestId,
        }]
      : []),
  ])
}

export async function listNotifications(profileId: string) {
  const [items, unreadCountRows] = await Promise.all([
    db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        body: notifications.body,
        targetPath: notifications.targetPath,
        entityType: notifications.entityType,
        entityId: notifications.entityId,
        payload: notifications.payload,
        isRead: notifications.isRead,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.profileId, profileId))
      .orderBy(desc(notifications.createdAt))
      .limit(50),
    db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.profileId, profileId), eq(notifications.isRead, false))),
  ])

  return {
    items,
    unreadCount: Number(unreadCountRows[0]?.count ?? 0),
  }
}

export async function markNotificationRead(profileId: string, notificationId: string) {
  const [updated] = await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(and(eq(notifications.id, notificationId), eq(notifications.profileId, profileId)))
    .returning({ id: notifications.id })

  return updated ?? null
}

export async function markNotificationsRead(profileId: string, notificationIds: string[]) {
  if (notificationIds.length === 0) return []

  return db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(and(eq(notifications.profileId, profileId), inArray(notifications.id, notificationIds)))
    .returning({ id: notifications.id })
}

export async function markAllNotificationsRead(profileId: string) {
  return db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(and(eq(notifications.profileId, profileId), eq(notifications.isRead, false)))
    .returning({ id: notifications.id })
}
