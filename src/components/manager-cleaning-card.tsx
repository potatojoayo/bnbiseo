import { CalendarIcon, ClockIcon, MapPinIcon } from 'lucide-react'
import { CleaningStatusBadge } from '@/components/cleaning-status-badge'
import { cn, formatDateLabel, formatTimeKorean } from '@/lib/utils'
import { calculateManagerPayout } from '@/lib/manager-payout'
import type { ManagerCleaning } from '@/lib/hooks/use-manager'

type ManagerCleaningCardProps = {
  cleaning: ManagerCleaning
  className?: string
  showStatus?: boolean
}

export function ManagerCleaningCard({
  cleaning,
  className,
  showStatus = false,
}: ManagerCleaningCardProps) {
  const spaceSummary = [
    cleaning.propertyPyeong != null && `${cleaning.propertyPyeong}평`,
    cleaning.propertyLivingRooms != null && `거실 ${cleaning.propertyLivingRooms}`,
    cleaning.propertyBedrooms != null && `침실 ${cleaning.propertyBedrooms}`,
    cleaning.propertyBathrooms != null && `욕실 ${cleaning.propertyBathrooms}`,
  ].filter(Boolean)

  return (
    <div className={cn('rounded-xl border border-outline-dim px-4 py-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-ink">
            {cleaning.propertyName || '숙소'}
          </p>
          <p className="mt-1 text-[12px] font-medium text-ink-muted">
            {cleaning.cleaningType === 'urgent' && (
              <span className="text-brand mr-1.5">긴급 청소</span>
            )}
            <span>{cleaning.cleaningPlan === 'regular' ? '정기' : '단건'}</span>
          </p>
        </div>
        {showStatus && (
          <CleaningStatusBadge
            status={cleaning.status}
            label={cleaning.status === 'pending' ? '배정 대기' : cleaning.status === 'confirmed' ? '배정 완료' : undefined}
          />
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
      </div>

      {spaceSummary.length > 0 && (
        <p className="mt-2 text-[13px] text-ink-muted">
          {spaceSummary.join(' · ')}
        </p>
      )}

      {cleaning.propertyAddress && (
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          <MapPinIcon className="mr-1 inline-block size-3.5 align-[-2px] text-ink-faint" strokeWidth={1.75} />
          {cleaning.propertyAddress}
          {cleaning.propertyAddressDetail ? ` ${cleaning.propertyAddressDetail}` : ''}
        </p>
      )}

      {cleaning.memo && (
        <>
          <div className="mt-3 border-t border-outline-dim" />
          <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
            {cleaning.memo}
          </p>
        </>
      )}

      <div className="mt-3 border-t border-dashed border-outline-strong" />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink-muted">정산 예정</p>
        <p className="text-[15px] font-semibold text-ink">
          {calculateManagerPayout(cleaning.finalPrice).toLocaleString()}원
        </p>
      </div>
    </div>
  )
}
