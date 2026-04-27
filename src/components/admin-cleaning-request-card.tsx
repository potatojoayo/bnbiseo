import { CalendarIcon, ClockIcon, MapPinIcon } from 'lucide-react'
import { CleaningStatusBadge, type CleaningStatus } from '@/components/cleaning-status-badge'
import { cn, formatDateLabel, formatTimeKorean } from '@/lib/utils'

type AdminCleaningRequestCardProps = {
  request: {
    propertyName: string | null
    propertyAddress: string | null
    hostName: string | null
    hostEmail: string | null
    managerName: string | null
    cleaningType: string
    status: string
    scheduledDate: string
    scheduledTime: string
    memo: string | null
    finalPrice: number
  }
  className?: string
}

export function AdminCleaningRequestCard({
  request,
  className,
}: AdminCleaningRequestCardProps) {
  return (
    <div className={cn('rounded-xl border border-outline-dim px-4 py-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-ink">
            {request.propertyName || '숙소'}
          </p>
          {request.cleaningType === 'urgent' && (
            <p className="mt-1 text-[12px] font-medium text-brand">
              긴급 청소
            </p>
          )}
        </div>
        <CleaningStatusBadge
          status={request.status as CleaningStatus}
          label={
            request.status === 'pending'
              ? '배정 대기'
              : request.status === 'confirmed'
                ? '배정 완료'
                : request.status === 'in_progress'
                  ? '진행 중'
                  : request.status === 'completed'
                    ? '완료'
                    : request.status === 'cancelled'
                      ? '취소'
                      : undefined
          }
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-muted">
        <span className="flex items-center gap-1">
          <CalendarIcon size={13} strokeWidth={1.5} />
          {formatDateLabel(request.scheduledDate)}
        </span>
        <span className="flex items-center gap-1">
          <ClockIcon size={13} strokeWidth={1.5} />
          {formatTimeKorean(request.scheduledTime)}
        </span>
      </div>

      <p className="mt-2 text-[13px] text-ink-muted">
        호스트 {request.hostName || request.hostEmail || '-'} · 매니저 {request.managerName || '미배정'}
      </p>

      {request.propertyAddress && (
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          <MapPinIcon className="mr-1 inline-block size-3.5 align-[-2px] text-ink-faint" strokeWidth={1.75} />
          {request.propertyAddress}
        </p>
      )}

      {request.memo && (
        <>
          <div className="mt-3 border-t border-outline-dim" />
          <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
            {request.memo}
          </p>
        </>
      )}

      <div className="mt-3 border-t border-dashed border-outline-strong" />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink-muted">청소 금액</p>
        <p className="text-[15px] font-semibold text-ink">
          {request.finalPrice.toLocaleString()}원
        </p>
      </div>
    </div>
  )
}
