'use client'

import { useParams, useRouter } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CleaningManualEditor,
  type CleaningManualSavePayload,
} from '@/components/cleaning-manual-editor'
import { api, ApiError } from '@/lib/api-client'
import { uploadHostCleaningManualImage } from '@/lib/host-property-photo-upload'
import { usePropertyCleaningManual } from '@/lib/hooks/use-properties'

export default function HostCleaningManualEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = usePropertyCleaningManual(id)

  const saveMutation = useMutation({
    mutationFn: (payload: CleaningManualSavePayload) =>
      api.put(`/properties/${id}/cleaning-manual`, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['properties', 'cleaning-manual', id] }),
        queryClient.invalidateQueries({ queryKey: ['properties', 'detail', id] }),
      ])
      router.replace(`/my/properties/${id}/cleaning-manual`)
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-[14px] text-ink-muted">
          {error instanceof ApiError ? error.message : '매뉴얼을 불러오지 못했어요.'}
        </p>
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
    <div className="animate-fade-up-fast mx-auto flex min-h-[100dvh] w-full max-w-[720px] flex-col gap-6 bg-white px-6 pb-10 pt-6 max-md:gap-5 max-md:px-5">
      <button
        type="button"
        onClick={() => router.replace(`/my/properties/${id}/cleaning-manual`)}
        className="-ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
      >
        <ChevronLeftIcon size={32} />
      </button>

      <CleaningManualEditor
        propertyName={data.propertyName}
        initialSteps={data.steps.map((step) => ({
          id: step.id,
          title: step.title,
          description: step.description,
          photos: step.photos,
        }))}
        uploadImage={(file) => uploadHostCleaningManualImage(id, file)}
        onSave={(payload) => saveMutation.mutateAsync(payload).then(() => undefined)}
        isSaving={saveMutation.isPending}
        cancelHref={`/my/properties/${id}/cleaning-manual`}
      />
    </div>
  )
}
