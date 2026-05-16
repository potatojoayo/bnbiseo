'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2Icon, MapPinIcon } from 'lucide-react'
import { api } from '@/lib/api-client'
import { ProcessDrawer } from '@/components/process-drawer'
import { useAirbnbListing } from '@/lib/hooks/use-airbnb-listing'
import {
  useInvalidateProperties,
  usePropertyDetail,
  type SpaceCategory,
  type AssetCategory,
  type CleaningPrepPhoto,
} from '@/lib/hooks/use-properties'
import { PROPERTY_REGISTRATION_STEPS } from '@/lib/process-steps'
import { LoadingButton } from '@/components/ui/loading-button'
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton'
import { CompoundField, CompoundInput } from '@/components/ui/floating-input'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { MobileBackButton } from '@/components/mobile-back-button'
import { AssetCard } from '@/components/asset-card'

type PropertyDetailViewProps = {
  propertyId: string
  backHref: string
  editHref: string
  detailBaseHref: string
}

const SPACE_CATEGORY_LABELS: Record<SpaceCategory, string> = {
  living_room: '거실',
  bedroom: '침실',
  bathroom: '화장실',
  veranda: '베란다',
  exterior: '외부',
  other: '기타',
}

const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  lighting: '조명',
  furniture: '가구',
  bedding: '침구/침대',
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

