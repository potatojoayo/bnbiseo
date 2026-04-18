'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { type AppNotification, useInvalidateNotifications, useNotifications } from '@/lib/hooks/use-notifications'

function formatNotificationDate(value: string) {
  const date = new Date(value)
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60))

  if (diffMinutes < 1) return '방금 전'
  if (diffMinutes < 60) return `${diffMinutes}분 전`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}시간 전`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}일 전`

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function NotificationItem({
  item,
  onClick,
}: {
  item: AppNotification
  onClick: (item: AppNotification) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className="flex w-full flex-col rounded-xl border border-outline-dim bg-white px-4 py-4 text-left transition-colors active:bg-surface-subtle"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {!item.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
            <p className="truncate text-[15px] font-semibold text-ink">{item.title}</p>
          </div>
          <p className="mt-1 whitespace-pre-line break-words text-[14px] leading-relaxed text-ink-muted">
            {item.body}
          </p>
        </div>
        <span className="shrink-0 pt-0.5 text-[12px] text-ink-faint">
          {formatNotificationDate(item.createdAt)}
        </span>
      </div>
    </button>
  )
}

export function NotificationPageContent() {
  const router = useRouter()
  const { data, isLoading } = useNotifications()
  const invalidateNotifications = useInvalidateNotifications()
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function handleReadAll() {
    await api.post('/notifications/read-all')
    await invalidateNotifications()
  }

  async function handleItemClick(item: AppNotification) {
    setPendingId(item.id)

    try {
      if (!item.isRead) {
        await api.post(`/notifications/${item.id}/read`)
        await invalidateNotifications()
      }
      router.push(item.targetPath)
    } finally {
      setPendingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-160px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  const items = data?.items ?? []
  const unreadCount = data?.unreadCount ?? 0

  if (items.length === 0) {
    return (
      <div className="flex min-h-[calc(100dvh-160px)] flex-col items-center justify-center text-center">
        <h2 className="text-[18px] font-semibold text-ink">받은 알림이 없어요</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
          새로운 알림이 오면 이곳에 보여드릴게요.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <p className="text-[13px] font-medium text-ink-muted">
          {unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : '모든 알림을 확인했어요'}
        </p>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleReadAll}
            className="text-[13px] font-medium text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
          >
            모두 읽음
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className={pendingId === item.id ? 'pointer-events-none opacity-70' : undefined}>
            <NotificationItem item={item} onClick={handleItemClick} />
          </div>
        ))}
      </div>
    </div>
  )
}
