'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api-client'
import { usePropertyDetail } from '@/lib/hooks/use-properties'
import { CompoundInput, FloatingInput } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading-button'

export default function MyPropertyCleaningPrepEditPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string
  const { data: property, isLoading } = usePropertyDetail(id)

  const [cleaningClosetLocation, setCleaningClosetLocation] = useState('')
  const [extraLinenLocation, setExtraLinenLocation] = useState('')
  const [trashDisposalLocation, setTrashDisposalLocation] = useState('')

  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (property && !initialized) {
    setCleaningClosetLocation(property.cleaningClosetLocation ?? '')
    setExtraLinenLocation(property.extraLinenLocation ?? '')
    setTrashDisposalLocation(property.trashDisposalLocation ?? '')
    setInitialized(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      await api.patch(`/properties/${id}`, {
        cleaningClosetLocation: cleaningClosetLocation.trim() || null,
        extraLinenLocation: extraLinenLocation.trim() || null,
        trashDisposalLocation: trashDisposalLocation.trim() || null,
      })
      await queryClient.invalidateQueries({ queryKey: ['properties'] })
      await queryClient.invalidateQueries({ queryKey: ['properties', id] })
      router.back()
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : '수정 중 문제가 생겼어요. 다시 시도해주세요.')
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-[14px] text-ink-muted">숙소를 찾을 수 없어요</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[13px] text-ink-muted underline underline-offset-2"
        >
          돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast bg-white flex flex-col px-6 pt-6 pb-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-3 -ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
      >
        <ChevronLeftIcon size={32} />
      </button>
      <h1 className="text-[22px] font-semibold text-ink mb-6">청소 준비 정보 수정</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <CompoundInput>
          <FloatingInput
            label="청소 도구함 위치"
            value={cleaningClosetLocation}
            onChange={(e) => setCleaningClosetLocation(e.target.value)}
            placeholder="예: 현관 신발장 오른쪽 하단"
            borderRadius="12px 12px 0 0"
          />
          <FloatingInput
            label="침구류 여분 위치"
            value={extraLinenLocation}
            onChange={(e) => setExtraLinenLocation(e.target.value)}
            placeholder="예: 안방 붙박이장 맨 위칸"
          />
          <FloatingInput
            label="쓰레기 배출 장소"
            value={trashDisposalLocation}
            onChange={(e) => setTrashDisposalLocation(e.target.value)}
            placeholder="예: 건물 뒷편 분리수거장"
            borderRadius="0 0 12px 12px"
          />
        </CompoundInput>

        {message && (
          <div className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-[13px] text-danger">
            {message}
          </div>
        )}

        <LoadingButton
          type="submit"
          variant="primary"
          loading={saving}
          loadingText="저장 중..."
        >
          저장하기
        </LoadingButton>
      </form>
    </div>
  )
}
