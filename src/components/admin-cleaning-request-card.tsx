import { cn, formatDateLabel, formatTimeKorean } from '@/lib/utils'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: '결제 대기', color: 'bg-warning-soft text-warning' },
  pending: { label: '배정 대기', color: 'bg-brand/8 text-brand' },
  confirmed: { label: '배정 완료', color: 'bg-success-soft text-success' },
  in_progress: { label: '진행 중', color: 'bg-info-soft text-info' },
  completed: { label: '완료', color: 'bg-surface-soft text-ink' },
  cancelled: { label: '취소', color: 'bg-surface-soft text-ink-faint' },
}

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
  const statusInfo = STATUS_LABELS[request.status]

  return (
    <div className={cn('rounded-xl border border-outline-dim px-4 py-4', className)}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[15px] font-semibold text-ink">{request.propertyName || '숙소'}</span>
        {statusInfo && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        )}
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
