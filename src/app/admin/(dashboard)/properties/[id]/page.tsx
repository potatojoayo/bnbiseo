'use client'

import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { MapPinIcon, PlusIcon } from 'lucide-react'
import { MobileBackButton } from '@/components/mobile-back-button'
import { SiteHeader } from '@/components/site-header'
import { api, ApiError } from '@/lib/api-client'
import { useAdminPropertyRegistration, useInvalidateAdmin } from '@/lib/hooks/use-admin'
import { LoadingButton } from '@/components/ui/loading-button'
import { CompoundInput, FloatingInput } from '@/components/ui/floating-input'

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

type SpaceCategory = 'living_room' | 'bedroom' | 'bathroom'

type RegistrationDetail = {
  spaces: Array<{
    id: string
    category: SpaceCategory
    floor: number
    name: string
    pyeong: number
    notes: string | null
    photos: Array<{
      id: string
      storagePath: string
      signedUrl: string | null
    }>
  }>
  fixtures: Array<{
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
  }>
}

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

export default function AdminPropertyRegistrationPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading: loading, error } = useAdminPropertyRegistration(id)

  if (loading) {
    return (
      <>
        <SiteHeader title="등록 진행" />
        <div className="flex min-h-[100dvh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
        </div>
      </>
    )
  }

  if (!data) {
    return (
      <>
        <SiteHeader title="등록 진행" />
        <div className="flex flex-1 items-center justify-center px-6 py-20 text-center text-[14px] text-ink-muted">
          {error instanceof ApiError ? error.message : '숙소 정보를 불러오지 못했어요.'}
        </div>
      </>
    )
  }

  if (data.status === 'active') {
    return <AdminPropertyDetailView property={data} />
  }

  return (
    <AdminPropertyRegistrationForm
      key={`${id}-${data.spaces?.length ?? 0}-${data.fixtures?.length ?? 0}`}
      propertyId={id}
      initialData={data}
    />
  )
}

