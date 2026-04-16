'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon, CalendarIcon, ClockIcon } from 'lucide-react'
import { useCleaningRequests } from '@/lib/hooks/use-cleaning'
import { formatDateLabel, formatTimeKorean } from '@/lib/utils'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: '결제 대기', color: 'bg-warning-soft text-warning' },
  pending: { label: '매니저 배정 중', color: 'bg-brand/8 text-brand' },
  confirmed: { label: '매니저 배정 완료', color: 'bg-success-soft text-success' },
  in_progress: { label: '청소 진행 중', color: 'bg-info-soft text-info' },
  completed: { label: '청소 완료', color: 'bg-surface-soft text-ink' },
  cancelled: { label: '취소됨', color: 'bg-surface-soft text-ink-faint' },
}

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
          {visible.map((r) => {
            const statusInfo = STATUS_LABELS[r.status]
            const isCancelled = r.status === 'cancelled'

            return (
              <Link
                key={r.id}
                href={`/cleaning/${r.id}`}
                className="flex flex-col gap-2 rounded-xl border border-outline-dim px-4 py-4 transition-all active:scale-[0.99]"
              >
                {/* Property + Status */}
                <div className="flex items-center justify-between">
                  <span className={`text-[15px] font-semibold ${isCancelled ? 'text-ink-faint' : 'text-ink'}`}>
                    {r.propertyName || '숙소'}
                  </span>
                  {statusInfo && (
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  )}
                </div>

                {/* Date & Time */}
                <div className={`flex items-center gap-4 text-[13px] ${isCancelled ? 'text-ink-faint' : 'text-ink-muted'}`}>
                  <span className="flex items-center gap-1">
                    <CalendarIcon size={13} strokeWidth={1.5} />
                    {formatDateLabel(r.scheduledDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon size={13} strokeWidth={1.5} />
                    {formatTimeKorean(r.scheduledTime)}
                  </span>
                </div>

                {/* Price */}
                <p className={`text-[13px] ${isCancelled ? 'text-ink-faint line-through' : 'text-ink-muted'}`}>
                  {r.finalPrice.toLocaleString()}원
                  {r.cleaningType === 'urgent' && !isCancelled && (
                    <span className="text-brand ml-1 text-[11px]">긴급</span>
                  )}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
