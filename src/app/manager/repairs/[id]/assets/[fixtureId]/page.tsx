'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { MobileBackButton } from '@/components/mobile-back-button'
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { useManagerRepair, type ManagerRepairDetail } from '@/lib/hooks/use-manager'

const ASSET_CATEGORY_LABELS: Record<
  ManagerRepairDetail['assets'][number]['category'],
  string
> = {
  lighting: '조명',
  furniture: '가구',
  faucet: '수도/배관',
  boiler: '보일러',
  appliance: '가전',
  lock: '잠금장치',
  ac: '에어컨',
  washer: '세탁기',
  dryer: '건조기',
  vent: '환기',
  other: '기타',
}

export default function ManagerRepairAssetDetailPage() {
  const { id, fixtureId } = useParams<{ id: string; fixtureId: string }>()
  const { data, isLoading } = useManagerRepair(id)
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

  const asset = data?.assets.find((item) => item.id === fixtureId)

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  if (!asset || !data) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center px-6 text-center text-[14px] text-ink-muted">
        시설물 정보를 찾을 수 없어요.
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 p-6 animate-fade-up-fast max-md:p-5">
      <div className="-mb-1">
        <MobileBackButton href={`/manager/repairs/${id}`} mode="back" />
        <h1 className="mt-2 text-[22px] font-semibold text-ink">{asset.name}</h1>
      </div>

      <section className="space-y-2">
        <p className="text-[14px] text-ink-muted">
          {ASSET_CATEGORY_LABELS[asset.category]} · {asset.location}
        </p>
        {(asset.brand || asset.modelNumber) && (
          <p className="text-[14px] text-ink-muted">
            {[asset.brand, asset.modelNumber].filter(Boolean).join(' · ')}
          </p>
        )}
        {asset.purchaseUrl && (
          <a
            href={asset.purchaseUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-[14px] text-brand underline underline-offset-2"
          >
            구매처 링크
          </a>
        )}
        {asset.notes && (
          <p className="text-[14px] leading-relaxed text-ink-muted">{asset.notes}</p>
        )}
      </section>

      <section className="-mx-5 space-y-4 md:mx-0">
        <div className="hidden md:flex md:flex-col md:gap-3">
          {asset.photos.length > 0 ? (
            asset.photos.map((photo) => (
              <div key={photo.storagePath} className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-soft">
                {photo.signedUrl ? (
                  <ImageWithSkeleton src={photo.signedUrl} alt="" fill sizes="720px" className="object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[13px] text-ink-faint">사진 없음</div>
                )}
              </div>
            ))
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl bg-surface-soft text-[13px] text-ink-faint">
              사진 없음
            </div>
          )}
        </div>

        <Carousel setApi={setCarouselApi} opts={{ loop: asset.photos.length > 1 }} className="w-full md:hidden">
          <CarouselContent className="-ml-0">
            {asset.photos.length > 0 ? (
              asset.photos.map((photo) => (
                <CarouselItem key={photo.storagePath} className="pl-0">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-soft">
                    {photo.signedUrl ? (
                      <ImageWithSkeleton
                        src={photo.signedUrl}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 720px"
                        className="object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[13px] text-ink-faint">사진 없음</div>
                    )}
                  </div>
                </CarouselItem>
              ))
            ) : (
              <CarouselItem className="pl-0">
                <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-surface-soft text-[13px] text-ink-faint">
                  사진 없음
                </div>
              </CarouselItem>
            )}
          </CarouselContent>
        </Carousel>

        {asset.photos.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 px-5 md:hidden">
            {asset.photos.map((photo, index) => (
              <button
                key={photo.storagePath}
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
      </section>
    </div>
  )
}
