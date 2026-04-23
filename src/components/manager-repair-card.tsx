import { CalendarIcon, ClockIcon, MapPinIcon } from 'lucide-react'
import { RepairStatusBadge } from '@/components/repair-status-badge'
import { cn, formatDateLabel, formatTimeKorean } from '@/lib/utils'
import type { ManagerRepairListItem } from '@/lib/hooks/use-manager'

type ManagerRepairCardProps = {
  repair: ManagerRepairListItem
  className?: string
  showStatus?: boolean
}

export function ManagerRepairCard({
  repair,
  className,
  showStatus = false,
}: ManagerRepairCardProps) {
  const displayDate = repair.scheduledDate ?? repair.preferredScheduledDate
  const displayTime = repair.scheduledTime ?? repair.preferredScheduledTime
  const hasConfirmed = !!repair.scheduledDate && !!repair.scheduledTime

  return (
    <div className={cn('rounded-xl border border-outline-dim px-4 py-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-ink">
            {repair.propertyName || '숙소'}
          </p>
        </div>
        {showStatus && <RepairStatusBadge status={repair.status} />}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-muted">
        <span className="flex items-center gap-1">
          <CalendarIcon size={13} strokeWidth={1.5} />
          {hasConfirmed ? '' : '희망 '}
          {formatDateLabel(displayDate)}
        </span>
        <span className="flex items-center gap-1">
          <ClockIcon size={13} strokeWidth={1.5} />
          {formatTimeKorean(displayTime)}
        </span>
      </div>

      {repair.propertyAddress && (
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          <MapPinIcon className="mr-1 inline-block size-3.5 align-[-2px] text-ink-faint" strokeWidth={1.75} />
          {repair.propertyAddress}
          {repair.propertyAddressDetail ? ` ${repair.propertyAddressDetail}` : ''}
        </p>
      )}

      <div className="mt-3 border-t border-outline-dim" />
      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">
        {repair.description}
      </p>

      {repair.quotedCost != null && (
        <>
          <div className="mt-3 border-t border-outline-dim" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[13px] text-ink-muted">견적 금액</p>
            <p className="text-[15px] font-semibold text-ink">
              {repair.quotedCost.toLocaleString()}원
            </p>
          </div>
        </>
      )}
    </div>
  )
}
