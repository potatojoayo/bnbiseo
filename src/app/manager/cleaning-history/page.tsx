'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { ManagerCleaningCard } from '@/components/manager-cleaning-card'
import { useManagerMyCleanings } from '@/lib/hooks/use-manager'

export default function ManagerCleaningHistoryPage() {
  const router = useRouter()
  const { data: requests = [], isLoading } = useManagerMyCleanings()

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
        청소 내역
      </h1>

      {requests.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="mb-4 text-[14px] text-ink-muted">청소 내역이 없어요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((request) => (
            <Link key={request.id} href={`/manager/cleanings/${request.id}`} className="block">
              <ManagerCleaningCard cleaning={request} showStatus />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
