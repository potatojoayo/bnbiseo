'use client'

import Link from 'next/link'
import { useManagerMe, useManagerMyCleanings, useManagerMyRepairs } from '@/lib/hooks/use-manager'
import { ManagerCleaningCard } from '@/components/manager-cleaning-card'
import { ManagerRepairCard } from '@/components/manager-repair-card'
import { NotificationBell } from '@/components/notification-bell'

function getTodayKst() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export default function ManagerHomePage() {
  const { data: managerMe, isLoading: managerMeLoading } = useManagerMe()
  const { data: cleanings = [], isLoading: cleaningsLoading } = useManagerMyCleanings()
  const { data: repairs = [], isLoading: repairsLoading } = useManagerMyRepairs()
  const todayDate = getTodayKst()

  const visibleCleanings = cleanings.filter((cleaning) =>
    cleaning.scheduledDate >= todayDate &&
    ['confirmed', 'in_progress', 'completed'].includes(cleaning.status),
  )

  const visibleRepairs = repairs.filter((repair) => {
    if (['completed', 'cancelled'].includes(repair.status)) return false
    const date = repair.scheduledDate ?? repair.preferredScheduledDate
    return date >= todayDate
  })

  if (managerMeLoading || cleaningsLoading || repairsLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast flex min-h-[calc(100dvh-80px)] flex-col px-6 pt-6 pb-10">
      <div className="flex items-start justify-between pb-2">
        <div>
          <h1 className="text-[22px] font-semibold text-ink">
            안녕하세요, {managerMe?.manager.name || managerMe?.profile.fullName || '매니저'}님
          </h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            예정된 일정을 확인해보세요.
          </p>
        </div>
        <NotificationBell href="/manager/notifications" />
      </div>

      <div className="mt-6 flex flex-col gap-7">
        <section className="flex flex-col gap-3">
          <p className="px-1 text-[13px] font-medium text-ink-muted">청소</p>
          {visibleCleanings.length > 0 ? (
            visibleCleanings.map((cleaning) => (
              <Link key={cleaning.id} href={`/manager/cleanings/${cleaning.id}`} className="block">
                <ManagerCleaningCard cleaning={cleaning} showStatus />
              </Link>
            ))
          ) : (
            <EmptySection
              message="예정된 청소가 없어요"
              href="/manager/cleanings"
              ctaLabel="청소 요청 보러가기"
            />
          )}
        </section>

        <section className="flex flex-col gap-3">
          <p className="px-1 text-[13px] font-medium text-ink-muted">수리</p>
          {visibleRepairs.length > 0 ? (
            visibleRepairs.map((repair) => (
              <Link key={repair.id} href={`/manager/repairs/${repair.id}`} className="block">
                <ManagerRepairCard repair={repair} showStatus />
              </Link>
            ))
          ) : (
            <EmptySection
              message="예정된 수리가 없어요"
              href="/manager/repairs"
              ctaLabel="수리 요청 보러가기"
            />
          )}
        </section>
      </div>
    </div>
  )
}

function EmptySection({
  message,
  href,
  ctaLabel,
}: {
  message: string
  href: string
  ctaLabel: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline-dim bg-white px-4 py-6 text-center">
      <p className="text-[14px] text-ink-muted">{message}</p>
      <Link
        href={href}
        className="inline-flex h-9 items-center justify-center rounded-lg bg-ink px-4 text-[13px] font-semibold text-white transition-all active:scale-[0.98]"
      >
        {ctaLabel}
      </Link>
    </div>
  )
}
