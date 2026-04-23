'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { ManagerRepairCard } from '@/components/manager-repair-card'
import { useManagerMyRepairs } from '@/lib/hooks/use-manager'

export default function ManagerRepairHistoryPage() {
  const router = useRouter()
  const { data: repairs = [], isLoading } = useManagerMyRepairs()

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast flex min-h-[calc(100dvh-80px)] flex-col px-6 pt-6 pb-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex h-10 w-10 -ml-4 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
      >
        <ChevronLeftIcon size={32} />
      </button>
      <h1 className="mb-6 text-[22px] font-semibold text-ink">
        수리 내역
      </h1>

      {repairs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="mb-4 text-[14px] text-ink-muted">수리 내역이 없어요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
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