function AdminPropertyRegistrationForm({
  propertyId,
  initialData,
}: {
  propertyId: string
  initialData: {
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
    hostName: string | null
    hostEmail: string | null
    spaces: RegistrationDetail['spaces']
    fixtures: RegistrationDetail['fixtures']
  }
}) {
  const router = useRouter()
  const invalidate = useInvalidateAdmin()
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [entrancePassword, setEntrancePassword] = useState(initialData.entrancePassword || '')
  const [doorLockPassword, setDoorLockPassword] = useState(initialData.doorLockPassword || '')
  const [wifiSsid, setWifiSsid] = useState(initialData.wifiSsid || '')
  const [wifiPassword, setWifiPassword] = useState(initialData.wifiPassword || '')
  const lastSavedRef = useRef({
    entrancePassword: initialData.entrancePassword || '',
    doorLockPassword: initialData.doorLockPassword || '',
    wifiSsid: initialData.wifiSsid || '',
    wifiPassword: initialData.wifiPassword || '',
  })

  const draftMutation = useMutation({
    mutationFn: (payload: { entrancePassword?: string; doorLockPassword?: string; wifiSsid?: string; wifiPassword?: string }) =>
      api.post(`/admin/properties/${propertyId}/registration/draft`, payload),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(
        ['admin', 'property-registration', propertyId],
        (previous: (typeof initialData & { id?: string; status?: string }) | undefined) =>
          previous
            ? {
                ...previous,
                entrancePassword: variables.entrancePassword ?? null,
                doorLockPassword: variables.doorLockPassword ?? null,
                wifiSsid: variables.wifiSsid ?? null,
                wifiPassword: variables.wifiPassword ?? null,
              }
            : previous,
      )
      invalidate.propertyRegistration(propertyId)
      invalidate.properties()
      lastSavedRef.current = {
        entrancePassword: variables.entrancePassword || '',
        doorLockPassword: variables.doorLockPassword || '',
        wifiSsid: variables.wifiSsid || '',
        wifiPassword: variables.wifiPassword || '',
      }
    },
  })
  function handleDraftChange(setter: (value: string) => void, value: string) {
    setter(value)
    if (message) setMessage(null)
  }

  async function saveDraftOnBlur() {
    const nextDraft = {
      entrancePassword,
      doorLockPassword,
      wifiSsid,
      wifiPassword,
    }

    if (
      nextDraft.entrancePassword === lastSavedRef.current.entrancePassword
      && nextDraft.doorLockPassword === lastSavedRef.current.doorLockPassword
      && nextDraft.wifiSsid === lastSavedRef.current.wifiSsid
      && nextDraft.wifiPassword === lastSavedRef.current.wifiPassword
    ) {
      return
    }

    try {
      await draftMutation.mutateAsync({
        entrancePassword: nextDraft.entrancePassword || undefined,
        doorLockPassword: nextDraft.doorLockPassword || undefined,
        wifiSsid: nextDraft.wifiSsid || undefined,
        wifiPassword: nextDraft.wifiPassword || undefined,
      })
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : '임시 저장에 실패했어요.')
    }
  }

  async function handleSubmit() {
    setSaving(true)
    setMessage(null)

    try {
      await api.post(`/admin/properties/${propertyId}/registration`, {
        entrancePassword: entrancePassword || undefined,
        doorLockPassword,
        wifiSsid: wifiSsid || undefined,
        wifiPassword: wifiPassword || undefined,
        fixtures: initialData.fixtures.map((fixture) => ({
          id: fixture.id,
          category: fixture.category,
          name: fixture.name,
          location: fixture.location,
          brand: fixture.brand || undefined,
          modelNumber: fixture.modelNumber || undefined,
          specNotes: fixture.specNotes || undefined,
          notes: fixture.notes || undefined,
          photoPaths: fixture.photos.map((photo) => photo.storagePath),
        })),
      })
      invalidate.propertyRegistration(propertyId)
      invalidate.properties()
      router.push('/admin/properties')
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : '등록 진행 내용을 저장하지 못했어요.')
      setSaving(false)
    }
  }

  return (
    <>
      <SiteHeader title="등록 진행" />
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-7 p-6 max-md:animate-fade-up-fast max-md:gap-6 max-md:p-5">
        <div className="-mb-2 md:hidden">
          <MobileBackButton href="/admin/properties" mode="back" />
          <h1 className="mt-2 text-[22px] font-semibold text-ink">등록 진행</h1>
        </div>
        <section className="rounded-xl border border-outline-dim px-5 py-4">
          <p className="text-[20px] font-semibold text-ink">{initialData.name}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
            <MapPinIcon className="mr-1 inline-block size-3.5 align-[-2px] text-ink-faint" strokeWidth={1.75} />
            {initialData.address}{initialData.addressDetail ? ` ${initialData.addressDetail}` : ''}
          </p>
          <p className="mt-2 text-[13px] text-ink-muted">호스트: {initialData.hostName || initialData.hostEmail || '-'}</p>
        </section>

        <section className="space-y-4">
          <div>
              <p className="text-[16px] font-semibold text-ink">출입 및 와이파이 정보</p>
              <p className="mt-1 text-[13px] text-ink-muted">도어락 비밀번호는 꼭 입력해주세요.</p>
          </div>

          <CompoundInput>
            <FloatingInput
              label="현관 비밀번호 (선택)"
              value={entrancePassword}
              onChange={(e) => handleDraftChange(setEntrancePassword, e.target.value)}
              onBlur={() => void saveDraftOnBlur()}
              placeholder="예: 1234#"
              borderRadius="12px 12px 0 0"
            />
            <FloatingInput
              label="도어락 비밀번호"
              value={doorLockPassword}
              onChange={(e) => handleDraftChange(setDoorLockPassword, e.target.value)}
              onBlur={() => void saveDraftOnBlur()}
              placeholder="예: 2580#"
            />
            <FloatingInput
              label="와이파이 이름 (선택)"
              value={wifiSsid}
              onChange={(e) => handleDraftChange(setWifiSsid, e.target.value)}
              onBlur={() => void saveDraftOnBlur()}
              placeholder="예: Bnbiseo_Wifi"
            />
            <FloatingInput
              label="와이파이 비밀번호 (선택)"
              value={wifiPassword}
              onChange={(e) => handleDraftChange(setWifiPassword, e.target.value)}
              onBlur={() => void saveDraftOnBlur()}
              placeholder="예: wifi1234"
              borderRadius="0 0 12px 12px"
            />
          </CompoundInput>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[16px] font-semibold text-ink">공간 정보</p>
              <p className="mt-1 text-[13px] text-ink-muted">입력한 평수를 모두 합쳐 총 평수를 계산해요.</p>
            </div>
            <Link
              href={`/admin/properties/${propertyId}/spaces/new`}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-outline-strong px-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface-soft"
            >
              <PlusIcon size={14} />
              공간 추가
            </Link>
          </div>

          {initialData.spaces.length === 0 ? (
            <div className="rounded-xl border border-dashed border-outline-strong px-4 py-6 text-center text-[14px] text-ink-muted">
              아직 추가된 공간이 없어요.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {initialData.spaces.map((space) => (
                <Link
                  key={space.id}
                  href={`/admin/properties/${propertyId}/spaces/${space.id}`}
                  className="overflow-hidden rounded-xl border border-outline-dim transition-transform active:scale-[0.99]"
                >
                  <div>
                    <div className="relative aspect-[16/10] w-full bg-surface-soft">
                      {space.photos[0]?.signedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={space.photos[0].signedUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[13px] text-ink-faint">
                          사진 없음
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col px-4 py-4">
                      <p className="text-[15px] font-semibold text-ink">{space.name}</p>
                      <p className="mt-1 text-[13px] text-ink-muted">
                        {space.floor}층 · {SPACE_CATEGORY_LABELS[space.category]} · {space.pyeong}평
                      </p>
                      {space.notes && (
                        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-ink-muted">{space.notes}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[16px] font-semibold text-ink">시설물 정보</p>
              <p className="mt-1 text-[13px] text-ink-muted">추가한 시설물은 바로 저장돼요.</p>
            </div>
            <Link
              href={`/admin/properties/${propertyId}/fixtures/new`}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-outline-strong px-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface-soft"
            >
              <PlusIcon size={14} />
              시설물 추가
            </Link>
          </div>

          {initialData.fixtures.length === 0 ? (
            <div className="rounded-xl border border-dashed border-outline-strong px-4 py-6 text-center text-[14px] text-ink-muted">
              아직 추가된 시설물이 없어요.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {initialData.fixtures.map((fixture) => (
                <Link
                  key={fixture.id}
                  href={`/admin/properties/${propertyId}/fixtures/${fixture.id}`}
                  className="overflow-hidden rounded-xl border border-outline-dim transition-transform active:scale-[0.99]"
                >
                  <div className="flex items-stretch">
                    <div className="relative w-[104px] shrink-0 overflow-hidden bg-surface-soft">
                      {fixture.photos[0]?.signedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={fixture.photos[0].signedUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
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

        {message && (
          <div className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-[13px] text-danger">
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pb-2 md:flex md:justify-end">
          <Link
            href="/admin/properties"
            className="inline-flex h-12 min-w-0 items-center justify-center whitespace-nowrap rounded-lg border border-outline-strong px-4 text-[14px] font-medium text-ink transition-colors hover:bg-surface-soft md:min-w-[120px]"
          >
            취소
          </Link>
          <LoadingButton
            type="button"
            loading={saving}
            loadingText="처리 중..."
            onClick={handleSubmit}
            className="min-w-0 whitespace-nowrap md:min-w-[120px]"
            disabled={!doorLockPassword.trim()}
          >
            등록 완료
          </LoadingButton>
        </div>
      </div>
    </>
  )
}

function AdminPropertyDetailView({
  property,
}: {
  property: {
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
    hostName: string | null
    hostEmail: string | null
    spaces: RegistrationDetail['spaces']
    fixtures: RegistrationDetail['fixtures']
  }
}) {
  const details = [
    property.pyeong != null && `${property.pyeong}평`,
    property.livingRooms != null && `거실 ${property.livingRooms}`,
    property.bedrooms != null && `침실 ${property.bedrooms}`,
    property.bathrooms != null && `욕실 ${property.bathrooms}`,
  ].filter(Boolean)

  return (
    <>
      <SiteHeader title="숙소 상세" />
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-7 p-6 max-md:animate-fade-up-fast max-md:gap-6 max-md:p-5">
        <div className="-mb-2 md:hidden">
          <MobileBackButton href="/admin/properties" mode="back" />
          <h1 className="mt-2 text-[22px] font-semibold text-ink">숙소 상세</h1>
        </div>

        <section className="rounded-xl border border-outline-dim px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[20px] font-semibold text-ink">{property.name}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                <MapPinIcon className="mr-1 inline-block size-3.5 align-[-2px] text-ink-faint" strokeWidth={1.75} />
                {property.address}{property.addressDetail ? ` ${property.addressDetail}` : ''}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">
              등록 완료
            </span>
          </div>
          {details.length > 0 && (
            <p className="mt-2 text-[13px] text-ink-muted">{details.join(' · ')}</p>
          )}
          <p className="mt-2 text-[13px] text-ink-muted">호스트: {property.hostName || property.hostEmail || '-'}</p>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-[16px] font-semibold text-ink">출입 및 와이파이 정보</p>
          </div>
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

        <section className="space-y-4">
          <div>
            <p className="text-[16px] font-semibold text-ink">공간 정보</p>
          </div>
          {property.spaces.length === 0 ? (
            <div className="rounded-xl border border-dashed border-outline-strong px-4 py-6 text-center text-[14px] text-ink-muted">
              등록된 공간이 없어요.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {property.spaces.map((space) => (
                <div key={space.id} className="overflow-hidden rounded-xl border border-outline-dim">
                  <div className="relative aspect-[16/10] w-full bg-surface-soft">
                    {space.photos[0]?.signedUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={space.photos[0].signedUrl} alt="" className="h-full w-full object-cover" />
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
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-[16px] font-semibold text-ink">시설물 정보</p>
          </div>
          {property.fixtures.length === 0 ? (
            <div className="rounded-xl border border-dashed border-outline-strong px-4 py-6 text-center text-[14px] text-ink-muted">
              등록된 시설물이 없어요.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {property.fixtures.map((fixture) => (
                <div key={fixture.id} className="overflow-hidden rounded-xl border border-outline-dim">
                  <div className="flex items-stretch">
                    <div className="relative w-[104px] shrink-0 overflow-hidden bg-surface-soft">
                      {fixture.photos[0]?.signedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={fixture.photos[0].signedUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
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
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
