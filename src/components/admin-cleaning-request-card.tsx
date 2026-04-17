import { CleaningStatusBadge, type CleaningStatus } from '@/components/cleaning-status-badge'
import { cn, formatDateLabel, formatTimeKorean } from '@/lib/utils'

type AdminCleaningRequestCardProps = {
  request: {
    propertyName: string | null
    hostName: string | null
    hostEmail: string | null
    managerName: string | null
    cleaningType: string
    status: string
    scheduledDate: string
    scheduledTime: string
    finalPrice: number
  }
  action?: React.ReactNode
  className?: string
}

export function AdminCleaningRequestCard({
  request,
  action,
  className,
}: AdminCleaningRequestCardProps) {
  return (
    <div className={cn('rounded-xl border border-outline-dim px-4 py-4', className)}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[15px] font-semibold text-ink">{request.propertyName || '숙소'}</span>
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
      <div className="mb-3 flex flex-col gap-1 text-[13px] text-ink-muted">
        <p>
          {formatDateLabel(request.scheduledDate)} {formatTimeKorean(request.scheduledTime)}
          {request.cleaningType === 'urgent' && ' (긴급)'}
        </p>
        <p>호스트: {request.hostName || request.hostEmail || '-'}</p>
        <p>매니저: {request.managerName || '미배정'}</p>
        <p>금액: {request.finalPrice.toLocaleString()}원</p>
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  )
}
