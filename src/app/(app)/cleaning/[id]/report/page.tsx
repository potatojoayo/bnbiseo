'use client'

import { useParams } from 'next/navigation'
import { MobileBackButton } from '@/components/mobile-back-button'
import { CleaningReportReadOnly } from '@/components/cleaning-report-read-only'
import { useCleaningReport } from '@/lib/hooks/use-cleaning'

export default function CleaningReportPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useCleaningReport(id)

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center px-6 text-center text-[14px] text-ink-muted">
        점검 리포트를 불러오지 못했어요.
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast flex flex-col px-6 pt-6 pb-10">
      <div className="-mb-1">
        <MobileBackButton href={`/cleaning/${id}`} mode="back" />
      </div>
      <CleaningReportReadOnly
        propertyName={data.propertyName}
        spaces={data.spaces}
        assets={data.assets}
        report={data.report}
      />
    </div>
  )
}
