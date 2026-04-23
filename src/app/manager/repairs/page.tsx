'use client'

import Link from 'next/link'
import {
  useManagerOpenRepairs,
  type ManagerRepairListItem,
} from '@/lib/hooks/use-manager'
import { RepairStatusBadge } from '@/components/repair-status-badge'
import { formatDateLabel, formatTimeKorean } from '@/lib/utils'

export default function ManagerRepairsPage() {
  const { data: repairs = [], isLoading } = useManagerOpenRepairs()

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast flex min-h-[calc(100dvh-80px)] flex-col px-6 pt-6 pb-10">
      <h1 className="text-[22px] font-semibold text-ink">수리 요청</h1>
      <p className="mt-1 text-[14px] text-ink-muted">
        호스트들이 요청한 수리를 확인해보세요.
      </p>

      {repairs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">
              지금은 가져올 요청이 없어요
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              새로운 수리 요청이 들어오면 이곳에 보여드릴게요.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {repairs.map((repair) => (
            <RepairListCard key={repair.id} repair={repair} />
          ))}
        </div>
      )}
    </div>
  )
}

function RepairListCard({ repair }: { repair: ManagerRepairListItem }) {
  const displayDate = repair.scheduledDate ?? repair.preferredScheduledDate
  const displayTime = repair.scheduledTime ?? repair.preferredScheduledTime
  const hasConfirmed = !!repair.scheduledDate && !!repair.scheduledTime

  return (
    <Link
      href={`/manager/repairs/${repair.id}`}
      className="block rounded-2xl border border-outline-dim bg-white p-4 shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition-all active:scale-[0.99] md:hover:-translate-y-0.5 md:hover:border-outline-strong md:hover:shadow-[0_14px_32px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold text-ink">{repair.propertyName || '숙소'}</p>
          {repair.propertyAddress && (
            <p className="mt-0.5 text-[12px] text-ink-muted truncate">
              {repair.propertyAddress}
              {repair.propertyAddressDetail && ` ${repair.propertyAddressDetail}`}
            </p>
          )}
          <p className="mt-2 text-[13px] text-ink-muted">
            {hasConfirmed ? '확정' : '희망'} {formatDateLabel(displayDate)} · {formatTimeKorean(displayTime)}
          </p>
          {repair.hostName && (
            <p className="mt-0.5 text-[12px] text-ink-muted">호스트 {repair.hostName}</p>
          )}
        </div>
        <RepairStatusBadge status={repair.status} />
      </div>

      <p className="mt-3 line-clamp-2 text-[13px] text-ink-muted leading-relaxed">
        {repair.description}
      </p>
    </Link>
  )
}
