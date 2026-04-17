import Link from 'next/link'
import { cn, formatDateLabel, formatTimeKorean } from '@/lib/utils'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: '결제 대기', color: 'bg-warning-soft text-warning' },
  pending: { label: '매니저 배정 중', color: 'bg-brand/8 text-brand' },
  confirmed: { label: '매니저 배정 완료', color: 'bg-success-soft text-success' },
  in_progress: { label: '청소 진행 중', color: 'bg-info-soft text-info' },
  completed: { label: '청소 완료', color: 'bg-surface-soft text-ink' },
  cancelled: { label: '취소됨', color: 'bg-surface-soft text-ink-faint' },
}

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
}

export function HostCleaningRequestCard({
  request,
  href,
  className,
}: HostCleaningRequestCardProps) {
  const statusInfo = STATUS_LABELS[request.status]
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
          <span className={cn('block text-[16px] font-semibold leading-snug', isCancelled ? 'text-ink-faint' : 'text-ink')}>
            {request.propertyName || '숙소'}
          </span>
          <p className={cn('mt-1 text-[13px]', isCancelled ? 'text-ink-faint' : 'text-ink-muted')}>
            {metaText}
          </p>
        </div>
        {statusInfo && (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        )}
      </div>

      <div className="mt-3 h-px w-full bg-outline-dim" />

      <p className={cn('mt-3 text-[13px]', isCancelled ? 'text-ink-faint line-through' : 'text-ink-muted')}>
        {request.finalPrice.toLocaleString()}원
        {request.cleaningType === 'urgent' && !isCancelled && (
          <span className="ml-1 text-[11px] text-brand">긴급</span>
        )}
      </p>
    </Link>
  )
}
