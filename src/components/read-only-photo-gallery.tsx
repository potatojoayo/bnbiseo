'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton'

type GalleryPhoto = {
  id: string
  signedUrl: string | null
}

type ReadOnlyPhotoGalleryProps = {
  title: string
  photos: GalleryPhoto[]
  emptyMessage?: string
  className?: string
  titleClassName?: string
  contentClassName?: string
  emptyMessageClassName?: string
}

export function ReadOnlyPhotoGallery({
  title,
  photos,
  emptyMessage = '등록된 사진이 없어요.',
  className,
  titleClassName,
  contentClassName,
  emptyMessageClassName,
}: ReadOnlyPhotoGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()

  useEffect(() => {
    if (!carouselApi) return

    const onSelect = () => {
      setSelectedPhotoIndex(carouselApi.selectedScrollSnap())
    }

    onSelect()
    carouselApi.on('select', onSelect)

    return () => {
      carouselApi.off('select', onSelect)
    }
  }, [carouselApi])

  return (
    <section className={className}>
      <p className={cn('text-[16px] font-semibold text-ink', titleClassName)}>{title}</p>

      {photos.length === 0 ? (
        <div className={cn('pt-4 text-center text-[14px] text-ink-muted', contentClassName, emptyMessageClassName)}>
          {emptyMessage}
        </div>
      ) : (
        <div className={cn('pt-4', contentClassName)}>
          <div className="hidden md:flex md:flex-col md:gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-soft">
                {photo.signedUrl ? (
                  <ImageWithSkeleton src={photo.signedUrl} alt="" fill sizes="720px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[13px] text-ink-faint">사진 없음</div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4 md:hidden">
            <Carousel setApi={setCarouselApi} opts={{ loop: photos.length > 1 }} className="w-full">
              <CarouselContent className="-ml-0">
                {photos.map((photo) => (
                  <CarouselItem key={photo.id} className="pl-0">
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-soft">
                      {photo.signedUrl ? (
                        <ImageWithSkeleton
                          src={photo.signedUrl}
                          alt=""
                          fill
                          sizes="100vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[13px] text-ink-faint">사진 없음</div>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {photos.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 px-5">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => {
                      carouselApi?.scrollTo(index)
                      setSelectedPhotoIndex(index)
                    }}
                    aria-label={`${index + 1}번 사진 보기`}
                    className={`h-1.5 rounded-full transition-all ${
                      selectedPhotoIndex === index ? 'w-5 bg-ink' : 'w-1.5 bg-outline-strong'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
