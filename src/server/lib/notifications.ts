import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { managers, notifications, profiles } from '@/db/schema'
import {
  cleaningAssignedHostTemplate,
  cleaningAssignedManagerTemplate,
  cleaningCancelledHostTemplate,
  cleaningCancelledManagerTemplate,
  cleaningCompletedHostTemplate,
  cleaningStartedHostTemplate,
  cleaningUrgentManagerTemplate,
  propertyActivatedTemplate,
  repairCancelledHostTemplate,
  repairCancelledManagerTemplate,
  repairCompletedHostTemplate,
  repairConfirmedHostTemplate,
  repairConfirmedManagerTemplate,
  repairQuotedHostTemplate,
  repairRequestedManagerTemplate,
  repairStartedHostTemplate,
} from '@/server/lib/alimtalk-templates'
import { dispatchAdminEmail, dispatchAlimtalk } from '@/server/lib/notification-dispatch'

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

export async function getActiveManagerRecipientProfiles() {
  return db
    .select({
      profileId: profiles.id,
      managerId: managers.id,
      phone: profiles.phone,
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
      phone: profiles.phone,
    })
    .from(managers)
    .innerJoin(profiles, eq(managers.profileId, profiles.id))
    .where(and(eq(managers.id, managerId), isNull(profiles.deletedAt)))
    .limit(1)

  return row ?? null
}

async function getProfilePhone(profileId: string) {
  const [row] = await db
    .select({ phone: profiles.phone })
    .from(profiles)
    .where(and(eq(profiles.id, profileId), isNull(profiles.deletedAt)))
    .limit(1)

  return row?.phone ?? null
}

// ─── Property ───────────────────────────────────────────────────────────────

export async function notifyPropertySubmitted(input: {
  propertyId: string
  propertyName: string
  hostName: string | null
  hostEmail: string | null
}) {
  const html = `
    <h2>새 숙소 등록 요청</h2>
    <p><strong>${input.propertyName}</strong> 숙소가 등록 요청되었습니다.</p>
    <ul>
      <li>호스트: ${input.hostName ?? '-'} ${input.hostEmail ? `(${input.hostEmail})` : ''}</li>
      <li>숙소 ID: ${input.propertyId}</li>
    </ul>
    <p>관리자 페이지에서 검토해주세요.</p>
  `
  const text = `[BnBiseo] ${input.propertyName} 숙소 등록 요청. 호스트: ${input.hostName ?? '-'}`

  await dispatchAdminEmail({
    subject: `[BnBiseo] 새 숙소 등록 요청 — ${input.propertyName}`,
    html,
    text,
  })
}

