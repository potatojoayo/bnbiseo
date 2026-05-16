'use client'

import { useState } from 'react'
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton'
import { PhotoLightbox } from '@/components/photo-lightbox'

type CleaningPrepPhotoGridPhoto = {
  id: string
  signedUrl: string | null
  thumbnailSignedUrl: string | null
}

type CleaningPrepPhotoGridProps = {
  photos: CleaningPrepPhotoGridPhoto[]
  emptyText?: string
}

export function CleaningPrepPhotoGrid({ photos, emptyText }: CleaningPrepPhotoGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (photos.length === 0) {
    if (!emptyText) return null
    return (
      <div className="rounded-lg border border-dashed border-outline-strong px-3 py-4 text-center text-[12px] text-ink-muted">
        {emptyText}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => {
          const thumbUrl = photo.thumbnailSignedUrl || photo.signedUrl
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => setOpenIndex(index)}
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
      <PhotoLightbox
        open={openIndex !== null}
        photos={photos.map((photo) => ({ url: photo.signedUrl || photo.thumbnailSignedUrl }))}
        startIndex={openIndex ?? 0}
        onClose={() => setOpenIndex(null)}
      />
    </>
  )
}
