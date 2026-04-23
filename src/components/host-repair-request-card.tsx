import Link from 'next/link'
import { RepairStatusBadge } from '@/components/repair-status-badge'
import type { RepairStatus } from '@/lib/hooks/use-repair'
import { cn, formatDateLabel, formatTimeKorean } from '@/lib/utils'

type HostRepairRequestCardProps = {
  request: {
    id: string
    propertyName: string | null
    description: string
    preferredScheduledDate: string
    preferredScheduledTime: string
    scheduledDate: string | null
    scheduledTime: string | null
    status: RepairStatus
    quotedCost: number | null
  }
  href: string
  className?: string
}

export function HostRepairRequestCard({
  request,
  href,
  className,
}: HostRepairRequestCardProps) {
  const isCancelled = request.status === 'cancelled'

  const displayDate = request.scheduledDate ?? request.preferredScheduledDate
  const displayTime = request.scheduledTime ?? request.preferredScheduledTime
  const dateLabel = formatDateLabel(displayDate)
  const timeLabel = formatTimeKorean(displayTime)
  const hasConfirmedSchedule = !!request.scheduledDate && !!request.scheduledTime
  const metaText = hasConfirmedSchedule
    ? `${dateLabel} · ${timeLabel}`
    : `희망 ${dateLabel} · ${timeLabel}`

  return (
    <Link
      href={href}
      className={cn(
        'block rounded-2xl border border-outline-dim bg-white px-4 py-4 shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition-all active:scale-[0.99] md:hover:-translate-y-0.5 md:hover:border-outline-strong md:hover:shadow-[0_14px_32px_rgba(0,0,0,0.08)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className={cn('block text-[16px] font-semibold leading-snug', isCancelled ? 'text-ink-faint' : 'text-ink')}>
            {request.propertyName || '숙소'}
          </span>
          <p className={cn('mt-1 text-[13px]', isCancelled ? 'text-ink-faint' : 'text-ink-muted')}>
            {metaText}
          </p>
        </div>
        <RepairStatusBadge status={request.status} />
      </div>

      <div className="mt-3 h-px w-full bg-outline-dim" />

      <p
        className={cn(
          'mt-3 text-[13px] leading-relaxed line-clamp-2',
          isCancelled ? 'text-ink-faint' : 'text-ink-muted',
        )}
      >
        {request.description}
      </p>

      {request.quotedCost != null && (
        <p
          className={cn(
            'mt-2 text-[13px] font-medium',
            isCancelled ? 'text-ink-faint line-through' : 'text-ink',
          )}
        >
          견적 {request.quotedCost.toLocaleString()}원
        </p>
      )}
    </Link>
  )
}
