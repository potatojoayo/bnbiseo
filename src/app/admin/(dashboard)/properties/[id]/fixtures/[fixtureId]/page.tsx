'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { MobileBackButton } from '@/components/mobile-back-button'
import { SiteHeader } from '@/components/site-header'
import { api, ApiError } from '@/lib/api-client'
import { useAdminPropertyRegistration, useInvalidateAdmin } from '@/lib/hooks/use-admin'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

type FixtureCategory =
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

type FixtureDetail = {
  id: string
  category: FixtureCategory
  name: string
  location: string
  brand: string | null
  modelNumber: string | null
  specNotes: string | null
  notes: string | null
  photos: Array<{
    id: string
    storagePath: string
    signedUrl: string | null
  }>
}

type RegistrationCache = {
  fixtures: FixtureDetail[]
}

const CATEGORY_LABELS: Record<FixtureCategory, string> = {
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

function splitFixtureLocation(location: string, spaceNames: string[]) {
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

export default function AdminFixtureDetailPage() {
  const router = useRouter()
  const { id, fixtureId } = useParams<{ id: string; fixtureId: string }>()
  const { data, isLoading, error } = useAdminPropertyRegistration(id)
  const invalidate = useInvalidateAdmin()
  const queryClient = useQueryClient()
  const fixture = data?.fixtures.find((item) => item.id === fixtureId)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null)

  const locationParts = useMemo(
    () => splitFixtureLocation(fixture?.location ?? '', data?.spaces.map((space) => space.name) ?? []),
    [fixture?.location, data?.spaces],
  )

  const linkedSpace = data?.spaces.find((space) => space.name === locationParts.spaceName)

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/admin/properties/${id}/registration/fixtures/${fixtureId}`),
    onSuccess: () => {
      queryClient.setQueryData(
        ['admin', 'property-registration', id],
        (previous: RegistrationCache | undefined) =>
          previous
            ? {
                ...previous,
                fixtures: previous.fixtures.filter((item) => item.id !== fixtureId),
              }
            : previous,
      )
      invalidate.propertyRegistration(id)
      invalidate.properties()
    },
  })

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

  async function handleDelete() {
    setDeleteMessage(null)

    try {
      await deleteMutation.mutateAsync()
      router.push(`/admin/properties/${id}`)
    } catch (error) {
      setDeleteMessage(error instanceof ApiError ? error.message : '시설물을 삭제하지 못했어요.')
      setDeleteOpen(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <SiteHeader title="시설물 상세" />
        <div className="flex min-h-[100dvh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
        </div>
      </>
    )
  }

  if (!fixture || !data) {
    return (
      <>
        <SiteHeader title="시설물 상세" />
        <div className="flex flex-1 items-center justify-center px-6 py-20 text-center text-[14px] text-ink-muted">
          {error instanceof ApiError ? error.message : '시설물 정보를 찾을 수 없어요.'}
        </div>
      </>
    )
  }

  return (
    <>
      <SiteHeader title={fixture.name} />
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 p-6 max-md:animate-fade-only max-md:p-5">
        <div className="-mb-1 md:hidden">
          <MobileBackButton href={`/admin/properties/${id}`} mode="back" />
          <h1 className="mt-2 text-[22px] font-semibold text-ink">{fixture.name}</h1>
        </div>

        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-[14px] text-ink-muted">
              {CATEGORY_LABELS[fixture.category]} · {locationParts.spaceName || fixture.location}
              {locationParts.detailLocation ? ` · ${locationParts.detailLocation}` : ''}
            </p>
            {(fixture.brand || fixture.modelNumber) && (
              <p className="text-[14px] text-ink-muted">
                {[fixture.brand, fixture.modelNumber].filter(Boolean).join(' · ')}
              </p>
            )}
            {fixture.specNotes && (
              <p className="text-[14px] leading-relaxed text-ink-muted">{fixture.specNotes}</p>
            )}
            {fixture.notes && (
              <p className="text-[14px] leading-relaxed text-ink-muted">{fixture.notes}</p>
            )}
          </div>

          {linkedSpace && (
            <Link
              href={`/admin/properties/${id}/spaces/${linkedSpace.id}`}
              className="inline-flex items-center text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
            >
              연결된 공간 보기
            </Link>
          )}
        </section>

        <section className="-mx-5 space-y-4">
          <Carousel
            setApi={setCarouselApi}
            opts={{ loop: fixture.photos.length > 1 }}
            className="w-full"
          >
            <CarouselContent className="-ml-0">
              {fixture.photos.length > 0 ? (
                fixture.photos.map((photo) => (
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

          {fixture.photos.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 px-5">
              {fixture.photos.map((photo, index) => (
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

        <Link
          href={`/admin/properties/${id}/fixtures/${fixture.id}/edit`}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-ink px-4 text-[15px] font-semibold text-white transition-all active:scale-[0.98] md:min-w-[120px]"
        >
          수정하기
        </Link>

        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="w-full text-center text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-destructive disabled:opacity-50"
          disabled={deleteMutation.isPending}
        >
          시설물 삭제
        </button>

        {deleteMessage && (
          <p className="text-center text-[13px] text-danger">{deleteMessage}</p>
        )}
      </div>

      <Drawer open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DrawerContent className="px-5 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle className="text-[18px] font-semibold text-ink">
              삭제하시겠습니까?
            </DrawerTitle>
          </DrawerHeader>
          <p className="mb-6 text-[14px] text-ink-muted">
            시설물 정보를 삭제하면 되돌릴 수 없어요.
          </p>
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleteMutation.isPending}
              className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-ink text-[15px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제하기'}
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className="w-full text-center text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
            >
              취소
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
