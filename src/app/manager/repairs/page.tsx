'use client'

import Link from 'next/link'
import { useManagerOpenRepairs } from '@/lib/hooks/use-manager'
import { ManagerRepairCard } from '@/components/manager-repair-card'

export default function ManagerRepairsPage() {
  const { data: repairs = [], isLoading } = useManagerOpenRepairs()

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast flex min-h-[calc(100dvh-80px)] flex-col px-6 pt-6 pb-10">
      <h1 className="text-[22px] font-semibold text-ink">수리 요청</h1>
      <p className="mt-1 text-[14px] text-ink-muted">
        호스트들이 요청한 수리를 확인해보세요.
      </p>

      {repairs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">
              지금은 가져올 요청이 없어요
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              새로운 수리 요청이 들어오면 이곳에 보여드릴게요.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {repairs.map((repair) => (
            <Link key={repair.id} href={`/manager/repairs/${repair.id}`} className="block">
              <ManagerRepairCard repair={repair} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
