import { cn } from '@/lib/utils'

export type CleaningStatus =
  | 'pending_payment'
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

const CLEANING_STATUS_STYLES: Record<CleaningStatus, string> = {
  pending_payment: 'bg-warning-soft text-warning',
  pending: 'bg-brand/8 text-brand',
  confirmed: 'bg-success-soft text-success',
  in_progress: 'bg-info-soft text-info',
  completed: 'border border-outline-dim bg-surface-subtle text-ink-muted',
  cancelled: 'bg-surface-soft text-ink-faint',
}

const CLEANING_STATUS_LABELS: Record<CleaningStatus, string> = {
  pending_payment: '결제 대기',
  pending: '매니저 배정 중',
  confirmed: '매니저 배정 완료',
  in_progress: '청소 진행 중',
  completed: '청소 완료',
  cancelled: '취소됨',
}

type CleaningStatusBadgeProps = {
  status: CleaningStatus
  label?: string
  className?: string
}

export function getCleaningStatusLabel(status: CleaningStatus) {
  return CLEANING_STATUS_LABELS[status]
}

export function CleaningStatusBadge({
  status,
  label,
  className,
}: CleaningStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-medium',
        CLEANING_STATUS_STYLES[status],
        className,
      )}
    >
      {label ?? CLEANING_STATUS_LABELS[status]}
    </span>
  )
}
