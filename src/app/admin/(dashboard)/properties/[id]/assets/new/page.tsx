'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
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

const CATEGORY_OPTIONS: Array<{ value: FixtureCategory; label: string }> = [
  { value: 'lighting', label: '조명' },
  { value: 'furniture', label: '가구' },
  { value: 'bedding', label: '침구/침대' },
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

export default function AdminFixtureCreatePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const invalidate = useInvalidateAdmin()
  const { data, isLoading: loading, error } = useAdminPropertyRegistration(id)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [category, setCategory] = useState<FixtureCategory>('other')
  const [name, setName] = useState('')
  const [spaceName, setSpaceName] = useState('')
  const [detailLocation, setDetailLocation] = useState('')
  const [brand, setBrand] = useState('')
  const [modelNumber, setModelNumber] = useState('')
  const [specNotes, setSpecNotes] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<UploadedAdminImage[]>([])
  const spaces = data?.spaces?.map((space) => ({ id: space.id, name: space.name })) ?? []
  const createFixtureMutation = useMutation({
    mutationFn: (payload: {
      category: FixtureCategory
      name: string
      location: string
      brand?: string
      modelNumber?: string
      specNotes?: string
      notes?: string
      photos: Array<{ storagePath: string; thumbnailStoragePath: string }>
    }) => api.post(`/admin/properties/${id}/registration/assets`, payload),
    onSuccess: () => {
      invalidate.propertyRegistration(id)
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

      await createFixtureMutation.mutateAsync({
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
      router.back()
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : '시설물을 추가하지 못했어요.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <SiteHeader title="시설물 추가" />
        <div className="flex min-h-[100dvh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
        </div>
      </>
    )
  }

  return (
    <>
      <SiteHeader title="시설물 추가" />
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 p-6 max-md:animate-fade-up-fast max-md:p-5">
        <div className="md:hidden">
          <MobileBackButton href={`/admin/properties/${id}`} mode="back" />
          <h1 className="mt-2 text-[22px] font-semibold text-ink">시설물 추가</h1>
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
          propertyId={id}
          kind="assets"
          images={photos}
          onChange={setPhotos}
          description="여러 장을 추가할 수 있어요."
          emptyText="아직 추가된 사진이 없어요."
          onError={setMessage}
        />

        {message && (
          <div className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-[13px] text-danger">
            {message}
          </div>
        )}

        {spaces.length === 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-[13px] text-warning">
            시설물을 추가하려면 먼저 공간을 등록해주세요.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pb-2 md:flex md:justify-end">
          <Link
            href={`/admin/properties/${id}`}
            className="inline-flex h-12 min-w-0 items-center justify-center whitespace-nowrap rounded-lg border border-outline-strong px-4 text-[14px] font-medium text-ink transition-colors hover:bg-surface-soft md:min-w-[120px]"
          >
            취소
          </Link>
          <LoadingButton
            type="button"
            loading={saving}
            loadingText="추가 중..."
            onClick={handleSubmit}
            className="min-w-0 whitespace-nowrap md:min-w-[120px]"
            disabled={!name.trim() || !spaceName.trim() || spaces.length === 0 || photos.length === 0}
          >
            추가하기
          </LoadingButton>
        </div>
      </div>
    </>
  )
}
