'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { MapPinIcon, PhoneIcon, PlusIcon, UserIcon } from 'lucide-react'
import { MobileBackButton } from '@/components/mobile-back-button'
import { SiteHeader } from '@/components/site-header'
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton'
import { AssetCard } from '@/components/asset-card'
import { api, ApiError } from '@/lib/api-client'
import { cn, formatKoreanPhone } from '@/lib/utils'
import { useAdminPropertyRegistration, useInvalidateAdmin } from '@/lib/hooks/use-admin'
import { LoadingButton } from '@/components/ui/loading-button'
import { CompoundField, CompoundInput, FloatingInput } from '@/components/ui/floating-input'
import { AdminImageUploadField } from '@/components/admin-image-upload-field'
import type { UploadedAdminImage } from '@/lib/admin-image-upload'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

type FixtureCategory =
  | 'lighting'
  | 'furniture'
  | 'bedding'
  | 'faucet'
  | 'boiler'
  | 'appliance'
  | 'lock'
  | 'ac'
  | 'washer'
  | 'dryer'
  | 'vent'
  | 'other'

type SpaceCategory = 'living_room' | 'bedroom' | 'bathroom' | 'veranda' | 'exterior' | 'other'

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
      thumbnailStoragePath: string
      signedUrl: string | null
      thumbnailSignedUrl: string | null
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
      thumbnailStoragePath: string
      signedUrl: string | null
      thumbnailSignedUrl: string | null
    }>
  }>
}

const SPACE_CATEGORY_LABELS: Record<SpaceCategory, string> = {
  living_room: '거실',
  bedroom: '침실',
  bathroom: '화장실',
  veranda: '베란다',
  exterior: '외부',
  other: '기타',
}

const CATEGORY_LABELS: Record<FixtureCategory, string> = {
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

export default function AdminPropertyRegistrationPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { data, isLoading: loading, error } = useAdminPropertyRegistration(id)
  const isEditMode = searchParams.get('mode') === 'edit'

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

  if (data.status === 'active' && !isEditMode) {
    return <AdminPropertyDetailView propertyId={id} property={data} />
  }

  return (
    <AdminPropertyRegistrationForm
      key={`${id}-${data.spaces?.length ?? 0}-${data.fixtures?.length ?? 0}`}
      propertyId={id}
      mode={isEditMode ? 'edit' : 'registration'}
      initialData={data}
    />
  )
}

type CleaningPrepPhoto = {
  id: string
  storagePath: string
  thumbnailStoragePath: string
  signedUrl: string | null
  thumbnailSignedUrl: string | null
}

type CleaningPrepPhotosByKind = {
  cleaning_closet: CleaningPrepPhoto[]
  extra_linen: CleaningPrepPhoto[]
  trash_disposal: CleaningPrepPhoto[]
  linen_wash_external: CleaningPrepPhoto[]
}

