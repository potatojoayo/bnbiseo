import { CalendarIcon, ClockIcon, MapPinIcon } from 'lucide-react'
import { RepairStatusBadge } from '@/components/repair-status-badge'
import type { RepairStatus } from '@/lib/hooks/use-repair'
import { cn, formatDateLabel, formatTimeKorean } from '@/lib/utils'

type AdminRepairRequestCardProps = {
  request: {
    propertyName: string | null
    propertyAddress: string | null
    hostName: string | null
    hostEmail: string | null
    managerName: string | null
    status: string
    description: string
    preferredScheduledDate: string
    preferredScheduledTime: string
    scheduledDate: string | null
    scheduledTime: string | null
    quotedCost: number | null
  }
  className?: string
}

export function AdminRepairRequestCard({
  request,
  className,
}: AdminRepairRequestCardProps) {
  const displayDate = request.scheduledDate ?? request.preferredScheduledDate
  const displayTime = request.scheduledTime ?? request.preferredScheduledTime

  return (
    <div className={cn('rounded-xl border border-outline-dim px-4 py-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-ink">
            {request.propertyName || '숙소'}
          </p>
        </div>
        <RepairStatusBadge status={request.status as RepairStatus} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-muted">
        <span className="flex items-center gap-1">
          <CalendarIcon size={13} strokeWidth={1.5} />
          {formatDateLabel(displayDate)}
        </span>
        <span className="flex items-center gap-1">
          <ClockIcon size={13} strokeWidth={1.5} />
          {formatTimeKorean(displayTime)}
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

      <div className="mt-3 border-t border-outline-dim" />
      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">
        {request.description}
      </p>

      {request.quotedCost != null && (
        <>
          <div className="mt-3 border-t border-dashed border-outline-strong" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[13px] text-ink-muted">견적 금액</p>
            <p className="text-[15px] font-semibold text-ink">
              {request.quotedCost.toLocaleString()}원
            </p>
          </div>
        </>
      )}
    </div>
  )
}
