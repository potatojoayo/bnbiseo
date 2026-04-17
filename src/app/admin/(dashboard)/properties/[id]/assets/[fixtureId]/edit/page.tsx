'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AdminImageUploadField } from '@/components/admin-image-upload-field'
import { MobileBackButton } from '@/components/mobile-back-button'
import { SiteHeader } from '@/components/site-header'
import { api, ApiError } from '@/lib/api-client'
import { type UploadedAdminImage } from '@/lib/admin-image-upload'
import { useAdminPropertyRegistration, useInvalidateAdmin } from '@/lib/hooks/use-admin'
import { LoadingButton } from '@/components/ui/loading-button'
import {
  CompoundField,
  CompoundInput,
  FloatingInput,
  FloatingTextarea,
} from '@/components/ui/floating-input'
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

type FixturePhoto = {
  id?: string
  storagePath: string
  thumbnailStoragePath: string
  previewUrl: string
}

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
    thumbnailStoragePath: string
    signedUrl: string | null
    thumbnailSignedUrl: string | null
  }>
}

type RegistrationCache = {
  fixtures: FixtureDetail[]
}

const CATEGORY_OPTIONS: Array<{ value: FixtureCategory; label: string }> = [
  { value: 'lighting', label: '조명' },
  { value: 'furniture', label: '가구' },
  { value: 'faucet', label: '수도/배관' },
  { value: 'boiler', label: '보일러' },
  { value: 'appliance', label: '가전' },
  { value: 'lock', label: '잠금장치' },
  { value: 'ac', label: '에어컨' },
  { value: 'washer', label: '세탁기' },
  { value: 'dryer', label: '건조기' },
  { value: 'vent', label: '환기' },
  { value: 'other', label: '기타' },
]

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

export default function AdminFixtureEditPage() {
  const { id, fixtureId } = useParams<{ id: string; fixtureId: string }>()
  const { data, isLoading, error } = useAdminPropertyRegistration(id)
  const target = data?.fixtures.find((fixture) => fixture.id === fixtureId)

  if (isLoading) {
    return (
      <>
        <SiteHeader title="시설물 수정" />
        <div className="flex min-h-[100dvh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
        </div>
      </>
    )
  }

  if (!target) {
    return (
      <>
        <SiteHeader title="시설물 수정" />
        <div className="flex flex-1 items-center justify-center px-6 py-20 text-center text-[14px] text-ink-muted">
          {error instanceof ApiError ? error.message : '시설물 정보를 찾을 수 없어요.'}
        </div>
      </>
    )
  }

  return (
    <AdminFixtureEditForm
      key={target.id}
      propertyId={id}
      fixture={target}
      spaces={data?.spaces.map((space) => ({ id: space.id, name: space.name })) ?? []}
    />
  )
}

