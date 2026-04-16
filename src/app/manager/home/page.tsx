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
  const { data: managerMe } = useManagerMe()
  const { data: cleanings = [], isLoading } = useManagerMyCleanings()
  const todayDate = getTodayKst()
  const todayCleanings = cleanings.filter((cleaning) => cleaning.scheduledDate === todayDate)
  const inProgressCleanings = cleanings.filter((cleaning) => cleaning.status === 'in_progress')
  const upcomingCleanings = cleanings.filter((cleaning) => cleaning.status === 'confirmed')

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#EBEBEB] border-t-[#717171]" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast flex min-h-[calc(100dvh-80px)] flex-col px-6 pt-6 pb-10">
      <div className="pb-2">
        <h1 className="text-[22px] font-semibold text-[#222222]">
          안녕하세요, {managerMe?.manager.name || managerMe?.profile.fullName || '매니저'}님
        </h1>
        <p className="mt-1 text-[14px] text-[#717171]">
          오늘 맡은 청소와 진행 중인 요청을 확인해보세요.
        </p>
      </div>

      {cleanings.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h2 className="text-[18px] font-semibold text-[#222222]">
            아직 맡은 청소가 없어요
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#717171]">
            청소 요청 페이지에서 새 요청을 확인하고 직접 맡을 수 있어요.
          </p>
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
            <p className="px-1 text-[13px] font-medium text-[#717171]">오늘 청소</p>
            {todayCleanings.length > 0 ? (
              todayCleanings.map((cleaning) => (
                <ManagerCleaningCard key={cleaning.id} cleaning={cleaning} showStatus />
              ))
            ) : (
              <p className="px-1 text-[14px] text-[#B0B0B0]">오늘 예정된 청소가 없어요.</p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <p className="px-1 text-[13px] font-medium text-[#717171]">진행 중</p>
            {inProgressCleanings.length > 0 ? (
              inProgressCleanings.map((cleaning) => (
                <ManagerCleaningCard key={cleaning.id} cleaning={cleaning} showStatus />
              ))
            ) : (
              <p className="px-1 text-[14px] text-[#B0B0B0]">현재 진행 중인 청소가 없어요.</p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <p className="px-1 text-[13px] font-medium text-[#717171]">예정된 청소</p>
            {upcomingCleanings.length > 0 ? (
              upcomingCleanings.map((cleaning) => (
                <ManagerCleaningCard key={cleaning.id} cleaning={cleaning} showStatus />
              ))
            ) : (
              <p className="px-1 text-[14px] text-[#B0B0B0]">예정된 청소가 없어요.</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
