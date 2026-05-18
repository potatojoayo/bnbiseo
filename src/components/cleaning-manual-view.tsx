'use client'

import { useMemo, useState } from 'react'
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton'
import { PhotoLightbox, type LightboxPhoto } from '@/components/photo-lightbox'

export type CleaningManualPhoto = {
  id: string
  storagePath: string
  thumbnailStoragePath: string
  sortOrder: number
  signedUrl: string | null
  thumbnailSignedUrl: string | null
}

export type CleaningManualStep = {
  id: string
  title: string
  description: string | null
  sortOrder: number
  photos: CleaningManualPhoto[]
}

type CleaningManualViewProps = {
  steps: CleaningManualStep[]
  emptyText?: string
}

export function CleaningManualView({ steps, emptyText = '등록된 매뉴얼이 없어요.' }: CleaningManualViewProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const { flatPhotos, indexByPhotoId } = useMemo(() => {
    const flatPhotos: LightboxPhoto[] = []
    const indexByPhotoId: Record<string, number> = {}
    for (const step of steps) {
      for (const photo of step.photos) {
        indexByPhotoId[photo.id] = flatPhotos.length
        flatPhotos.push({
          url: photo.signedUrl || photo.thumbnailSignedUrl,
          label: step.title,
        })
      }
    }
    return { flatPhotos, indexByPhotoId }
  }, [steps])

  if (steps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-strong px-4 py-8 text-center text-[14px] text-ink-muted">
        {emptyText}
      </div>
    )
  }

  return (
    <>
      <ol className="flex flex-col gap-5">
        {steps.map((step, index) => (
          <li key={step.id} className="rounded-2xl border border-outline-dim p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-white">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[15px] font-semibold leading-snug text-ink">{step.title}</p>
                {step.description && (
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-muted">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
            {step.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {step.photos.map((photo) => {
                  const thumbUrl = photo.signedUrl || photo.thumbnailSignedUrl
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setOpenIndex(indexByPhotoId[photo.id] ?? 0)}
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
                        <div className="flex h-full w-full items-center justify-center text-[12px] text-ink-faint">
                          사진 없음
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </li>
        ))}
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