function CleaningPrepPhotoGrid({ photos }: { photos: CleaningPrepPhoto[] }) {
  if (photos.length === 0) return null
  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((photo) => {
        const url = photo.thumbnailSignedUrl || photo.signedUrl
        return (
          <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg bg-surface-soft">
            {url ? (
              <ImageWithSkeleton src={url} alt="" fill sizes="(max-width: 768px) 33vw, 240px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[12px] text-ink-faint">사진 없음</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CleaningPrepReadGroup({
  title,
  text,
  photos,
}: {
  title: string
  text: string | null
  photos: CleaningPrepPhoto[]
}) {
  return (
    <div className="space-y-2">
      <p className="text-[13px] font-semibold text-ink">{title}</p>
      <CompoundInput>
        <CompoundField label="설명" borderRadius="12px">
          <span className="block w-full text-[16px] text-ink">{text || '-'}</span>
        </CompoundField>
      </CompoundInput>
      <CleaningPrepPhotoGrid photos={photos} />
    </div>
  )
}

export function PropertyDetailView({
  propertyId,
  backHref,
  editHref,
  detailBaseHref,
}: PropertyDetailViewProps) {
  const router = useRouter()
  const invalidateProperties = useInvalidateProperties()
  const { data: property, isLoading } = usePropertyDetail(propertyId)
  const [message, setMessage] = useState<string | undefined>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [registrationDrawerOpen, setRegistrationDrawerOpen] = useState(false)

  const {
    data: airbnbPreview,
    isLoading: airbnbFetching,
  } = useAirbnbListing(property?.airbnbListingId)

  async function handleDelete() {
    setDeleting(true)
    setMessage(undefined)

    try {
      await api.delete(`/properties/${propertyId}`)
      await invalidateProperties()

      if (backHref === '/my/properties') {
        router.push('/my/properties', { scroll: false })
        return
      }

      const remaining = await api.get<{ id: string }[]>('/properties').catch(() => [])
      router.push(remaining.length > 0 ? '/onboarding/complete' : '/onboarding', { scroll: false })
    } catch {
      setMessage('삭제 중 문제가 생겼어요. 다시 시도해주세요')
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-80px)]">
        <div className="w-6 h-6 rounded-full border-2 border-outline-dim border-t-ink-muted animate-spin" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-80px)] px-6 text-center">
        <p className="text-[14px] text-ink-muted mb-4">숙소를 찾을 수 없어요</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[13px] text-ink-muted underline underline-offset-2"
        >
          돌아가기
        </button>
      </div>
    )
  }

  const details = [
    property.pyeong != null && `${property.pyeong}평`,
    property.livingRooms != null && `거실 ${property.livingRooms}`,
    property.bedrooms != null && `침실 ${property.bedrooms}`,
    property.bathrooms != null && `욕실 ${property.bathrooms}`,
  ].filter(Boolean)

  return (
    <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col px-6 pt-6 pb-10">
      <div className="-mb-1">
        <MobileBackButton href={backHref} mode="back" />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <h1 className="min-w-0 text-[22px] font-semibold text-ink">{property.name}</h1>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            property.status === 'pending_activation'
              ? 'border border-outline-dim bg-surface-subtle text-ink-muted'
              : 'bg-success-soft text-success'
          }`}
        >
          {property.status === 'pending_activation' ? '등록 대기' : '등록 완료'}
        </span>
      </div>

      {property.status === 'pending_activation' ? (
        <>
          <div className="rounded-xl border border-outline-dim px-4 py-4 flex flex-col gap-3 mb-4 mt-2">
            <p className="text-[13px] leading-relaxed text-ink-muted">
              <MapPinIcon size={14} className="inline-block align-[-2px] mr-1 text-ink-faint" strokeWidth={1.75} />
              {property.address}
              {property.addressDetail ? ` ${property.addressDetail}` : ''}
            </p>
            {details.length > 0 && (
              <p className="text-[13px] text-ink-muted">
                {details.join(' · ')}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-outline-dim px-4 py-4 mb-4">
            <p className="text-[15px] font-semibold text-ink">
              숙소 등록을 진행하고 있어요
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
              48시간 이내 직접 방문해 숙소 등록을 완료해드려요.
            </p>
            <button
              type="button"
              onClick={() => setRegistrationDrawerOpen(true)}
              className="mt-3 text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
            >
              숙소 등록은 어떻게 진행되나요?
            </button>
          </div>

          {property.airbnbListingId && airbnbFetching && (
            <div className="mb-4 flex items-center gap-2 text-[13px] text-ink-muted">
              <Loader2Icon className="size-3.5 animate-spin" />
              숙소 정보를 가져오는 중...
            </div>
          )}

          {property.airbnbListingId && airbnbPreview && !airbnbFetching && (
            <a
              href={property.airbnbListingId}
              target="_blank"
              rel="noreferrer"
              className="mb-6 block overflow-hidden rounded-xl border border-outline-dim animate-fade-up-fast"
            >
              {airbnbPreview.imageUrl && (
                <div className="relative h-40 w-full">
                  <ImageWithSkeleton
                    src={airbnbPreview.imageUrl}
                    alt={airbnbPreview.name}
                    fill
                    className="object-cover"
                    sizes="560px"
                    unoptimized
                  />
                </div>
              )}
              <div className="px-4 py-3">
                <p className="text-[15px] font-semibold leading-snug text-ink">
                  {airbnbPreview.name}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-ink-muted">
                  {airbnbPreview.location && <span>{airbnbPreview.location}</span>}
                  {airbnbPreview.rating && <span>★ {airbnbPreview.rating}</span>}
                  {airbnbPreview.bedrooms != null && <span>침실 {airbnbPreview.bedrooms}</span>}
                  {airbnbPreview.beds != null && <span>침대 {airbnbPreview.beds}</span>}
                  {airbnbPreview.bathrooms != null && <span>욕실 {airbnbPreview.bathrooms}</span>}
                </div>
              </div>
            </a>
          )}

          {property.airbnbListingId && !airbnbPreview && !airbnbFetching && (
            <div className="rounded-xl border border-outline-dim px-4 py-4 mb-6">
              <p className="mb-2 text-[12px] font-medium text-ink-faint">에어비앤비 링크</p>
              <a
                href={property.airbnbListingId}
                target="_blank"
                rel="noreferrer"
                className="break-all text-[13px] text-ink-muted underline underline-offset-2"
              >
                {property.airbnbListingId}
              </a>
            </div>
          )}

          {message && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/8 px-4 py-3 text-sm text-brand">
              <span>!</span>
              {message}
            </div>
          )}

          <Link
            href={editHref}
            className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-lg bg-ink text-[15px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            수정하기
          </Link>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            disabled={deleting}
            className="mt-4 w-full text-center text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-destructive disabled:opacity-50"
          >
            숙소 삭제
          </button>
        </>
      ) : (
        <>
          <section className="mt-2 space-y-2">
            <p className="min-w-0 text-[14px] leading-relaxed text-ink-muted">
              <MapPinIcon className="mr-1 inline-block size-3.5 align-[-2px] text-ink-faint" strokeWidth={1.75} />
              {property.address}{property.addressDetail ? ` ${property.addressDetail}` : ''}
            </p>
            {details.length > 0 && (
              <p className="text-[13px] text-ink-muted">{details.join(' · ')}</p>
            )}
          </section>

          {message && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/8 px-4 py-3 text-sm text-brand">
              <span>!</span>
              {message}
            </div>
          )}

          <section className="mt-7 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-semibold text-ink">출입 및 와이파이 정보</p>
              <Link
                href={`${detailBaseHref}/edit/access`}
                className="text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
              >
                수정하기
              </Link>
            </div>
            <CompoundInput>
              <CompoundField label="현관 비밀번호" borderRadius="12px 12px 0 0">
                <span className="block w-full text-[16px] text-ink">{property.entrancePassword || '-'}</span>
              </CompoundField>
              <CompoundField label="도어락 비밀번호">
                <span className="block w-full text-[16px] text-ink">{property.doorLockPassword || '-'}</span>
              </CompoundField>
              <CompoundField label="와이파이 이름">
                <span className="block w-full text-[16px] text-ink">{property.wifiSsid || '-'}</span>
              </CompoundField>
              <CompoundField label="와이파이 비밀번호" borderRadius="0 0 12px 12px">
                <span className="block w-full text-[16px] text-ink">{property.wifiPassword || '-'}</span>
              </CompoundField>
            </CompoundInput>
          </section>

          <section className="mt-7 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-semibold text-ink">청소 준비 정보</p>
              <Link
                href={`${detailBaseHref}/edit/cleaning-prep`}
                className="text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
              >
                수정하기
              </Link>
            </div>
            <CleaningPrepReadGroup
              title="청소 도구함 위치"
              text={property.cleaningClosetLocation}
              photos={property.cleaningPrepPhotos.cleaning_closet}
            />
            <CleaningPrepReadGroup
              title="침구류 여분 위치"
              text={property.extraLinenLocation}
              photos={property.cleaningPrepPhotos.extra_linen}
            />
            <CleaningPrepReadGroup
              title="쓰레기 배출 장소"
              text={property.trashDisposalLocation}
              photos={property.cleaningPrepPhotos.trash_disposal}
            />
            {property.linenWashLocation === 'external' && (
              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-ink">외부 세탁소 주소</p>
                <CompoundInput>
                  <CompoundField label="주소" borderRadius="12px">
                    <span className="block w-full text-[16px] text-ink">
                      {property.linenWashExternalAddress
                        ? `${property.linenWashExternalAddress}${property.linenWashExternalAddressDetail ? ` ${property.linenWashExternalAddressDetail}` : ''}`
                        : '-'}
                    </span>
                  </CompoundField>
                </CompoundInput>
                {property.cleaningPrepPhotos.linen_wash_external.length > 0 && (
                  <CleaningPrepPhotoGrid photos={property.cleaningPrepPhotos.linen_wash_external} />
                )}
              </div>
            )}
          </section>

          <section className="mt-7 space-y-4">
            <p className="text-[16px] font-semibold text-ink">공간 정보</p>
            {property.spaces.length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-strong px-4 py-6 text-center text-[14px] text-ink-muted">
                등록된 공간이 없어요.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {property.spaces.map((space) => (
                  <Link
                    key={space.id}
                    href={`${detailBaseHref}/spaces/${space.id}`}
                    className="overflow-hidden rounded-xl border border-outline-dim transition-all active:scale-[0.99] md:hover:-translate-y-0.5 md:hover:border-outline-strong md:hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)]"
                  >
                    <div className="relative aspect-[16/10] w-full bg-surface-soft">
                      {space.photos[0]?.signedUrl ? (
                        <ImageWithSkeleton
                          src={space.photos[0].signedUrl}
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
                    <div className="px-4 py-4">
                      <p className="text-[15px] font-semibold text-ink">{space.name}</p>
                      <p className="mt-1 text-[13px] text-ink-muted">
                        {space.floor}층 · {SPACE_CATEGORY_LABELS[space.category]} · {space.pyeong}평
                      </p>
                      {space.notes && (
                        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-ink-muted">{space.notes}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="mt-7 space-y-4">
            <p className="text-[16px] font-semibold text-ink">시설물 정보</p>
            {property.assets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-strong px-4 py-6 text-center text-[14px] text-ink-muted">
                등록된 시설물이 없어요.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {property.assets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    name={asset.name}
                    category={ASSET_CATEGORY_LABELS[asset.category]}
                    location={asset.location}
                    brand={asset.brand}
                    modelNumber={asset.modelNumber}
                    notes={asset.notes}
                    imageUrl={asset.photos[0]?.signedUrl ?? null}
                    href={`${detailBaseHref}/assets/${asset.id}`}
                  />
                ))}
              </div>
            )}
          </section>

          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            disabled={deleting}
            className="mt-7 w-full text-center text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-destructive disabled:opacity-50"
          >
            숙소 삭제
          </button>
        </>
      )}

      <Drawer open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-[440px] px-6 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-ink">
                정말 삭제할까요?
              </DrawerTitle>
            </DrawerHeader>
            <p className="mb-6 text-[14px] text-ink-muted">
              삭제한 숙소는 목록에서 숨겨져요.
            </p>
            <div className="flex flex-col gap-3">
              <LoadingButton
                type="button"
                variant="destructive"
                onClick={handleDelete}
                loading={deleting}
                loadingText="삭제 중..."
              >
                삭제하기
              </LoadingButton>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="w-full text-center text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
              >
                취소
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <ProcessDrawer
        open={registrationDrawerOpen}
        onOpenChange={setRegistrationDrawerOpen}
        title="숙소 등록 진행 과정"
        steps={PROPERTY_REGISTRATION_STEPS}
      />
    </div>
  )
}
