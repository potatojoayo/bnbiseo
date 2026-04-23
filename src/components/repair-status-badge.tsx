import { cn } from '@/lib/utils'
import type { RepairStatus } from '@/lib/hooks/use-repair'

const REPAIR_STATUS_STYLES: Record<RepairStatus, string> = {
  submitted: 'bg-warning-soft text-warning',
  quoted: 'bg-brand/8 text-brand',
  confirmed: 'bg-success-soft text-success',
  in_progress: 'bg-info-soft text-info',
  completed: 'border border-outline-dim bg-surface-subtle text-ink-muted',
  cancelled: 'bg-surface-soft text-ink-faint',
}

const REPAIR_STATUS_LABELS: Record<RepairStatus, string> = {
  submitted: '매니저 확인 중',
  quoted: '견적 확인 및 결제',
  confirmed: '방문 예정',
  in_progress: '수리 진행 중',
  completed: '수리 완료',
  cancelled: '취소됨',
}

type RepairStatusBadgeProps = {
  status: RepairStatus
  label?: string
  className?: string
}

export function getRepairStatusLabel(status: RepairStatus) {
  return REPAIR_STATUS_LABELS[status]
}

export function RepairStatusBadge({
  status,
  label,
  className,
}: RepairStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-medium',
        REPAIR_STATUS_STYLES[status],
        className,
      )}
    >
      {label ?? REPAIR_STATUS_LABELS[status]}
    </span>
  )
}
