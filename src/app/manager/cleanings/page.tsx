'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { api, ApiError } from '@/lib/api-client'
import { useInvalidateManager, useManagerOpenCleanings } from '@/lib/hooks/use-manager'
import { ManagerCleaningCard } from '@/components/manager-cleaning-card'
import { LoadingButton } from '@/components/ui/loading-button'

export default function ManagerCleaningsPage() {
  const { data: cleanings = [], isLoading } = useManagerOpenCleanings()
  const invalidateManager = useInvalidateManager()
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [claimTargetId, setClaimTargetId] = useState<string | null>(null)

  const claimTarget = cleanings.find((cleaning) => cleaning.id === claimTargetId) ?? null

  async function handleClaim(id: string) {
    setClaimingId(id)

    try {
      await api.post(`/manager/cleanings/${id}/claim`)
      setClaimTargetId(null)
      toast.success('청소를 맡았어요.')
      await Promise.all([
        invalidateManager.openCleanings(),
        invalidateManager.myCleanings(),
      ])
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('청소 요청을 가져오지 못했어요.')
      }
    } finally {
      setClaimingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast flex min-h-[calc(100dvh-80px)] flex-col px-6 pt-6 pb-10">
      <h1 className="text-[22px] font-semibold text-ink">
        청소 요청
      </h1>
      <p className="mt-1 text-[14px] text-ink-muted">
        호스트들이 요청한 청소를 확인해보세요.
      </p>

      {cleanings.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">
              지금은 가져올 요청이 없어요
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              새로운 청소 요청이 들어오면 이곳에 보여드릴게요.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {cleanings.map((cleaning) => (
            <ManagerCleaningCard
              key={cleaning.id}
              cleaning={cleaning}
              action={(
                <LoadingButton
                  type="button"
                  loading={claimingId === cleaning.id}
                  loadingText="배정 중..."
                  onClick={() => setClaimTargetId(cleaning.id)}
                >
                  배정받기
                </LoadingButton>
              )}
            />
          ))}
        </div>
      )}

      <Drawer open={!!claimTarget} onOpenChange={(open) => !open && setClaimTargetId(null)}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-ink">
                이 요청을 배정받을까요?
              </DrawerTitle>
            </DrawerHeader>
            <div className="space-y-4">
              <p className="text-[14px] leading-relaxed text-ink-muted">
                한 번 배정받은 요청은 취소할 수 없어요. 일정을 다시 확인한 뒤 배정받아주세요.
              </p>

              {claimTarget && (
                <div className="rounded-xl border border-outline-dim bg-surface-subtle px-4 py-4">
                  <p className="text-[15px] font-semibold text-ink">
                    {claimTarget.propertyName || '숙소'}
                  </p>
                  <p className="mt-1 text-[13px] text-ink-muted">
                    {claimTarget.scheduledDate} · {claimTarget.scheduledTime}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setClaimTargetId(null)}
                  className="h-12 rounded-xl border border-outline-dim px-4 py-3 text-[14px] font-medium text-ink"
                >
                  닫기
                </button>
                <LoadingButton
                  type="button"
                  variant="primary"
                  loading={claimingId === claimTargetId}
                  loadingText="배정 중..."
                  disabled={!claimTargetId}
                  onClick={() => claimTargetId && handleClaim(claimTargetId)}
                >
                  배정받기
                </LoadingButton>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
