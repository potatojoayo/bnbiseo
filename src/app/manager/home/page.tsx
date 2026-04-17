'use client'

import Link from 'next/link'
import { useManagerMe, useManagerMyCleanings } from '@/lib/hooks/use-manager'
import { ManagerCleaningCard } from '@/components/manager-cleaning-card'

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
  const { data: cleanings = [], isLoading } = useManagerMyCleanings()
  const todayDate = getTodayKst()
  const visibleCleanings = cleanings.filter((cleaning) =>
    cleaning.scheduledDate >= todayDate &&
    ['confirmed', 'in_progress', 'completed'].includes(cleaning.status),
  )

  if (managerMeLoading || isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast flex min-h-[calc(100dvh-80px)] flex-col px-6 pt-6 pb-10">
      <div className="pb-2">
        <h1 className="text-[22px] font-semibold text-ink">
          안녕하세요, {managerMe?.manager.name || managerMe?.profile.fullName || '매니저'}님
        </h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          예정된 청소를 확인해보세요.
        </p>
      </div>

      {visibleCleanings.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h2 className="text-[18px] font-semibold text-ink">
            아직 맡은 청소가 없어요
          </h2>
          <Link
            href="/manager/cleanings"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-brand px-5 text-[14px] font-semibold text-white transition-all active:scale-[0.98]"
          >
            청소 요청 보기
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-7">
          <section className="flex flex-col gap-3">
            <p className="px-1 text-[13px] font-medium text-ink-muted">청소 내역</p>
            {visibleCleanings.map((cleaning) => (
              <Link key={cleaning.id} href={`/manager/cleanings/${cleaning.id}`} className="block">
                <ManagerCleaningCard cleaning={cleaning} showStatus />
              </Link>
            ))}
          </section>
        </div>
      )}
    </div>
  )
}
