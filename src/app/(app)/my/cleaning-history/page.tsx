'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon, CalendarIcon, ClockIcon } from 'lucide-react'
import { useCleaningRequests } from '@/lib/hooks/use-cleaning'
import { formatDateLabel, formatTimeKorean } from '@/lib/utils'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: '결제 대기', color: 'bg-[#FFF8E1] text-[#F57F17]' },
  pending: { label: '매니저 배정 중', color: 'bg-[#FFF1F3] text-brand' },
  confirmed: { label: '매니저 배정 완료', color: 'bg-[#E8F5E9] text-[#2E7D32]' },
  in_progress: { label: '청소 진행 중', color: 'bg-[#E3F2FD] text-[#1565C0]' },
  completed: { label: '청소 완료', color: 'bg-[#F7F7F7] text-[#222222]' },
  cancelled: { label: '취소됨', color: 'bg-[#F7F7F7] text-[#B0B0B0]' },
}

export default function CleaningHistoryPage() {
  const router = useRouter()
  const { data: requests = [], isLoading } = useCleaningRequests()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-80px)]">
        <div className="w-6 h-6 rounded-full border-2 border-[#EBEBEB] border-t-[#717171] animate-spin" />
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
        className="inline-flex items-center justify-center w-10 h-10 -ml-4 mb-3 rounded-full hover:bg-[#F7F7F7] transition-colors text-[#222222]"
      >
        <ChevronLeftIcon size={32} />
      </button>
      <h1 className="text-[22px] font-semibold text-[#222222] mb-6">
        청소 내역
      </h1>

      {visible.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-[14px] text-[#717171] mb-4">청소 내역이 없어요</p>
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
                className="rounded-xl border border-[#EBEBEB] px-4 py-4 flex flex-col gap-2 active:scale-[0.99] transition-all"
              >
                {/* Property + Status */}
                <div className="flex items-center justify-between">
                  <span className={`text-[15px] font-semibold ${isCancelled ? 'text-[#B0B0B0]' : 'text-[#222222]'}`}>
                    {r.propertyName || '숙소'}
                  </span>
                  {statusInfo && (
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  )}
                </div>

                {/* Date & Time */}
                <div className={`flex items-center gap-4 text-[13px] ${isCancelled ? 'text-[#B0B0B0]' : 'text-[#717171]'}`}>
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
                <p className={`text-[13px] ${isCancelled ? 'text-[#B0B0B0] line-through' : 'text-[#717171]'}`}>
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
