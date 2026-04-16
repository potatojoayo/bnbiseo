'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/api-client'
import { useInvalidateManager, useManagerOpenCleanings } from '@/lib/hooks/use-manager'
import { ManagerCleaningCard } from '@/components/manager-cleaning-card'
import { LoadingButton } from '@/components/ui/loading-button'

export default function ManagerCleaningsPage() {
  const { data: cleanings = [], isLoading } = useManagerOpenCleanings()
  const invalidateManager = useInvalidateManager()
  const [claimingId, setClaimingId] = useState<string | null>(null)

  async function handleClaim(id: string) {
    setClaimingId(id)

    try {
      await api.post(`/manager/cleanings/${id}/claim`)
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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#EBEBEB] border-t-[#717171]" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast flex min-h-[calc(100dvh-80px)] flex-col px-6 pt-6 pb-10">
      <h1 className="text-[22px] font-semibold text-[#222222]">
        청소 요청
      </h1>
      <p className="mt-1 text-[14px] text-[#717171]">
        아직 배정되지 않은 요청을 직접 선택해서 맡을 수 있어요.
      </p>

      {cleanings.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <h2 className="text-[18px] font-semibold text-[#222222]">
              지금은 가져올 요청이 없어요
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[#717171]">
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
                  onClick={() => handleClaim(cleaning.id)}
                >
                  내가 맡기
                </LoadingButton>
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
