'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
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
    name: string
    category: SpaceCategory
  }>
  assets: Array<{
    id: string
    category: AssetCategory
    name: string
    location: string
    brand: string | null
    modelNumber: string | null
    specNotes: string | null
    notes: string | null
    photos: Array<{
      id: string
      signedUrl: string | null
    }>
  }>
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

function splitAssetLocation(location: string, spaceNames: string[]) {
  const matchedSpace = [...spaceNames]
    .sort((a, b) => b.length - a.length)
    .find((spaceName) => location === spaceName || location.startsWith(`${spaceName} · `))

  if (!matchedSpace) {
    return { spaceName: '', detailLocation: location }
  }

  return {
    spaceName: matchedSpace,
    detailLocation: location === matchedSpace ? '' : location.slice(matchedSpace.length + 3),
  }
}

export default function MyPropertyAssetDetailPage() {
  const { id, fixtureId } = useParams<{ id: string; fixtureId: string }>()
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

  const asset = data?.assets.find((item) => item.id === fixtureId)
  const locationParts = useMemo(
    () => splitAssetLocation(asset?.location ?? '', data?.spaces.map((space) => space.name) ?? []),
    [asset?.location, data?.spaces],
  )
  const linkedSpace = data?.spaces.find((space) => space.name === locationParts.spaceName)

  if (loading) {
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
    <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 p-6 max-md:animate-fade-up-fast max-md:p-5">
      <div className="-mb-1">
        <MobileBackButton href={`/my/properties/${id}`} mode="back" />
        <h1 className="mt-2 text-[22px] font-semibold text-ink">{asset.name}</h1>
      </div>

      <section className="space-y-2">
        <p className="text-[14px] text-ink-muted">
          {ASSET_CATEGORY_LABELS[asset.category]} · {locationParts.spaceName || asset.location}
          {locationParts.detailLocation ? ` · ${locationParts.detailLocation}` : ''}
        </p>
        {(asset.brand || asset.modelNumber) && (
          <p className="text-[14px] text-ink-muted">
            {[asset.brand, asset.modelNumber].filter(Boolean).join(' · ')}
          </p>
        )}
        {asset.specNotes && (
          <p className="text-[14px] leading-relaxed text-ink-muted">{asset.specNotes}</p>
        )}
        {asset.notes && (
          <p className="text-[14px] leading-relaxed text-ink-muted">{asset.notes}</p>
        )}

        {linkedSpace && (
          <Link
            href={`/my/properties/${id}/spaces/${linkedSpace.id}`}
            className="inline-flex items-center pt-1 text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
          >
            연결된 공간 보기
          </Link>
        )}
      </section>

      <section className="-mx-5 space-y-4">
        <Carousel setApi={setCarouselApi} opts={{ loop: asset.photos.length > 1 }} className="w-full">
          <CarouselContent className="-ml-0">
            {asset.photos.length > 0 ? (
              asset.photos.map((photo) => (
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

        {asset.photos.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 px-5">
            {asset.photos.map((photo, index) => (
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
    </div>
  )
}
