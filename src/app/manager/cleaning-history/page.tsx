'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, CalendarIcon, ClockIcon } from 'lucide-react'
import { useManagerMyCleanings } from '@/lib/hooks/use-manager'
import { formatDateLabel, formatTimeKorean } from '@/lib/utils'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmed: { label: '배정 완료', color: 'bg-success-soft text-success' },
  in_progress: { label: '청소 진행 중', color: 'bg-info-soft text-info' },
  completed: { label: '청소 완료', color: 'bg-surface-soft text-ink' },
}

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
          {requests.map((request) => {
            const statusInfo = STATUS_LABELS[request.status]

            return (
              <div
                key={request.id}
                className="flex flex-col gap-2 rounded-xl border border-outline-dim px-4 py-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-ink">
                    {request.propertyName || '숙소'}
                  </span>
                  {statusInfo && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-[13px] text-ink-muted">
                  <span className="flex items-center gap-1">
                    <CalendarIcon size={13} strokeWidth={1.5} />
                    {formatDateLabel(request.scheduledDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon size={13} strokeWidth={1.5} />
                    {formatTimeKorean(request.scheduledTime)}
                  </span>
                </div>

                <p className="text-[13px] text-ink-muted">
                  {request.finalPrice.toLocaleString()}원
                  {request.cleaningType === 'urgent' && (
                    <span className="ml-1 text-[11px] text-brand">긴급</span>
                  )}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
