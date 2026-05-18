'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { PencilIcon } from 'lucide-react'
import { CleaningManualView } from '@/components/cleaning-manual-view'
import { MobileBackButton } from '@/components/mobile-back-button'
import { SiteHeader } from '@/components/site-header'
import { ApiError } from '@/lib/api-client'
import { useAdminCleaningManual } from '@/lib/hooks/use-admin'

export default function AdminCleaningManualViewPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error } = useAdminCleaningManual(id)

  if (isLoading) {
    return (
      <>
        <SiteHeader title="청소 매뉴얼" />
        <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
        </div>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <SiteHeader title="청소 매뉴얼" />
        <div className="flex flex-1 items-center justify-center px-6 py-20 text-center text-[14px] text-ink-muted">
          {error instanceof ApiError ? error.message : '매뉴얼을 불러오지 못했어요.'}
        </div>
      </>
    )
  }

  return (
    <>
      <SiteHeader title="청소 매뉴얼" />
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 p-6 max-md:gap-5 max-md:p-5">
        <div className="-mb-2 md:hidden">
          <MobileBackButton href={`/admin/properties/${id}`} mode="back" />
        </div>

        <section className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[22px] font-semibold text-ink">{data.propertyName}</p>
            <p className="mt-1 text-[14px] text-ink-muted">
              매니저가 청소할 때 참고할 단계별 매뉴얼입니다.
            </p>
          </div>
          <Link
            href={`/admin/properties/${id}/cleaning-manual/edit`}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-outline-strong px-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface-soft"
          >
            <PencilIcon size={13} />
            편집
          </Link>
        </section>

        <CleaningManualView steps={data.steps} emptyText="아직 등록된 매뉴얼이 없어요. 편집 버튼으로 추가해보세요." />
      </div>
    </>
  )
}
