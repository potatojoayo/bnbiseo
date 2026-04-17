'use client'

import { useMemo, useState } from 'react'
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

type SpaceCategory = 'living_room' | 'bedroom' | 'bathroom'

const CATEGORY_OPTIONS: Array<{ value: SpaceCategory; label: string }> = [
  { value: 'living_room', label: '거실' },
  { value: 'bedroom', label: '침실' },
  { value: 'bathroom', label: '화장실' },
]

const CATEGORY_PREFIX: Record<SpaceCategory, string> = {
  living_room: '거실',
  bedroom: '침실',
  bathroom: '화장실',
}

function getSuggestedName(
  category: SpaceCategory,
  floor: number,
  spaces: Array<{ category: SpaceCategory; floor: number }>,
) {
  const prefix = CATEGORY_PREFIX[category]
  const floorPrefix = floor > 1 ? `${floor}층 ` : ''
  const count = spaces.filter((space) => space.category === category && space.floor === floor).length

  if (category === 'living_room') {
    return count === 0 ? `${floorPrefix}${prefix}` : `${floorPrefix}${prefix}${count + 1}`
  }

  return `${floorPrefix}${prefix}${count + 1}`
}

export default function AdminSpaceCreatePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const invalidate = useInvalidateAdmin()
  const { data, isLoading: loading, error } = useAdminPropertyRegistration(id)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [floor, setFloor] = useState<1 | 2 | 3>(1)
  const [category, setCategory] = useState<SpaceCategory>('living_room')
  const [name, setName] = useState('')
  const [pyeong, setPyeong] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<UploadedAdminImage[]>([])
  const existingSpaces = data?.spaces ?? []
  const suggestedName = useMemo(
    () => getSuggestedName(category, floor, existingSpaces),
    [category, floor, existingSpaces],
  )
  const createSpaceMutation = useMutation({
    mutationFn: (payload: {
      category: SpaceCategory
      floor: 1 | 2 | 3
      name: string
      pyeong: string
      notes?: string
      photos: Array<{ storagePath: string; thumbnailStoragePath: string }>
    }) => api.post(`/admin/properties/${id}/registration/spaces`, payload),
    onSuccess: () => {
      invalidate.propertyRegistration(id)
      invalidate.properties()
    },
  })

  async function handleSubmit() {
    setSaving(true)
    setMessage(null)

    try {
      await createSpaceMutation.mutateAsync({
        category,
        floor,
        name: name.trim() || suggestedName,
        pyeong,
        notes: notes || undefined,
        photos: photos.map((photo) => ({
          storagePath: photo.storagePath,
          thumbnailStoragePath: photo.thumbnailStoragePath,
        })),
      })
      router.replace(`/admin/properties/${id}`)
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : '공간을 추가하지 못했어요.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <SiteHeader title="공간 추가" />
        <div className="flex min-h-[100dvh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
        </div>
      </>
    )
  }

  return (
    <>
      <SiteHeader title="공간 추가" />
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 p-6 max-md:animate-fade-up-fast max-md:p-5">
        <div className="-mb-1 md:hidden">
          <MobileBackButton href={`/admin/properties/${id}`} mode="back" />
          <h1 className="mt-2 text-[22px] font-semibold text-ink">공간 추가</h1>
        </div>
        <section className="space-y-4">
          <div>
            <p className="text-[16px] font-semibold text-ink">공간 정보</p>
            <p className="mt-1 text-[13px] text-ink-muted">카테고리와 층수를 고르면 이름이 자동으로 채워져요.</p>
          </div>

          <CompoundInput>
            <CompoundField label="카테고리" borderRadius="12px 12px 0 0">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SpaceCategory)}
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
            <CompoundField label="층수 선택">
              <div className="flex gap-2">
                {[1, 2, 3].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFloor(value as 1 | 2 | 3)}
                    className={`inline-flex h-9 min-w-0 flex-1 items-center justify-center rounded-lg border text-[14px] font-medium transition-colors ${
                      floor === value
                        ? 'border-ink bg-ink text-white'
                        : 'border-outline-strong text-ink hover:bg-surface-soft'
                    }`}
                  >
                    {value}층
                  </button>
                ))}
              </div>
            </CompoundField>
            <FloatingInput
              label="공간 이름"
              value={name || suggestedName}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 침실1"
            />
            <FloatingInput
              label="평수"
              type="number"
              min="1"
              inputMode="numeric"
              value={pyeong}
              onChange={(e) => setPyeong(e.target.value)}
              placeholder="예: 8"
            />
            <FloatingTextarea
              label="메모 (선택)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="알아둘 내용을 적어주세요."
              borderRadius="0 0 12px 12px"
            />
          </CompoundInput>
        </section>

        <AdminImageUploadField
          propertyId={id}
          kind="spaces"
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
            disabled={!(name.trim() || suggestedName.trim()) || !pyeong.trim() || photos.length === 0}
          >
            추가하기
          </LoadingButton>
        </div>
      </div>
    </>
  )
}
