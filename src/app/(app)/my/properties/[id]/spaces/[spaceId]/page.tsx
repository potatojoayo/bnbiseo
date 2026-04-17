'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { MobileBackButton } from '@/components/mobile-back-button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { api } from '@/lib/api-client'

type SpaceCategory = 'living_room' | 'bedroom' | 'bathroom'
type AssetCategory =
  | 'lighting'
  | 'furniture'
  | 'faucet'
  | 'boiler'
  | 'appliance'
  | 'lock'
  | 'ac'
  | 'washer'
  | 'dryer'
  | 'vent'
  | 'other'

type PropertyDetail = {
  spaces: Array<{
    id: string
    category: SpaceCategory
    floor: number
    name: string
    pyeong: number
    notes: string | null
    photos: Array<{
      id: string
      signedUrl: string | null
    }>
  }>
  assets: Array<{
    id: string
    category: AssetCategory
    name: string
    location: string
    brand: string | null
    modelNumber: string | null
    notes: string | null
    photos: Array<{
      id: string
      signedUrl: string | null
    }>
  }>
}

const SPACE_CATEGORY_LABELS: Record<SpaceCategory, string> = {
  living_room: '거실',
  bedroom: '침실',
  bathroom: '화장실',
}

const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
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

function isAssetLinkedToSpace(location: string, spaceName: string) {
  return location === spaceName || location.startsWith(`${spaceName} · `)
}

export default function MyPropertySpaceDetailPage() {
  const { id, spaceId } = useParams<{ id: string; spaceId: string }>()
  const [data, setData] = useState<PropertyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()

  useEffect(() => {
    api.get<PropertyDetail>(`/properties/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [id])

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

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  const space = data?.spaces.find((item) => item.id === spaceId)
  if (!space || !data) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center px-6 text-center text-[14px] text-ink-muted">
        공간 정보를 찾을 수 없어요.
      </div>
    )
  }

  const linkedAssets = data.assets.filter((asset) => isAssetLinkedToSpace(asset.location, space.name))

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 p-6 max-md:animate-fade-up-fast max-md:p-5">
      <div className="-mb-1">
        <MobileBackButton href={`/my/properties/${id}`} mode="back" />
        <h1 className="mt-2 text-[22px] font-semibold text-ink">{space.name}</h1>
      </div>

      <section className="space-y-2">
        <p className="text-[14px] text-ink-muted">
          {space.floor}층 · {SPACE_CATEGORY_LABELS[space.category]} · {space.pyeong}평
        </p>
        {space.notes && (
          <p className="text-[14px] leading-relaxed text-ink-muted">{space.notes}</p>
        )}
      </section>

      <section className="-mx-5 space-y-4">
        <Carousel setApi={setCarouselApi} opts={{ loop: space.photos.length > 1 }} className="w-full">
          <CarouselContent className="-ml-0">
            {space.photos.length > 0 ? (
              space.photos.map((photo) => (
                <CarouselItem key={photo.id} className="pl-0">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-soft">
                    {photo.signedUrl ? (
                      <Image
                        src={photo.signedUrl}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 720px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[13px] text-ink-faint">
                        사진 없음
                      </div>
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

        {space.photos.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 px-5">
            {space.photos.map((photo, index) => (
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
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[16px] font-semibold text-ink">연결된 시설물</p>
          <p className="mt-1 text-[13px] text-ink-muted">이 공간에 등록된 시설물을 함께 확인할 수 있어요.</p>
        </div>

        {linkedAssets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-strong px-4 py-6 text-center text-[14px] text-ink-muted">
            연결된 시설물이 없어요.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {linkedAssets.map((asset) => (
              <Link
                key={asset.id}
                href={`/my/properties/${id}/assets/${asset.id}`}
                className="overflow-hidden rounded-xl border border-outline-dim transition-transform active:scale-[0.99]"
              >
                <div className="flex items-stretch">
                  <div className="relative w-[104px] shrink-0 overflow-hidden bg-surface-soft">
                    {asset.photos[0]?.signedUrl ? (
                      <Image
                        src={asset.photos[0].signedUrl}
                        alt=""
                        fill
                        sizes="104px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[12px] text-ink-faint">
                        사진 없음
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 items-start px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-ink">{asset.name}</p>
                      <p className="mt-1 text-[13px] text-ink-muted">
                        {ASSET_CATEGORY_LABELS[asset.category]} · {asset.location}
                      </p>
                      {(asset.brand || asset.modelNumber) && (
                        <p className="mt-1 text-[13px] text-ink-muted">
                          {[asset.brand, asset.modelNumber].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {asset.notes && (
                        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">{asset.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
