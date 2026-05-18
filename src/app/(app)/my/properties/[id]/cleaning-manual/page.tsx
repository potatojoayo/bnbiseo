'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeftIcon, PencilIcon } from 'lucide-react'
import { CleaningManualView } from '@/components/cleaning-manual-view'
import { ApiError } from '@/lib/api-client'
import { usePropertyCleaningManual } from '@/lib/hooks/use-properties'

export default function HostCleaningManualPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data, isLoading, error } = usePropertyCleaningManual(id)

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast flex min-h-[100dvh] flex-col bg-white px-6 pb-10 pt-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-3 -ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
      >
        <ChevronLeftIcon size={32} />
      </button>

      {!data || error ? (
        <p className="mt-12 text-center text-[14px] text-ink-muted">
          {error instanceof ApiError ? error.message : '매뉴얼을 불러오지 못했어요.'}
        </p>
      ) : (
        <>
          <div className="mb-6 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[22px] font-semibold text-ink">청소 매뉴얼</h1>
              <p className="mt-1 text-[14px] text-ink-muted">{data.propertyName}</p>
            </div>
            <Link
              href={`/my/properties/${id}/cleaning-manual/edit`}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-outline-strong px-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface-soft"
            >
              <PencilIcon size={13} />
              편집
            </Link>
          </div>
          <CleaningManualView
            steps={data.steps}
            emptyText="아직 등록된 매뉴얼이 없어요. 편집 버튼으로 추가해보세요."
          />
        </>
      )}
    </div>
  )
}
