'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { HostCleaningRequestCard } from '@/components/host-cleaning-request-card'
import { useCleaningRequests } from '@/lib/hooks/use-cleaning'

export default function CleaningHistoryPage() {
  const router = useRouter()
  const { data: requests = [], isLoading } = useCleaningRequests()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-80px)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  // pending_payment은 미완료 결제이므로 제외
  const visible = requests.filter((r) => r.status !== 'pending_payment')

  return (
    <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col px-6 pt-6 pb-10">
      {/* Header */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-3 -ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
      >
        <ChevronLeftIcon size={32} />
      </button>
      <h1 className="mb-6 text-[22px] font-semibold text-ink">
        청소 내역
      </h1>

      {visible.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="mb-4 text-[14px] text-ink-muted">청소 내역이 없어요</p>
          <Link
            href="/cleaning"
            className="px-5 h-10 rounded-lg bg-brand text-white text-[14px] font-semibold inline-flex items-center justify-center active:scale-[0.98] transition-all"
          >
            청소 요청하기
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((r) => (
            <HostCleaningRequestCard key={r.id} request={r} href={`/cleaning/${r.id}`} />
          ))}
        </div>
      )}
    </div>
  )
}
