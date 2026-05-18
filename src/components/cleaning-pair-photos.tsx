'use client'

import { useMemo, useState } from 'react'
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton'
import { PhotoLightbox, type LightboxPhoto } from '@/components/photo-lightbox'

type PairedPhoto = {
  id: string
  sortOrder: number
  signedUrl: string | null
  thumbnailSignedUrl: string | null
}

export type CleaningPairSpace = {
  spaceId: string
  spaceName: string
  categoryLabel: string
  before: PairedPhoto[]
  after: PairedPhoto[]
}

type CleaningPairPhotosProps = {
  spaces: CleaningPairSpace[]
}

export function CleaningPairPhotos({ spaces }: CleaningPairPhotosProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const { flatPhotos, indexLookup } = useMemo(() => {
    const flatPhotos: LightboxPhoto[] = []
    const indexLookup: Record<string, { before: number; after: number }> = {}

    for (const space of spaces) {
      const sortedBefore = [...space.before].sort((a, b) => a.sortOrder - b.sortOrder)
      const afterBySlot = new Map(space.after.map((photo) => [photo.sortOrder, photo]))

      sortedBefore.forEach((before, indexInSpace) => {
        const slot = before.sortOrder
        const afterPhoto = afterBySlot.get(slot)
        const slotLabel = `#${indexInSpace + 1}`

        const beforeIndex = flatPhotos.length
        flatPhotos.push({
          url: before.signedUrl || before.thumbnailSignedUrl,
          label: `${space.spaceName} · 청소 전 ${slotLabel}`,
        })

        const afterIndex = flatPhotos.length
        flatPhotos.push({
          url: afterPhoto ? afterPhoto.signedUrl || afterPhoto.thumbnailSignedUrl : null,
          label: `${space.spaceName} · 청소 후 ${slotLabel}`,
        })

        indexLookup[`${space.spaceId}|${slot}`] = {
          before: beforeIndex,
          after: afterIndex,
        }
      })
    }

    return { flatPhotos, indexLookup }
  }, [spaces])

  return (
    <>
      <div className="flex flex-col gap-4">
        {spaces.map((space) => {
          const sortedBefore = [...space.before].sort((a, b) => a.sortOrder - b.sortOrder)
          const afterBySlot = new Map(space.after.map((photo) => [photo.sortOrder, photo]))

          return (
            <div key={space.spaceId} className="rounded-xl border border-outline-dim p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-semibold text-ink">{space.spaceName}</p>
                <span className="text-[11px] font-medium text-ink-muted">{space.categoryLabel}</span>
              </div>

              {sortedBefore.length === 0 ? (
                <div className="rounded-lg border border-dashed border-outline-strong px-3 py-4 text-center text-[12px] text-ink-muted">
                  등록된 사진이 없어요.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {sortedBefore.map((beforePhoto, index) => {
                    const slot = beforePhoto.sortOrder
                    const afterPhoto = afterBySlot.get(slot)
                    const slotLabel = `#${index + 1}`
                    const beforeUrlThumb = beforePhoto.signedUrl || beforePhoto.thumbnailSignedUrl
                    const afterUrlThumb = afterPhoto ? afterPhoto.signedUrl || afterPhoto.thumbnailSignedUrl : null
                    const indices = indexLookup[`${space.spaceId}|${slot}`]

                    return (
                      <div key={beforePhoto.id} className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-ink-muted">청소 전 {slotLabel}</p>
                          <button
                            type="button"
                            onClick={() => setOpenIndex(indices.before)}
                            className="relative block aspect-square w-full overflow-hidden rounded-lg bg-surface-soft transition-transform hover:scale-[1.02]"
                          >
                            {beforeUrlThumb ? (
                              <ImageWithSkeleton src={beforeUrlThumb} alt="" fill sizes="50vw" className="object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[11px] text-ink-faint">
                                사진 없음
                              </div>
                            )}
                          </button>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-ink-muted">청소 후 {slotLabel}</p>
                          {afterPhoto ? (
                            <button
                              type="button"
                              onClick={() => setOpenIndex(indices.after)}
                              className="relative block aspect-square w-full overflow-hidden rounded-lg bg-surface-soft transition-transform hover:scale-[1.02]"
                            >
                              {afterUrlThumb ? (
                                <ImageWithSkeleton src={afterUrlThumb} alt="" fill sizes="50vw" className="object-cover" />
                              ) : null}
                            </button>
                          ) : (
                            <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-outline-strong text-[11px] text-ink-faint">
                              청소 후 미등록
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <PhotoLightbox
        open={openIndex !== null}
        photos={flatPhotos}
        startIndex={openIndex ?? 0}
        onClose={() => setOpenIndex(null)}
      />
    </>
  )
}
