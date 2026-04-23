'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { RepairCompletionReportReadOnly } from '@/components/repair-completion-report-read-only'
import { useRepairReport } from '@/lib/hooks/use-repair'

export default function RepairReportPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data, isLoading } = useRepairReport(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-80px)]">
        <div className="w-6 h-6 rounded-full border-2 border-outline-dim border-t-ink-muted animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-80px)] px-6 text-center">
        <h2 className="text-[18px] font-semibold text-ink mb-2">보고서를 찾을 수 없어요</h2>
        <Link href={`/repair/${id}`} className="mt-4 text-[14px] text-ink-muted underline underline-offset-2">
          상세로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col px-6 pt-6 pb-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center justify-center w-10 h-10 -ml-4 mb-3 rounded-full hover:bg-surface-soft transition-colors text-ink"
      >
        <ChevronLeftIcon size={32} />
      </button>

      <RepairCompletionReportReadOnly
        report={data.report}
      />
    </div>
  )
}
