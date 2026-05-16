'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'

export type LightboxPhoto = {
  url: string | null
  label?: string
}

type PhotoLightboxProps = {
  open: boolean
  photos: LightboxPhoto[]
  startIndex: number
  onClose: () => void
}

export function PhotoLightbox({ open, photos, startIndex, onClose }: PhotoLightboxProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, startIndex })
  const [currentIndex, setCurrentIndex] = useState(startIndex)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  useEffect(() => {
    if (!emblaApi || !open) return
    emblaApi.scrollTo(startIndex, true)
    setCurrentIndex(startIndex)
  }, [emblaApi, startIndex, open])

  useEffect(() => {
    if (!emblaApi) return
    const handler = () => setCurrentIndex(emblaApi.selectedScrollSnap())
    emblaApi.on('select', handler)
    return () => {
      emblaApi.off('select', handler)
    }
  }, [emblaApi])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') scrollPrev()
      else if (e.key === 'ArrowRight') scrollNext()
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose, scrollPrev, scrollNext])

  if (!open) return null
  if (typeof document === 'undefined') return null

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < photos.length - 1

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute inset-0 bg-white/10 backdrop-blur-sm"
      />

      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-lg transition-colors hover:bg-surface-soft md:right-6 md:top-6"
      >
        <XIcon size={20} />
      </button>

      <button
        type="button"
        onClick={scrollPrev}
        disabled={!hasPrev}
        aria-label="이전 사진"
        className="absolute left-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-lg transition-colors hover:bg-surface-soft disabled:opacity-30 md:inline-flex"
      >
        <ChevronLeftIcon size={24} />
      </button>
      <button
        type="button"
        onClick={scrollNext}
        disabled={!hasNext}
        aria-label="다음 사진"
        className="absolute right-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-lg transition-colors hover:bg-surface-soft disabled:opacity-30 md:inline-flex"
      >
        <ChevronRightIcon size={24} />
      </button>

      <div className="relative z-0 w-full overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {photos.map((photo, index) => (
            <div
              key={index}
              onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
              }}
              className="relative flex min-w-0 shrink-0 grow-0 basis-full items-center justify-center"
            >
              {photo.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.url}
                  alt=""
                  onClick={(e) => e.stopPropagation()}
                  className="block max-h-[85dvh] w-full object-contain md:mx-auto md:max-h-[85dvh] md:w-auto md:max-w-[calc(100vw-200px)] md:rounded-2xl md:shadow-2xl"
                />
              ) : (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-[40dvh] w-full items-center justify-center text-[14px] text-ink-muted"
                >
                  사진을 불러올 수 없어요.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {photos[currentIndex]?.label && (
        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-ink shadow-lg md:top-6">
          {photos[currentIndex].label}
        </div>
      )}

      {photos.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[12px] font-medium text-ink shadow-lg">
          {currentIndex + 1} / {photos.length}
        </div>
      )}
    </div>,
    document.body,
  )
}
