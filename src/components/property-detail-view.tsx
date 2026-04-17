'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2Icon, MapPinIcon } from 'lucide-react'
import { api } from '@/lib/api-client'
import { ProcessDrawer } from '@/components/process-drawer'
import { useAirbnbListing } from '@/lib/hooks/use-airbnb-listing'
import { useInvalidateProperties } from '@/lib/hooks/use-properties'
import { PROPERTY_REGISTRATION_STEPS } from '@/lib/process-steps'
import { LoadingButton } from '@/components/ui/loading-button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { MobileBackButton } from '@/components/mobile-back-button'

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

type PropertyPhoto = {
  id: string
  storagePath: string
  thumbnailStoragePath: string
  signedUrl: string | null
  thumbnailSignedUrl: string | null
}

type PropertySpace = {
  id: string
  category: SpaceCategory
  floor: number
  name: string
  pyeong: number
  notes: string | null
  photos: PropertyPhoto[]
}

type PropertyAsset = {
  id: string
  category: AssetCategory
  name: string
  location: string
  brand: string | null
  modelNumber: string | null
  specNotes: string | null
  notes: string | null
  photos: PropertyPhoto[]
}

type PropertyDetail = {
  id: string
  status: 'pending_activation' | 'active'
  name: string
  address: string
  addressDetail: string | null
  pyeong: number | null
  livingRooms: number | null
  bedrooms: number | null
  bathrooms: number | null
  entrancePassword: string | null
  doorLockPassword: string | null
  wifiSsid: string | null
  wifiPassword: string | null
  airbnbListingId: string | null
  spaces: PropertySpace[]
  assets: PropertyAsset[]
}

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

export function PropertyDetailView({
  propertyId,
  backHref,
  editHref,
  detailBaseHref,
}: PropertyDetailViewProps) {
  const router = useRouter()
  const invalidateProperties = useInvalidateProperties()
  const [property, setProperty] = useState<PropertyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | undefined>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [registrationDrawerOpen, setRegistrationDrawerOpen] = useState(false)

  useEffect(() => {
    api.get<PropertyDetail>(`/properties/${propertyId}`)
      .then(setProperty)
      .catch(() => setProperty(null))
      .finally(() => setLoading(false))
  }, [propertyId])

  const {
    data: airbnbPreview,
    isLoading: airbnbFetching,
  } = useAirbnbListing(property?.airbnbListingId)

  async function handleDelete() {
    setDeleting(true)
    setMessage(undefined)

    try {
      await api.delete(`/properties/${propertyId}/permanent`)
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

  if (loading) {
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

      <h1 className="mt-2 text-[22px] font-semibold text-ink">{property.name}</h1>

      {property.status === 'pending_activation' ? (
        <>
          <div className="mb-6 mt-2 flex items-center gap-2">
            <span className="rounded-full border border-outline-dim bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-ink-muted">
              등록 대기
            </span>
          </div>

          <div className="rounded-xl border border-outline-dim px-4 py-4 flex flex-col gap-3 mb-4">
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
                  <Image
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
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 text-[14px] leading-relaxed text-ink-muted">
                <MapPinIcon className="mr-1 inline-block size-3.5 align-[-2px] text-ink-faint" strokeWidth={1.75} />
                {property.address}{property.addressDetail ? ` ${property.addressDetail}` : ''}
              </p>
              <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">
                등록 완료
              </span>
            </div>
            {details.length > 0 && (
              <p className="text-[13px] text-ink-muted">{details.join(' · ')}</p>
            )}
          </section>

          <section className="mt-7 space-y-4">
            <p className="text-[16px] font-semibold text-ink">출입 및 와이파이 정보</p>
            <div className="rounded-xl border border-outline-dim px-5 py-4">
              <div className="flex flex-col gap-3 text-[14px] text-ink">
                <div>
                  <p className="text-[12px] text-ink-muted">현관 비밀번호</p>
                  <p className="mt-1">{property.entrancePassword || '-'}</p>
                </div>
                <div>
                  <p className="text-[12px] text-ink-muted">도어락 비밀번호</p>
                  <p className="mt-1">{property.doorLockPassword || '-'}</p>
                </div>
                <div>
                  <p className="text-[12px] text-ink-muted">와이파이 이름</p>
                  <p className="mt-1">{property.wifiSsid || '-'}</p>
                </div>
                <div>
                  <p className="text-[12px] text-ink-muted">와이파이 비밀번호</p>
                  <p className="mt-1">{property.wifiPassword || '-'}</p>
                </div>
              </div>
            </div>
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
                    className="overflow-hidden rounded-xl border border-outline-dim transition-transform active:scale-[0.99]"
                  >
                    <div className="relative aspect-[16/10] w-full bg-surface-soft">
                      {space.photos[0]?.signedUrl ? (
                        <Image
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
                  <Link
                    key={asset.id}
                    href={`${detailBaseHref}/assets/${asset.id}`}
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
              삭제하면 되돌릴 수 없어요.
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