function AdminFixtureEditForm({
  propertyId,
  fixture,
  spaces,
}: {
  propertyId: string
  fixture: FixtureDetail
  spaces: Array<{ id: string; name: string }>
}) {
  const router = useRouter()
  const invalidate = useInvalidateAdmin()
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const initialLocation = useMemo(
    () => splitFixtureLocation(fixture.location, spaces.map((space) => space.name)),
    [fixture.location, spaces],
  )
  const [category, setCategory] = useState<FixtureCategory>(fixture.category)
  const [name, setName] = useState(fixture.name)
  const [spaceName, setSpaceName] = useState(initialLocation.spaceName)
  const [detailLocation, setDetailLocation] = useState(initialLocation.detailLocation)
  const [brand, setBrand] = useState(fixture.brand || '')
  const [modelNumber, setModelNumber] = useState(fixture.modelNumber || '')
  const [specNotes, setSpecNotes] = useState(fixture.specNotes || '')
  const [notes, setNotes] = useState(fixture.notes || '')
  const [photos, setPhotos] = useState<FixturePhoto[]>(
    fixture.photos.map((photo) => ({
      id: photo.id,
      storagePath: photo.storagePath,
      thumbnailStoragePath: photo.thumbnailStoragePath,
      previewUrl: photo.thumbnailSignedUrl || photo.signedUrl || '',
    })),
  )

  const updateMutation = useMutation({
    mutationFn: (payload: {
      category: FixtureCategory
      name: string
      location: string
      brand?: string
      modelNumber?: string
      specNotes?: string
      notes?: string
      photos: Array<{ storagePath: string; thumbnailStoragePath: string }>
    }) => api.patch(`/admin/properties/${propertyId}/registration/assets/${fixture.id}`, payload),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(
        ['admin', 'property-registration', propertyId],
        (previous: RegistrationCache | undefined) =>
          previous
            ? {
                ...previous,
                fixtures: previous.fixtures.map((item) =>
                  item.id === fixture.id
                    ? {
                        ...item,
                        category: variables.category,
                        name: variables.name,
                        location: variables.location,
                        brand: variables.brand || null,
                        modelNumber: variables.modelNumber || null,
                        specNotes: variables.specNotes || null,
                        notes: variables.notes || null,
                        photos: variables.photos.map((photo, index) => ({
                          id: `${fixture.id}-${index}`,
                          storagePath: photo.storagePath,
                          thumbnailStoragePath: photo.thumbnailStoragePath,
                          signedUrl: photos.find((item) => item.storagePath === photo.storagePath)?.previewUrl || null,
                          thumbnailSignedUrl: photos.find((item) => item.storagePath === photo.storagePath)?.previewUrl || null,
                        })),
                      }
                    : item,
                ),
              }
            : previous,
      )
      invalidate.propertyRegistration(propertyId)
      invalidate.properties()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/admin/properties/${propertyId}/registration/assets/${fixture.id}`),
    onSuccess: () => {
      queryClient.setQueryData(
        ['admin', 'property-registration', propertyId],
        (previous: RegistrationCache | undefined) =>
          previous
            ? {
                ...previous,
                fixtures: previous.fixtures.filter((item) => item.id !== fixture.id),
              }
            : previous,
      )
      invalidate.propertyRegistration(propertyId)
      invalidate.properties()
    },
  })

  async function handleSubmit() {
    setSaving(true)
    setMessage(null)

    try {
      const location = detailLocation.trim()
        ? `${spaceName} · ${detailLocation.trim()}`
        : spaceName

      await updateMutation.mutateAsync({
        category,
        name,
        location,
        brand: brand || undefined,
        modelNumber: modelNumber || undefined,
        specNotes: specNotes || undefined,
        notes: notes || undefined,
        photos: photos.map((photo) => ({
          storagePath: photo.storagePath,
          thumbnailStoragePath: photo.thumbnailStoragePath,
        })),
      })
      if (window.history.length > 1) {
        router.back()
        return
      }

      router.replace(`/admin/properties/${propertyId}/assets/${fixture.id}`)
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : '시설물 정보를 저장하지 못했어요.')
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setMessage(null)

    try {
      await deleteMutation.mutateAsync()
      router.replace(`/admin/properties/${propertyId}`)
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : '시설물을 삭제하지 못했어요.')
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  function handleCancel() {
    const canGoBack
      = window.history.length > 1
      && document.referrer.startsWith(window.location.origin)

    if (canGoBack) {
      router.back()
      return
    }
    router.push(`/admin/properties/${propertyId}/assets/${fixture.id}`)
  }

  return (
    <>
      <SiteHeader title="시설물 수정" />
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 p-6 max-md:animate-fade-up-fast max-md:p-5">
        <div className="-mb-1 md:hidden">
          <MobileBackButton href={`/admin/properties/${propertyId}/assets/${fixture.id}`} mode="back" />
          <h1 className="mt-2 text-[22px] font-semibold text-ink">시설물 수정</h1>
        </div>

        <section className="space-y-4">
          <div>
            <p className="text-[16px] font-semibold text-ink">시설물 정보</p>
            <p className="mt-1 text-[13px] text-ink-muted">이름과 공간 선택은 꼭 입력해주세요.</p>
          </div>

          <CompoundInput>
            <CompoundField label="카테고리" borderRadius="12px 12px 0 0">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FixtureCategory)}
                className="w-full bg-transparent text-[16px] text-ink outline-none"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </CompoundField>
            <FloatingInput
              label="시설물 이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 거실 천장 조명"
            />
            <CompoundField label="공간 선택">
              <select
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                className="w-full bg-transparent text-[16px] text-ink outline-none"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                <option value="">공간을 선택하세요</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.name}>
                    {space.name}
                  </option>
                ))}
              </select>
            </CompoundField>
            <FloatingInput
              label="세부 위치 (선택)"
              value={detailLocation}
              onChange={(e) => setDetailLocation(e.target.value)}
              placeholder="예: 창가 쪽"
            />
            <FloatingInput
              label="브랜드 (선택)"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="예: 삼성"
            />
            <FloatingInput
              label="모델 번호 (선택)"
              value={modelNumber}
              onChange={(e) => setModelNumber(e.target.value)}
              placeholder="예: WF21BB6600AW"
            />
            <FloatingTextarea
              label="사양 메모 (선택)"
              value={specNotes}
              onChange={(e) => setSpecNotes(e.target.value)}
              placeholder="용량, 전압, 특징 등을 기록하세요."
            />
            <FloatingTextarea
              label="메모 (선택)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가로 알아둘 내용을 적어주세요."
              borderRadius="0 0 12px 12px"
            />
          </CompoundInput>
        </section>

        <AdminImageUploadField
          propertyId={propertyId}
          kind="assets"
          images={photos as UploadedAdminImage[]}
          onChange={(nextImages) => setPhotos(nextImages)}
          description="여러 장을 추가할 수 있어요."
          emptyText="아직 추가된 사진이 없어요."
          onError={setMessage}
        />

        {message && (
          <div className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-[13px] text-danger">
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pb-2 md:flex md:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex h-12 min-w-0 items-center justify-center whitespace-nowrap rounded-lg border border-outline-strong px-4 text-[14px] font-medium text-ink transition-colors hover:bg-surface-soft md:min-w-[120px]"
          >
            취소
          </button>
          <LoadingButton
            type="button"
            loading={saving}
            loadingText="저장 중..."
            onClick={handleSubmit}
            className="min-w-0 whitespace-nowrap md:min-w-[120px]"
            disabled={!name.trim() || !spaceName.trim() || photos.length === 0}
          >
            저장하기
          </LoadingButton>
        </div>

        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          disabled={deleting}
          className="w-full text-center text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-danger disabled:opacity-50"
        >
          시설물 삭제
        </button>
      </div>

      <Drawer open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-[440px] px-6 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-ink">
                삭제하시겠습니까?
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
    </>
  )
}
