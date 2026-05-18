'use client'

import { useMemo, useState } from 'react'
import { CheckIcon } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton'
import { PhotoLightbox, type LightboxPhoto } from '@/components/photo-lightbox'
import { api, ApiError } from '@/lib/api-client'
import type { ManagerCleaningManual } from '@/lib/hooks/use-manager'
import { toast } from 'sonner'

type ManagerCleaningManualChecklistProps = {
  cleaningId: string
  manual: ManagerCleaningManual
}

export function ManagerCleaningManualChecklist({ cleaningId, manual }: ManagerCleaningManualChecklistProps) {
  const queryClient = useQueryClient()
  const queryKey = ['manager', 'cleanings', 'cleaning-manual', cleaningId]
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const checkedSet = useMemo(() => new Set(manual.checkedStepIds), [manual.checkedStepIds])

  const { flatPhotos, indexByPhotoId } = useMemo(() => {
    const flatPhotos: LightboxPhoto[] = []
    const indexByPhotoId: Record<string, number> = {}
    for (const step of manual.steps) {
      for (const photo of step.photos) {
        indexByPhotoId[photo.id] = flatPhotos.length
        flatPhotos.push({
          url: photo.signedUrl || photo.thumbnailSignedUrl,
          label: step.title,
        })
      }
    }
    return { flatPhotos, indexByPhotoId }
  }, [manual.steps])

  const toggleMutation = useMutation({
    mutationFn: ({ stepId, checked }: { stepId: string; checked: boolean }) =>
      api.post(`/manager/cleanings/${cleaningId}/cleaning-manual/check`, { stepId, checked }),
    onMutate: async ({ stepId, checked }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<ManagerCleaningManual>(queryKey)
      if (previous) {
        const next = checked
          ? Array.from(new Set([...previous.checkedStepIds, stepId]))
          : previous.checkedStepIds.filter((id) => id !== stepId)
        queryClient.setQueryData<ManagerCleaningManual>(queryKey, { ...previous, checkedStepIds: next })
      }
      return { previous }
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous)
      toast.error(error instanceof ApiError ? error.message : '체크 상태를 저장하지 못했어요.')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey })
    },
  })

  if (manual.steps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-strong px-4 py-6 text-center text-[14px] text-ink-muted">
        등록된 매뉴얼이 없어요.
      </div>
    )
  }

  return (
    <>
      <ol className="flex flex-col gap-3">
        {manual.steps.map((step, index) => {
          const isChecked = checkedSet.has(step.id)
          return (
            <li
              key={step.id}
              className={`rounded-2xl border p-4 transition-colors ${
                isChecked ? 'border-success-soft bg-success-soft/30' : 'border-outline-dim bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleMutation.mutate({ stepId: step.id, checked: !isChecked })}
                className="flex w-full items-start gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[15px] font-semibold leading-snug ${
                      isChecked ? 'text-ink-muted line-through' : 'text-ink'
                    }`}
                  >
                    {index + 1}. {step.title}
                  </p>
                  {step.description && (
                    <p
                      className={`mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed ${
                        isChecked ? 'text-ink-faint' : 'text-ink-muted'
                      }`}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    isChecked
                      ? 'border-success bg-success text-white'
                      : 'border-outline-strong bg-white text-transparent'
                  }`}
                  aria-checked={isChecked}
                  role="checkbox"
                >
                  <CheckIcon size={14} strokeWidth={3} />
                </span>
              </button>

              {step.photos.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {step.photos.map((photo) => {
                    const thumbUrl = photo.signedUrl || photo.thumbnailSignedUrl
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenIndex(indexByPhotoId[photo.id] ?? 0)
                        }}
                        className="relative aspect-square overflow-hidden rounded-lg bg-surface-soft transition-transform hover:scale-[1.02]"
                      >
                        {thumbUrl ? (
                          <ImageWithSkeleton
                            src={thumbUrl}
                            alt=""
                            fill
                            sizes="(max-width: 768px) 33vw, 240px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[11px] text-ink-faint">
                            사진 없음
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <PhotoLightbox
        open={openIndex !== null}
        photos={flatPhotos}
        startIndex={openIndex ?? 0}
        onClose={() => setOpenIndex(null)}
      />
    </>
  )
}