export async function notifyPropertyActivated(input: {
  hostProfileId: string
  propertyId: string
  propertyName: string
}) {
  await createNotifications([
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

  const phone = await getProfilePhone(input.hostProfileId)
  await dispatchAlimtalk(propertyActivatedTemplate, phone, {
    propertyName: input.propertyName,
    propertyId: input.propertyId,
  })
}

// ─── Cleaning ───────────────────────────────────────────────────────────────

export async function notifyCleaningRequested(input: {
  cleaningRequestId: string
  hostProfileId: string
  propertyName: string
  scheduledDate: string
  scheduledTime: string
  isUrgent: boolean
}) {
  const managerRecipients = await getActiveManagerRecipientProfiles()

  await createNotifications([
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
      type: (input.isUrgent ? 'cleaning_urgent_requested' : 'cleaning_requested') as NotificationType,
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

  // Alimtalk only for the urgent broadcast — non-urgent manager broadcasts
  // would generate excessive alimtalk volume across all active managers.
  if (input.isUrgent) {
    await Promise.all(
      managerRecipients.map((recipient) =>
        dispatchAlimtalk(cleaningUrgentManagerTemplate, recipient.phone, {
          propertyName: input.propertyName,
          scheduledDate: input.scheduledDate,
          scheduledTime: input.scheduledTime,
        }),
      ),
    )
  }
}

export async function notifyCleaningAssigned(input: {
  cleaningRequestId: string
  hostProfileId: string
  managerId: string | null
  propertyName: string
  scheduledDate: string
  scheduledTime: string
  managerName: string
}) {
  const recipient = input.managerId ? await getManagerRecipientProfile(input.managerId) : null

  await createNotifications([
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

  const hostPhone = await getProfilePhone(input.hostProfileId)
  await Promise.all([
    dispatchAlimtalk(cleaningAssignedHostTemplate, hostPhone, {
      propertyName: input.propertyName,
      managerName: input.managerName,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      cleaningRequestId: input.cleaningRequestId,
    }),
    dispatchAlimtalk(cleaningAssignedManagerTemplate, recipient?.phone, {
      propertyName: input.propertyName,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      cleaningRequestId: input.cleaningRequestId,
    }),
  ])
}

export async function notifyCleaningStarted(input: {
  cleaningRequestId: string
  hostProfileId: string
  propertyName: string
}) {
  await createNotifications([
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

  const phone = await getProfilePhone(input.hostProfileId)
  await dispatchAlimtalk(cleaningStartedHostTemplate, phone, {
    propertyName: input.propertyName,
    cleaningRequestId: input.cleaningRequestId,
  })
}

export async function notifyCleaningCompleted(input: {
  cleaningRequestId: string
  hostProfileId: string
  propertyName: string
}) {
  await createNotifications([
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

  const phone = await getProfilePhone(input.hostProfileId)
  await dispatchAlimtalk(cleaningCompletedHostTemplate, phone, {
    propertyName: input.propertyName,
    cleaningRequestId: input.cleaningRequestId,
  })
}

export async function notifyCleaningCancelledByHost(input: {
  cleaningRequestId: string
  hostProfileId: string
  managerId: string | null
  propertyName: string
  scheduledDate: string
  scheduledTime: string
}) {
  const recipient = input.managerId ? await getManagerRecipientProfile(input.managerId) : null

  await createNotifications([
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

  // Manager loses a confirmed slot — alert via alimtalk. Host triggered
  // the cancel themselves, so the in-app confirmation is enough for them.
  await dispatchAlimtalk(cleaningCancelledManagerTemplate, recipient?.phone, {
    propertyName: input.propertyName,
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
  })
}

export async function notifyCleaningCancelledByAdmin(input: {
  cleaningRequestId: string
  hostProfileId: string
  managerId: string | null
  propertyName: string
  scheduledDate: string
  scheduledTime: string
}) {
  const recipient = input.managerId ? await getManagerRecipientProfile(input.managerId) : null

  await createNotifications([
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

  const hostPhone = await getProfilePhone(input.hostProfileId)
  await Promise.all([
    dispatchAlimtalk(cleaningCancelledHostTemplate, hostPhone, {
      propertyName: input.propertyName,
      cleaningRequestId: input.cleaningRequestId,
    }),
    dispatchAlimtalk(cleaningCancelledManagerTemplate, recipient?.phone, {
      propertyName: input.propertyName,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
    }),
  ])
}

// ─── Repair ─────────────────────────────────────────────────────────────────

export async function notifyRepairRequested(input: {
  repairRequestId: string
  hostProfileId: string
  propertyName: string
  preferredScheduledDate: string
  preferredScheduledTime: string
}) {
  const managerRecipients = await getActiveManagerRecipientProfiles()

  await createNotifications([
    {
      profileId: input.hostProfileId,
      type: 'repair_requested',
      title: '수리 요청 접수',
      body: `${input.propertyName} 수리 요청이 접수되었어요.`,
      targetPath: `/repair/${input.repairRequestId}`,
      entityType: 'repair_request',
      entityId: input.repairRequestId,
    },
    ...managerRecipients.map((recipient) => ({
      profileId: recipient.profileId,
      type: 'repair_requested' as const,
      title: '새 수리 요청',
      body: `${input.propertyName} · 희망 ${input.preferredScheduledDate} ${input.preferredScheduledTime}`,
      targetPath: '/manager/repairs',
      entityType: 'repair_request',
      entityId: input.repairRequestId,
      payload: { managerId: recipient.managerId },
    })),
  ])

  // Alert all active managers via alimtalk so someone picks it up quickly.
  await Promise.all(
    managerRecipients.map((recipient) =>
      dispatchAlimtalk(repairRequestedManagerTemplate, recipient.phone, {
        propertyName: input.propertyName,
        preferredScheduledDate: input.preferredScheduledDate,
        preferredScheduledTime: input.preferredScheduledTime,
        repairRequestId: input.repairRequestId,
      }),
    ),
  )
}

export async function notifyRepairQuoted(input: {
  repairRequestId: string
  hostProfileId: string
  propertyName: string
  quotedCost: number
  scheduledDate: string
  scheduledTime: string
}) {
  await createNotifications([
    {
      profileId: input.hostProfileId,
      type: 'repair_quoted',
      title: '견적이 도착했어요',
      body: `${input.propertyName} 수리 견적이 도착했어요. ${input.quotedCost.toLocaleString()}원`,
      targetPath: `/repair/${input.repairRequestId}`,
      entityType: 'repair_request',
      entityId: input.repairRequestId,
    },
  ])

  const phone = await getProfilePhone(input.hostProfileId)
  await dispatchAlimtalk(repairQuotedHostTemplate, phone, {
    propertyName: input.propertyName,
    quotedCost: input.quotedCost,
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    repairRequestId: input.repairRequestId,
  })
}

export async function notifyRepairConfirmed(input: {
  repairRequestId: string
  hostProfileId: string
  managerId: string | null
  propertyName: string
  scheduledDate: string
  scheduledTime: string
  managerName: string
}) {
  const recipient = input.managerId ? await getManagerRecipientProfile(input.managerId) : null

  await createNotifications([
    {
      profileId: input.hostProfileId,
      type: 'repair_confirmed',
      title: '수리 일정 확정',
      body: `${input.propertyName} 수리 결제가 완료되어 방문 일정이 확정되었어요.`,
      targetPath: `/repair/${input.repairRequestId}`,
      entityType: 'repair_request',
      entityId: input.repairRequestId,
    },
    ...(recipient
      ? [{
          profileId: recipient.profileId,
          type: 'repair_confirmed' as const,
          title: '수리 일정 확정',
          body: `${input.propertyName} 수리 일정이 확정되었어요.`,
          targetPath: `/manager/repairs/${input.repairRequestId}`,
          entityType: 'repair_request',
          entityId: input.repairRequestId,
        }]
      : []),
  ])

  const hostPhone = await getProfilePhone(input.hostProfileId)
  await Promise.all([
    dispatchAlimtalk(repairConfirmedHostTemplate, hostPhone, {
      propertyName: input.propertyName,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      managerName: input.managerName,
      repairRequestId: input.repairRequestId,
    }),
    dispatchAlimtalk(repairConfirmedManagerTemplate, recipient?.phone, {
      propertyName: input.propertyName,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      repairRequestId: input.repairRequestId,
    }),
  ])
}

export async function notifyRepairStarted(input: {
  repairRequestId: string
  hostProfileId: string
  propertyName: string
}) {
  await createNotifications([
    {
      profileId: input.hostProfileId,
      type: 'repair_started',
      title: '수리 작업 시작',
      body: `${input.propertyName} 수리 작업이 시작되었어요.`,
      targetPath: `/repair/${input.repairRequestId}`,
      entityType: 'repair_request',
      entityId: input.repairRequestId,
    },
  ])

  const phone = await getProfilePhone(input.hostProfileId)
  await dispatchAlimtalk(repairStartedHostTemplate, phone, {
    propertyName: input.propertyName,
    repairRequestId: input.repairRequestId,
  })
}

export async function notifyRepairCompleted(input: {
  repairRequestId: string
  hostProfileId: string
  propertyName: string
}) {
  await createNotifications([
    {
      profileId: input.hostProfileId,
      type: 'repair_completed',
      title: '수리 완료',
      body: `${input.propertyName} 수리가 완료되었어요. 조치 보고서를 확인해보세요.`,
      targetPath: `/repair/${input.repairRequestId}`,
      entityType: 'repair_request',
      entityId: input.repairRequestId,
    },
  ])

  const phone = await getProfilePhone(input.hostProfileId)
  await dispatchAlimtalk(repairCompletedHostTemplate, phone, {
    propertyName: input.propertyName,
    repairRequestId: input.repairRequestId,
  })
}

export async function notifyRepairCancelledByHost(input: {
  repairRequestId: string
  hostProfileId: string
  managerId: string | null
  propertyName: string
  scheduledDate: string | null
  scheduledTime: string | null
}) {
  const recipient = input.managerId ? await getManagerRecipientProfile(input.managerId) : null

  await createNotifications([
    {
      profileId: input.hostProfileId,
      type: 'repair_cancelled_by_host',
      title: '수리 요청 취소',
      body: `${input.propertyName} 수리 요청이 취소되었어요.`,
      targetPath: `/repair/${input.repairRequestId}/cancelled`,
      entityType: 'repair_request',
      entityId: input.repairRequestId,
    },
    ...(recipient
      ? [{
          profileId: recipient.profileId,
          type: 'repair_cancelled_by_host' as const,
          title: '수리 일정 취소',
          body: `${input.propertyName} 담당 수리 일정이 취소되었어요.`,
          targetPath: '/manager/repairs',
          entityType: 'repair_request',
          entityId: input.repairRequestId,
        }]
      : []),
  ])

  if (recipient && input.scheduledDate && input.scheduledTime) {
    await dispatchAlimtalk(repairCancelledManagerTemplate, recipient.phone, {
      propertyName: input.propertyName,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
    })
  }
}

export async function notifyRepairCancelledByManager(input: {
  repairRequestId: string
  hostProfileId: string
  propertyName: string
}) {
  await createNotifications([
    {
      profileId: input.hostProfileId,
      type: 'repair_cancelled_by_manager',
      title: '수리 일정 취소',
      body: `${input.propertyName} 수리 일정이 운영 사유로 취소되었어요.`,
      targetPath: `/repair/${input.repairRequestId}/cancelled`,
      entityType: 'repair_request',
      entityId: input.repairRequestId,
    },
  ])

  const phone = await getProfilePhone(input.hostProfileId)
  await dispatchAlimtalk(repairCancelledHostTemplate, phone, {
    propertyName: input.propertyName,
    repairRequestId: input.repairRequestId,
  })
}

// ─── Read state ─────────────────────────────────────────────────────────────

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
