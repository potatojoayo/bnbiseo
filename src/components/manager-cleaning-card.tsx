import { CalendarIcon, ClockIcon, MapPinIcon } from 'lucide-react'
import { cn, formatDateLabel, formatTimeKorean } from '@/lib/utils'
import type { ManagerCleaning } from '@/lib/hooks/use-manager'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmed: { label: '배정 완료', color: 'bg-success-soft text-success' },
  in_progress: { label: '청소 진행 중', color: 'bg-info-soft text-info' },
  completed: { label: '청소 완료', color: 'bg-surface-soft text-ink' },
  pending: { label: '배정 대기', color: 'bg-brand/8 text-brand' },
}

type ManagerCleaningCardProps = {
  cleaning: ManagerCleaning
  action?: React.ReactNode
  className?: string
  showStatus?: boolean
}

export function ManagerCleaningCard({
  cleaning,
  action,
  className,
  showStatus = false,
}: ManagerCleaningCardProps) {
  const statusInfo = showStatus ? STATUS_LABELS[cleaning.status] : null

  return (
    <div className={cn('rounded-xl border border-outline-dim px-4 py-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-ink">
            {cleaning.propertyName || '숙소'}
          </p>
          {cleaning.cleaningType === 'urgent' && (
            <p className="mt-1 text-[12px] font-medium text-brand">
              긴급 청소
            </p>
          )}
        </div>
        {statusInfo && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-muted">
        <span className="flex items-center gap-1">
          <CalendarIcon size={13} strokeWidth={1.5} />
          {formatDateLabel(cleaning.scheduledDate)}
        </span>
        <span className="flex items-center gap-1">
          <ClockIcon size={13} strokeWidth={1.5} />
          {formatTimeKorean(cleaning.scheduledTime)}
        </span>
        <span className="font-medium text-ink">
          {cleaning.finalPrice.toLocaleString()}원
        </span>
      </div>

      {cleaning.propertyAddress && (
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          <MapPinIcon className="mr-1 inline-block size-3.5 align-[-2px] text-ink-faint" strokeWidth={1.75} />
          {cleaning.propertyAddress}
          {cleaning.propertyAddressDetail ? ` ${cleaning.propertyAddressDetail}` : ''}
        </p>
      )}

      {cleaning.memo && (
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          {cleaning.memo}
        </p>
      )}

      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  )
}
