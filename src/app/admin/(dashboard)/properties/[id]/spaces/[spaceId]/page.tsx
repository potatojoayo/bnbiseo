'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { MobileBackButton } from '@/components/mobile-back-button'
import { SiteHeader } from '@/components/site-header'
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton'
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

type SpaceCategory = 'living_room' | 'bedroom' | 'bathroom'
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

const SPACE_CATEGORY_LABELS: Record<SpaceCategory, string> = {
  living_room: '거실',
  bedroom: '침실',
  bathroom: '화장실',
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

type SpaceDetail = {
  id: string
  category: SpaceCategory
  floor: number
  name: string
  pyeong: number
  notes: string | null
  photos: Array<{
    id: string
    storagePath: string
    thumbnailStoragePath: string
    signedUrl: string | null
    thumbnailSignedUrl: string | null
  }>
}

type RegistrationCache = {
  spaces: SpaceDetail[]
}

function isFixtureLinkedToSpace(location: string, spaceName: string) {
  return location === spaceName || location.startsWith(`${spaceName} · `)
}

export default function AdminSpaceDetailPage() {
  const router = useRouter()
  const { id, spaceId } = useParams<{ id: string; spaceId: string }>()
  const { data, isLoading, error } = useAdminPropertyRegistration(id)
  const invalidate = useInvalidateAdmin()
  const queryClient = useQueryClient()
  const space = data?.spaces.find((item) => item.id === spaceId)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null)

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/admin/properties/${id}/registration/spaces/${spaceId}`),
    onSuccess: () => {
      queryClient.setQueryData(
        ['admin', 'property-registration', id],
        (previous: RegistrationCache | undefined) =>
          previous
            ? {
                ...previous,
                spaces: previous.spaces.filter((item) => item.id !== spaceId),
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

  if (isLoading) {
    return (
      <>
        <SiteHeader title="공간 상세" />
        <div className="flex min-h-[100dvh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
        </div>
      </>
    )
  }

  if (!space || !data) {
    return (
      <>
        <SiteHeader title="공간 상세" />
        <div className="flex flex-1 items-center justify-center px-6 py-20 text-center text-[14px] text-ink-muted">
          {error instanceof ApiError ? error.message : '공간 정보를 찾을 수 없어요.'}
        </div>
      </>
    )
  }

  const linkedFixtures = data.fixtures.filter((fixture) => isFixtureLinkedToSpace(fixture.location, space.name))

  async function handleDelete() {
    setDeleteMessage(null)

    try {
      await deleteMutation.mutateAsync()
      router.replace(`/admin/properties/${id}`)
    } catch (error) {
      setDeleteMessage(error instanceof ApiError ? error.message : '공간 정보를 삭제하지 못했어요.')
      setDeleteOpen(false)
    }
  }

  return (
    <>
      <SiteHeader title={space.name} />
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 p-6 animate-fade-up-fast max-md:p-5">
        <div className="-mb-1 md:hidden">
          <MobileBackButton href={`/admin/properties/${id}`} mode="back" />
          <h1 className="mt-2 text-[22px] font-semibold text-ink">{space.name}</h1>
        </div>

        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-[14px] text-ink-muted">
              {space.floor}층 · {SPACE_CATEGORY_LABELS[space.category]} · {space.pyeong}평
            </p>
            {space.notes && (
              <p className="text-[14px] leading-relaxed text-ink-muted">{space.notes}</p>
            )}
          </div>
        </section>

        <section className="-mx-5 space-y-4 md:mx-0 max-md:-mx-5">
          <div className="hidden md:flex md:flex-col md:gap-3">
            {space.photos.length > 0 ? (
              space.photos.map((photo) => (
                <div key={photo.id} className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-soft">
                  {photo.signedUrl ? (
                    <ImageWithSkeleton
                      src={photo.signedUrl}
                      alt=""
                      fill
                      sizes="720px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[13px] text-ink-faint">
                      사진 없음
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl bg-surface-soft text-[13px] text-ink-faint">
                사진 없음
              </div>
            )}
          </div>

          <Carousel
            setApi={setCarouselApi}
            opts={{ loop: space.photos.length > 1 }}
            className="w-full md:hidden"
          >
            <CarouselContent className="-ml-0">
              {space.photos.length > 0 ? (
                space.photos.map((photo) => (
                  <CarouselItem key={photo.id} className="pl-0">
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-soft">
                      {photo.signedUrl ? (
                        <ImageWithSkeleton
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
                  <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl bg-surface-soft text-[13px] text-ink-faint">
                    사진 없음
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>
          </Carousel>

          {space.photos.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 px-5 md:hidden">
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
                    selectedPhotoIndex === index
                      ? 'w-5 bg-ink'
                      : 'w-1.5 bg-outline-strong'
                  }`}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-[16px] font-semibold text-ink">등록된 시설물</p>
            <p className="mt-1 text-[13px] text-ink-muted">이 공간에 등록된 시설물을 함께 확인할 수 있어요.</p>
          </div>

          {linkedFixtures.length === 0 ? (
            <div className="rounded-xl border border-dashed border-outline-strong px-4 py-6 text-center text-[14px] text-ink-muted">
              등록된 시설물이 없어요.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {linkedFixtures.map((fixture) => (
                <Link
                  key={fixture.id}
                  href={`/admin/properties/${id}/assets/${fixture.id}`}
                  className="overflow-hidden rounded-xl border border-outline-dim transition-all active:scale-[0.99] md:hover:-translate-y-0.5 md:hover:border-outline-strong md:hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-stretch">
                    <div className="relative w-[104px] shrink-0 overflow-hidden bg-surface-soft">
                      {fixture.photos[0]?.signedUrl ? (
                          <ImageWithSkeleton
                            src={fixture.photos[0].signedUrl}
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
                        <p className="text-[15px] font-semibold text-ink">{fixture.name}</p>
                        <p className="mt-1 text-[13px] text-ink-muted">
                          {CATEGORY_LABELS[fixture.category]} · {fixture.location}
                        </p>
                        {(fixture.brand || fixture.modelNumber) && (
                          <p className="mt-1 text-[13px] text-ink-muted">
                            {[fixture.brand, fixture.modelNumber].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        {fixture.notes && (
                          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">{fixture.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <Link
          href={`/admin/properties/${id}/spaces/${space.id}/edit`}
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
          공간 삭제
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
            공간 정보를 삭제하면 되돌릴 수 없어요.
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
