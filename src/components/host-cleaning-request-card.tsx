import Link from 'next/link'
import { BrushCleaningIcon } from 'lucide-react'
import { CleaningStatusBadge, type CleaningStatus } from '@/components/cleaning-status-badge'
import { cn, formatDateLabel, formatTimeKorean } from '@/lib/utils'

type HostCleaningRequestCardProps = {
  request: {
    id: string
    propertyName: string | null
    scheduledDate: string
    scheduledTime: string
    status: string
    finalPrice: number
    cleaningType: 'standard' | 'urgent'
  }
  href: string
  className?: string
  showKindBadge?: boolean
}

export function HostCleaningRequestCard({
  request,
  href,
  className,
  showKindBadge = false,
}: HostCleaningRequestCardProps) {
  const isCancelled = request.status === 'cancelled'
  const metaText = [
    formatDateLabel(request.scheduledDate),
    formatTimeKorean(request.scheduledTime),
  ].join(' · ')

  return (
    <Link
      href={href}
      className={cn(
        'block rounded-2xl border border-outline-dim bg-white px-4 py-4 shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition-all active:scale-[0.99] md:hover:-translate-y-0.5 md:hover:border-outline-strong md:hover:shadow-[0_14px_32px_rgba(0,0,0,0.08)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {showKindBadge && (
            <span className="mb-2 inline-flex h-6 items-center gap-1 rounded-full border border-outline-strong bg-surface-subtle px-2.5 text-[11px] font-medium text-ink">
              <BrushCleaningIcon className="size-3" strokeWidth={2} />
              청소
            </span>
          )}
          <span className={cn('block text-[16px] font-semibold leading-snug', isCancelled ? 'text-ink-faint' : 'text-ink')}>
            {request.propertyName || '숙소'}
          </span>
          <p className={cn('mt-1 text-[13px]', isCancelled ? 'text-ink-faint' : 'text-ink-muted')}>
            {metaText}
          </p>
        </div>
        <CleaningStatusBadge status={request.status as CleaningStatus} />
      </div>

      <div className="mt-3 border-t border-dashed border-outline-strong" />

      <p className={cn('mt-3 text-[13px]', isCancelled ? 'text-ink-faint line-through' : 'text-ink-muted')}>
        {request.finalPrice.toLocaleString()}원
        {request.cleaningType === 'urgent' && !isCancelled && (
          <span className="ml-1 text-[11px] text-brand">긴급</span>
        )}
      </p>
    </Link>
  )
}