function AdminPropertyRegistrationForm({
  propertyId,
  mode,
  initialData,
}: {
  propertyId: string
  mode: 'registration' | 'edit'
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
    cleaningClosetLocation: string | null
    extraLinenLocation: string | null
    trashDisposalLocation: string | null
    linenWashLocation: 'in_house' | 'external' | null
    linenWashExternalAddress: string | null
    linenWashExternalAddressDetail: string | null
    cleaningPrepPhotos: CleaningPrepPhotosByKind
    hostName: string | null
    hostEmail: string | null
    hostPhone: string | null
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
  const [cleaningClosetLocation, setCleaningClosetLocation] = useState(initialData.cleaningClosetLocation || '')
  const [extraLinenLocation, setExtraLinenLocation] = useState(initialData.extraLinenLocation || '')
  const [trashDisposalLocation, setTrashDisposalLocation] = useState(initialData.trashDisposalLocation || '')
  const [linenWashLocation, setLinenWashLocation] = useState<'in_house' | 'external' | null>(initialData.linenWashLocation)
  const [linenWashExternalAddress, setLinenWashExternalAddress] = useState(initialData.linenWashExternalAddress || '')
  const [linenWashExternalAddressDetail, setLinenWashExternalAddressDetail] = useState(initialData.linenWashExternalAddressDetail || '')
  const toUploadedImages = (photos: CleaningPrepPhoto[]): UploadedAdminImage[] =>
    photos.map((photo) => ({
      storagePath: photo.storagePath,
      thumbnailStoragePath: photo.thumbnailStoragePath,
      previewUrl: photo.thumbnailSignedUrl || photo.signedUrl || '',
    }))
  const [cleaningClosetPhotos, setCleaningClosetPhotos] = useState<UploadedAdminImage[]>(
    toUploadedImages(initialData.cleaningPrepPhotos.cleaning_closet),
  )
  const [extraLinenPhotos, setExtraLinenPhotos] = useState<UploadedAdminImage[]>(
    toUploadedImages(initialData.cleaningPrepPhotos.extra_linen),
  )
  const [trashDisposalPhotos, setTrashDisposalPhotos] = useState<UploadedAdminImage[]>(
    toUploadedImages(initialData.cleaningPrepPhotos.trash_disposal),
  )
  const [linenWashExternalPhotos, setLinenWashExternalPhotos] = useState<UploadedAdminImage[]>(
    toUploadedImages(initialData.cleaningPrepPhotos.linen_wash_external),
  )
  const photosKey = (photos: UploadedAdminImage[]) =>
    photos.map((photo) => photo.storagePath).join('|')
  const isEditingActive = mode === 'edit'
  const lastSavedRef = useRef<{
    entrancePassword: string
    doorLockPassword: string
    wifiSsid: string
    wifiPassword: string
    cleaningClosetLocation: string
    extraLinenLocation: string
    trashDisposalLocation: string
    linenWashLocation: 'in_house' | 'external' | null
    linenWashExternalAddress: string
    linenWashExternalAddressDetail: string
    cleaningClosetPhotosKey: string
    extraLinenPhotosKey: string
    trashDisposalPhotosKey: string
    linenWashExternalPhotosKey: string
  }>({
    entrancePassword: initialData.entrancePassword || '',
    doorLockPassword: initialData.doorLockPassword || '',
    wifiSsid: initialData.wifiSsid || '',
    wifiPassword: initialData.wifiPassword || '',
    cleaningClosetLocation: initialData.cleaningClosetLocation || '',
    extraLinenLocation: initialData.extraLinenLocation || '',
    trashDisposalLocation: initialData.trashDisposalLocation || '',
    linenWashLocation: initialData.linenWashLocation,
    linenWashExternalAddress: initialData.linenWashExternalAddress || '',
    linenWashExternalAddressDetail: initialData.linenWashExternalAddressDetail || '',
    cleaningClosetPhotosKey: photosKey(toUploadedImages(initialData.cleaningPrepPhotos.cleaning_closet)),
    extraLinenPhotosKey: photosKey(toUploadedImages(initialData.cleaningPrepPhotos.extra_linen)),
    trashDisposalPhotosKey: photosKey(toUploadedImages(initialData.cleaningPrepPhotos.trash_disposal)),
    linenWashExternalPhotosKey: photosKey(toUploadedImages(initialData.cleaningPrepPhotos.linen_wash_external)),
  })
  const readyToAutosaveRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  type CleaningPrepPhotosPayload = {
    cleaning_closet?: Array<{ storagePath: string; thumbnailStoragePath: string }>
    extra_linen?: Array<{ storagePath: string; thumbnailStoragePath: string }>
    trash_disposal?: Array<{ storagePath: string; thumbnailStoragePath: string }>
    linen_wash_external?: Array<{ storagePath: string; thumbnailStoragePath: string }>
  }
  const draftMutation = useMutation({
    mutationFn: (payload: {
      entrancePassword?: string
      doorLockPassword?: string
      wifiSsid?: string
      wifiPassword?: string
      cleaningClosetLocation?: string
      extraLinenLocation?: string
      trashDisposalLocation?: string
      linenWashLocation?: 'in_house' | 'external' | null
      linenWashExternalAddress?: string | null
      linenWashExternalAddressDetail?: string | null
      cleaningPrepPhotos?: CleaningPrepPhotosPayload
    }) =>
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
                cleaningClosetLocation: variables.cleaningClosetLocation ?? null,
                extraLinenLocation: variables.extraLinenLocation ?? null,
                trashDisposalLocation: variables.trashDisposalLocation ?? null,
                linenWashLocation: variables.linenWashLocation ?? null,
                linenWashExternalAddress: variables.linenWashExternalAddress ?? null,
                linenWashExternalAddressDetail: variables.linenWashExternalAddressDetail ?? null,
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
        cleaningClosetLocation: variables.cleaningClosetLocation || '',
        extraLinenLocation: variables.extraLinenLocation || '',
        trashDisposalLocation: variables.trashDisposalLocation || '',
        linenWashLocation: variables.linenWashLocation ?? null,
        linenWashExternalAddress: variables.linenWashExternalAddress || '',
        linenWashExternalAddressDetail: variables.linenWashExternalAddressDetail || '',
        cleaningClosetPhotosKey: photosKey(cleaningClosetPhotos),
        extraLinenPhotosKey: photosKey(extraLinenPhotos),
        trashDisposalPhotosKey: photosKey(trashDisposalPhotos),
        linenWashExternalPhotosKey: photosKey(linenWashExternalPhotos),
      }
    },
  })

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      readyToAutosaveRef.current = true
    })

    return () => {
      cancelAnimationFrame(frame)
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  function handleDraftChange(setter: (value: string) => void, value: string) {
    setter(value)
    if (message) setMessage(null)
  }

  async function saveDraft() {
    const nextCleaningClosetKey = photosKey(cleaningClosetPhotos)
    const nextExtraLinenKey = photosKey(extraLinenPhotos)
    const nextTrashDisposalKey = photosKey(trashDisposalPhotos)
    const nextLinenWashExternalKey = photosKey(linenWashExternalPhotos)
    const nextDraft = {
      entrancePassword,
      doorLockPassword,
      wifiSsid,
      wifiPassword,
      cleaningClosetLocation,
      extraLinenLocation,
      trashDisposalLocation,
      linenWashLocation,
      linenWashExternalAddress,
      linenWashExternalAddressDetail,
    }

    const photoKindsChanged: CleaningPrepPhotosPayload = {}
    if (nextCleaningClosetKey !== lastSavedRef.current.cleaningClosetPhotosKey) {
      photoKindsChanged.cleaning_closet = cleaningClosetPhotos.map(({ storagePath, thumbnailStoragePath }) => ({
        storagePath,
        thumbnailStoragePath,
      }))
    }
    if (nextExtraLinenKey !== lastSavedRef.current.extraLinenPhotosKey) {
      photoKindsChanged.extra_linen = extraLinenPhotos.map(({ storagePath, thumbnailStoragePath }) => ({
        storagePath,
        thumbnailStoragePath,
      }))
    }
    if (nextTrashDisposalKey !== lastSavedRef.current.trashDisposalPhotosKey) {
      photoKindsChanged.trash_disposal = trashDisposalPhotos.map(({ storagePath, thumbnailStoragePath }) => ({
        storagePath,
        thumbnailStoragePath,
      }))
    }
    if (nextLinenWashExternalKey !== lastSavedRef.current.linenWashExternalPhotosKey) {
      photoKindsChanged.linen_wash_external = linenWashExternalPhotos.map(({ storagePath, thumbnailStoragePath }) => ({
        storagePath,
        thumbnailStoragePath,
      }))
    }
    const hasPhotoChanges = Object.keys(photoKindsChanged).length > 0

    if (
      !hasPhotoChanges
      && nextDraft.entrancePassword === lastSavedRef.current.entrancePassword
      && nextDraft.doorLockPassword === lastSavedRef.current.doorLockPassword
      && nextDraft.wifiSsid === lastSavedRef.current.wifiSsid
      && nextDraft.wifiPassword === lastSavedRef.current.wifiPassword
      && nextDraft.cleaningClosetLocation === lastSavedRef.current.cleaningClosetLocation
      && nextDraft.extraLinenLocation === lastSavedRef.current.extraLinenLocation
      && nextDraft.trashDisposalLocation === lastSavedRef.current.trashDisposalLocation
      && nextDraft.linenWashLocation === lastSavedRef.current.linenWashLocation
      && nextDraft.linenWashExternalAddress === lastSavedRef.current.linenWashExternalAddress
      && nextDraft.linenWashExternalAddressDetail === lastSavedRef.current.linenWashExternalAddressDetail
    ) {
      return
    }

    try {
      await draftMutation.mutateAsync({
        entrancePassword: nextDraft.entrancePassword || undefined,
        doorLockPassword: nextDraft.doorLockPassword || undefined,
        wifiSsid: nextDraft.wifiSsid || undefined,
        wifiPassword: nextDraft.wifiPassword || undefined,
        cleaningClosetLocation: nextDraft.cleaningClosetLocation || undefined,
        extraLinenLocation: nextDraft.extraLinenLocation || undefined,
        trashDisposalLocation: nextDraft.trashDisposalLocation || undefined,
        linenWashLocation: nextDraft.linenWashLocation,
        linenWashExternalAddress: nextDraft.linenWashExternalAddress || null,
        linenWashExternalAddressDetail: nextDraft.linenWashExternalAddressDetail || null,
        ...(hasPhotoChanges ? { cleaningPrepPhotos: photoKindsChanged } : {}),
      })
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : '임시 저장에 실패했어요.')
    }
  }

  useEffect(() => {
    if (!readyToAutosaveRef.current) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      void saveDraft()
    }, 600)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [
    entrancePassword,
    doorLockPassword,
    wifiSsid,
    wifiPassword,
    cleaningClosetLocation,
    extraLinenLocation,
    trashDisposalLocation,
    linenWashLocation,
    linenWashExternalAddress,
    linenWashExternalAddressDetail,
    cleaningClosetPhotos,
    extraLinenPhotos,
    trashDisposalPhotos,
    linenWashExternalPhotos,
  ])

  async function handleSubmit() {
    setSaving(true)
    setMessage(null)

    try {
      await api.post(`/admin/properties/${propertyId}/registration`, {
        entrancePassword: entrancePassword || undefined,
        doorLockPassword,
        wifiSsid: wifiSsid || undefined,
        wifiPassword: wifiPassword || undefined,
        cleaningClosetLocation: cleaningClosetLocation || undefined,
        extraLinenLocation: extraLinenLocation || undefined,
        trashDisposalLocation: trashDisposalLocation || undefined,
        linenWashLocation,
        linenWashExternalAddress: linenWashExternalAddress || null,
        linenWashExternalAddressDetail: linenWashExternalAddressDetail || null,
        cleaningPrepPhotos: {
          cleaning_closet: cleaningClosetPhotos.map(({ storagePath, thumbnailStoragePath }) => ({
            storagePath,
            thumbnailStoragePath,
          })),
          extra_linen: extraLinenPhotos.map(({ storagePath, thumbnailStoragePath }) => ({
            storagePath,
            thumbnailStoragePath,
          })),
          trash_disposal: trashDisposalPhotos.map(({ storagePath, thumbnailStoragePath }) => ({
            storagePath,
            thumbnailStoragePath,
          })),
          linen_wash_external: linenWashExternalPhotos.map(({ storagePath, thumbnailStoragePath }) => ({
            storagePath,
            thumbnailStoragePath,
          })),
        },
        fixtures: initialData.fixtures.map((fixture) => ({
          id: fixture.id,
          category: fixture.category,
          name: fixture.name,
          location: fixture.location,
          brand: fixture.brand || undefined,
          modelNumber: fixture.modelNumber || undefined,
          specNotes: fixture.specNotes || undefined,
          notes: fixture.notes || undefined,
          photos: fixture.photos.map((photo) => ({
            storagePath: photo.storagePath,
            thumbnailStoragePath: photo.thumbnailStoragePath,
          })),
        })),
      })
      invalidate.propertyRegistration(propertyId)
      invalidate.properties()
      router.back()
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
          <MobileBackButton href={isEditingActive ? `/admin/properties/${propertyId}` : '/admin/properties'} mode="back" />
          <h1 className="mt-2 text-[22px] font-semibold text-ink">{isEditingActive ? '숙소 수정' : '등록 진행'}</h1>
        </div>
        <section className="rounded-xl border border-outline-dim px-5 py-4">
          <p className="text-[20px] font-semibold text-ink">{initialData.name}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
            <MapPinIcon className="mr-1 inline-block size-3.5 align-[-2px] text-ink-faint" strokeWidth={1.75} />
            {initialData.address}{initialData.addressDetail ? ` ${initialData.addressDetail}` : ''}
          </p>
          <p className="mt-2 text-[13px] text-ink-muted">
            <UserIcon className="mr-1 inline-block size-3.5 align-[-2px] text-ink-faint" strokeWidth={1.75} />
            {initialData.hostName || initialData.hostEmail || '-'}
          </p>
          <p className="mt-1 text-[13px] text-ink-muted">
            <PhoneIcon className="mr-1 inline-block size-3.5 align-[-2px] text-ink-faint" strokeWidth={1.75} />
            {initialData.hostPhone ? (
              <a
                href={`tel:${initialData.hostPhone.replace(/\D/g, '')}`}
                className="text-ink underline underline-offset-2"
              >
                {formatKoreanPhone(initialData.hostPhone)}
              </a>
            ) : (
              '-'
            )}
          </p>
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
              placeholder="예: 1234#"
              borderRadius="12px 12px 0 0"
            />
            <FloatingInput
              label="도어락 비밀번호"
              value={doorLockPassword}
              onChange={(e) => handleDraftChange(setDoorLockPassword, e.target.value)}
              placeholder="예: 2580#"
            />
            <FloatingInput
              label="와이파이 이름 (선택)"
              value={wifiSsid}
              onChange={(e) => handleDraftChange(setWifiSsid, e.target.value)}
              placeholder="예: Bnbiseo_Wifi"
            />
            <FloatingInput
              label="와이파이 비밀번호 (선택)"
              value={wifiPassword}
              onChange={(e) => handleDraftChange(setWifiPassword, e.target.value)}
              placeholder="예: wifi1234"
              borderRadius="0 0 12px 12px"
            />
          </CompoundInput>
        </section>

        <section className="space-y-6">
          <div>
            <p className="text-[16px] font-semibold text-ink">청소 준비 정보</p>
            <p className="mt-1 text-[13px] text-ink-muted">매니저가 청소·수리 시 활용하는 위치 정보예요. 사진을 함께 등록하면 더 좋아요.</p>
          </div>

          <div className="space-y-3">
            <CompoundInput>
              <FloatingInput
                label="청소 도구함 위치 (선택)"
                value={cleaningClosetLocation}
                onChange={(e) => handleDraftChange(setCleaningClosetLocation, e.target.value)}
                placeholder="예: 현관 신발장 오른쪽 하단"
                borderRadius="12px"
              />
            </CompoundInput>
            <AdminImageUploadField
              propertyId={propertyId}
              kind="cleaning-prep"
              images={cleaningClosetPhotos}
              onChange={setCleaningClosetPhotos}
              title="청소 도구함 사진"
              description="실제 위치 사진을 여러 장 올리면 매니저가 빠르게 찾을 수 있어요."
              emptyText="아직 추가된 사진이 없어요."
              onError={setMessage}
            />
          </div>

          <div className="space-y-3">
            <CompoundInput>
              <FloatingInput
                label="침구류 여분 위치 (선택)"
                value={extraLinenLocation}
                onChange={(e) => handleDraftChange(setExtraLinenLocation, e.target.value)}
                placeholder="예: 안방 붙박이장 맨 위칸"
                borderRadius="12px"
              />
            </CompoundInput>
            <AdminImageUploadField
              propertyId={propertyId}
              kind="cleaning-prep"
              images={extraLinenPhotos}
              onChange={setExtraLinenPhotos}
              title="침구류 여분 사진"
              description="여분 침구가 보관된 모습을 사진으로 남겨주세요."
              emptyText="아직 추가된 사진이 없어요."
              onError={setMessage}
            />
          </div>

          <div className="space-y-3">
            <CompoundInput>
              <FloatingInput
                label="쓰레기 배출 장소 (선택)"
                value={trashDisposalLocation}
                onChange={(e) => handleDraftChange(setTrashDisposalLocation, e.target.value)}
                placeholder="예: 건물 뒷편 분리수거장"
                borderRadius="12px"
              />
            </CompoundInput>
            <AdminImageUploadField
              propertyId={propertyId}
              kind="cleaning-prep"
              images={trashDisposalPhotos}
              onChange={setTrashDisposalPhotos}
              title="쓰레기 배출 장소 사진"
              description="배출 장소와 표지판이 보이는 사진이면 좋아요."
              emptyText="아직 추가된 사진이 없어요."
              onError={setMessage}
            />
          </div>

          <div>
            <p className="text-[13px] font-semibold text-ink mb-2">침구류 세탁 위치 (선택)</p>
            <p className="text-[12px] text-ink-muted mb-2.5">호스트가 청소 요청 시 침구류 세탁 옵션을 선택할 수 있어요. 설정하지 않으면 옵션이 노출되지 않아요.</p>
            <div className="grid grid-cols-1 gap-2">
              {([
                { value: 'in_house' as const, label: '숙소 내 세탁기/건조기', price: 10000 },
                { value: 'external' as const, label: '외부 코인 세탁기/건조기', price: 20000 },
              ]).map((option) => {
                const selected = linenWashLocation === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setLinenWashLocation(selected ? null : option.value)
                      if (message) setMessage(null)
                    }}
                    className={cn(
                      'flex items-center justify-between rounded-xl border-[1.5px] px-4 py-3.5 text-left transition-colors',
                      selected
                        ? 'border-ink bg-surface-soft'
                        : 'border-outline-dim hover:bg-surface-soft',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] shrink-0 transition-colors',
                          selected ? 'border-ink' : 'border-outline-strong',
                        )}
                      >
                        {selected && <span className="h-[10px] w-[10px] rounded-full bg-ink" />}
                      </span>
                      <span className={cn('text-[14px]', selected ? 'font-semibold text-ink' : 'font-medium text-ink')}>
                        {option.label}
                      </span>
                    </div>
                    <span className="text-[13px] text-ink-muted">
                      +{option.price.toLocaleString()}원
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {linenWashLocation === 'external' && (
            <div className="space-y-3 rounded-xl border border-outline-dim p-4">
              <p className="text-[13px] font-semibold text-ink">외부 세탁소 정보</p>
              <CompoundInput>
                <FloatingInput
                  label="기본 주소"
                  value={linenWashExternalAddress}
                  onChange={(e) => handleDraftChange(setLinenWashExternalAddress, e.target.value)}
                  placeholder="예: 서울특별시 강남구 테헤란로 123"
                  borderRadius="12px 12px 0 0"
                />
                <FloatingInput
                  label="상세 주소 (선택)"
                  value={linenWashExternalAddressDetail}
                  onChange={(e) => handleDraftChange(setLinenWashExternalAddressDetail, e.target.value)}
                  placeholder="예: 1층 코인세탁소"
                  borderRadius="0 0 12px 12px"
                />
              </CompoundInput>
              <AdminImageUploadField
                propertyId={propertyId}
                kind="cleaning-prep"
                images={linenWashExternalPhotos}
                onChange={setLinenWashExternalPhotos}
                title="외부 세탁소 사진"
                description="세탁소 외관·기기 사진을 올려두면 좋아요."
                emptyText="아직 추가된 사진이 없어요."
                onError={setMessage}
              />
            </div>
          )}
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
                  href={
                    isEditingActive
                      ? `/admin/properties/${propertyId}/spaces/${space.id}/edit`
                      : `/admin/properties/${propertyId}/spaces/${space.id}`
                  }
                  className="overflow-hidden rounded-xl border border-outline-dim transition-transform active:scale-[0.99]"
                >
                  <div>
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
              <p className="mt-1 text-[13px] text-ink-muted">추가한 시설물은 바로 저장됩니다.</p>
            </div>
            <Link
              href={`/admin/properties/${propertyId}/assets/new`}
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
                <AssetCard
                  key={fixture.id}
                  href={
                    isEditingActive
                      ? `/admin/properties/${propertyId}/assets/${fixture.id}/edit`
                      : `/admin/properties/${propertyId}/assets/${fixture.id}`
                  }
                  name={fixture.name}
                  category={CATEGORY_LABELS[fixture.category]}
                  location={fixture.location}
                  brand={fixture.brand}
                  modelNumber={fixture.modelNumber}
                  notes={fixture.notes}
                  imageUrl={fixture.photos[0]?.signedUrl ?? null}
                />
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
            href={isEditingActive ? `/admin/properties/${propertyId}` : '/admin/properties'}
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
            {isEditingActive ? '저장하기' : '등록 완료'}
          </LoadingButton>
        </div>
      </div>
    </>
  )
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

function AdminPropertyDetailView({
  propertyId,
  property,
}: {
  propertyId: string
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
    cleaningClosetLocation: string | null
    extraLinenLocation: string | null
    trashDisposalLocation: string | null
    linenWashLocation: 'in_house' | 'external' | null
    linenWashExternalAddress: string | null
    linenWashExternalAddressDetail: string | null
    cleaningPrepPhotos: CleaningPrepPhotosByKind
    hostName: string | null
    hostEmail: string | null
    hostPhone: string | null
    spaces: RegistrationDetail['spaces']
    fixtures: RegistrationDetail['fixtures']
  }
}) {
  const router = useRouter()
  const invalidate = useInvalidateAdmin()
  const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null)

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/admin/properties/${propertyId}`),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['admin', 'property-registration', propertyId] })
      invalidate.properties()
    },
  })

  const details = [
    property.pyeong != null && `${property.pyeong}평`,
    property.livingRooms != null && `거실 ${property.livingRooms}`,
    property.bedrooms != null && `침실 ${property.bedrooms}`,
    property.bathrooms != null && `욕실 ${property.bathrooms}`,
  ].filter(Boolean)

  async function handleDelete() {
    setDeleteMessage(null)

    try {
      await deleteMutation.mutateAsync()
      router.replace('/admin/properties')
    } catch (error) {
      setDeleteMessage(error instanceof ApiError ? error.message : '숙소를 삭제하지 못했어요.')
      setDeleteOpen(false)
    }
  }

  return (
    <>
      <SiteHeader title="숙소 상세" />
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-7 p-6 max-md:animate-fade-up-fast max-md:gap-6 max-md:p-5">
        <div className="-mb-2 md:hidden">
          <MobileBackButton href="/admin/properties" mode="back" />
        </div>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 text-[22px] font-semibold text-ink">{property.name}</p>
            <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">
              등록 완료
            </span>
          </div>
          <p className="text-[14px] leading-relaxed text-ink-muted">
            <MapPinIcon className="mr-1 inline-block size-3.5 align-[-2px] text-ink-faint" strokeWidth={1.75} />
            {property.address}{property.addressDetail ? ` ${property.addressDetail}` : ''}
          </p>
          {details.length > 0 && (
            <p className="text-[13px] text-ink-muted">{details.join(' · ')}</p>
          )}
          <p className="text-[13px] text-ink-muted">
            <UserIcon className="mr-1 inline-block size-3.5 align-[-2px] text-ink-faint" strokeWidth={1.75} />
            {property.hostName || property.hostEmail || '-'}
          </p>
          <p className="text-[13px] text-ink-muted">
            <PhoneIcon className="mr-1 inline-block size-3.5 align-[-2px] text-ink-faint" strokeWidth={1.75} />
            {property.hostPhone ? (
              <a
                href={`tel:${property.hostPhone.replace(/\D/g, '')}`}
                className="text-ink underline underline-offset-2"
              >
                {formatKoreanPhone(property.hostPhone)}
              </a>
            ) : (
              '-'
            )}
          </p>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-[16px] font-semibold text-ink">출입 및 와이파이 정보</p>
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

        <section className="space-y-4">
          <div>
            <p className="text-[16px] font-semibold text-ink">청소 준비 정보</p>
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
          <div className="space-y-2">
            <p className="text-[13px] font-semibold text-ink">침구류 세탁 위치</p>
            <CompoundInput>
              <CompoundField label="옵션" borderRadius={property.linenWashLocation === 'external' ? '12px 12px 0 0' : '12px'}>
                <span className="block w-full text-[16px] text-ink">
                  {property.linenWashLocation
                    ? property.linenWashLocation === 'in_house'
                      ? '숙소 내 세탁기/건조기 (+10,000원)'
                      : '외부 코인 세탁기/건조기 (+20,000원)'
                    : '-'}
                </span>
              </CompoundField>
              {property.linenWashLocation === 'external' && (
                <CompoundField label="외부 세탁소 주소" borderRadius="0 0 12px 12px">
                  <span className="block w-full text-[16px] text-ink">
                    {property.linenWashExternalAddress
                      ? `${property.linenWashExternalAddress}${property.linenWashExternalAddressDetail ? ` ${property.linenWashExternalAddressDetail}` : ''}`
                      : '-'}
                  </span>
                </CompoundField>
              )}
            </CompoundInput>
            {property.linenWashLocation === 'external' && property.cleaningPrepPhotos.linen_wash_external.length > 0 && (
              <CleaningPrepPhotoGrid photos={property.cleaningPrepPhotos.linen_wash_external} />
            )}
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
                <Link
                  key={space.id}
                  href={`/admin/properties/${propertyId}/spaces/${space.id}`}
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
                <AssetCard
                  key={fixture.id}
                  href={`/admin/properties/${propertyId}/assets/${fixture.id}`}
                  name={fixture.name}
                  category={CATEGORY_LABELS[fixture.category]}
                  location={fixture.location}
                  brand={fixture.brand}
                  modelNumber={fixture.modelNumber}
                  notes={fixture.notes}
                  imageUrl={fixture.photos[0]?.signedUrl ?? null}
                />
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-4">
          <Link
            href={`/admin/properties/${propertyId}?mode=edit`}
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
            숙소 삭제
          </button>

          {deleteMessage && (
            <p className="text-center text-[13px] text-danger">{deleteMessage}</p>
          )}
        </div>
      </div>

      <Drawer open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DrawerContent className="px-5 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle className="text-[18px] font-semibold text-ink">
              삭제하시겠습니까?
            </DrawerTitle>
          </DrawerHeader>
          <p className="mb-6 text-[14px] text-ink-muted">
            숙소를 삭제하면 되돌릴 수 없어요.
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
