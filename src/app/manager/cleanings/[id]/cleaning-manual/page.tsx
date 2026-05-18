'use client'

import { useParams } from 'next/navigation'
import { CleaningManualView } from '@/components/cleaning-manual-view'
import { MobileBackButton } from '@/components/mobile-back-button'
import { ApiError } from '@/lib/api-client'
import { useManagerCleaningManual } from '@/lib/hooks/use-manager'

export default function ManagerCleaningManualPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error } = useManagerCleaningManual(id)

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-5 p-5">
      <MobileBackButton href={`/manager/cleanings/${id}`} mode="back" />

      {!data || error ? (
        <p className="mt-12 text-center text-[14px] text-ink-muted">
          {error instanceof ApiError ? error.message : '매뉴얼을 불러오지 못했어요.'}
        </p>
      ) : (
        <>
          <section>
            <h1 className="text-[22px] font-semibold text-ink">청소 매뉴얼</h1>
            <p className="mt-1 text-[14px] text-ink-muted">{data.propertyName}</p>
          </section>
          <CleaningManualView steps={data.steps} />
        </>
      )}
    </div>
  )
}
