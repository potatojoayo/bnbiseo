'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeftIcon, ChevronRightIcon, ImagePlusIcon, XIcon } from 'lucide-react'
import { MobileBackButton } from '@/components/mobile-back-button'
import { SiteHeader } from '@/components/site-header'
import { api, ApiError, supabase } from '@/lib/api-client'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAdminPropertyRegistration, useInvalidateAdmin } from '@/lib/hooks/use-admin'
import { LoadingButton } from '@/components/ui/loading-button'
import {
  CompoundField,
  CompoundInput,
  FloatingInput,
  FloatingTextarea,
} from '@/components/ui/floating-input'

type SpaceCategory = 'living_room' | 'bedroom' | 'bathroom'

type SpacePhoto = {
  storagePath: string
  previewUrl: string
}

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
  const isMobile = useIsMobile()
  const router = useRouter()
  const invalidate = useInvalidateAdmin()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { data, isLoading: loading, error } = useAdminPropertyRegistration(id)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [existingSpaces, setExistingSpaces] = useState<Array<{ id: string; category: SpaceCategory; floor: number; name: string }>>([])
  const [floor, setFloor] = useState<1 | 2 | 3>(1)
  const [category, setCategory] = useState<SpaceCategory>('living_room')
  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [pyeong, setPyeong] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<SpacePhoto[]>([])
  const createSpaceMutation = useMutation({
    mutationFn: (payload: {
      category: SpaceCategory
      floor: 1 | 2 | 3
      name: string
      pyeong: string
      notes?: string
      photoPaths: string[]
    }) => api.post(`/admin/properties/${id}/registration/spaces`, payload),
    onSuccess: () => {
      invalidate.propertyRegistration(id)
      invalidate.properties()
    },
  })

  useEffect(() => {
    const spaces = data?.spaces ?? []
    setExistingSpaces(spaces)
    setName((currentName) => currentName || getSuggestedName('living_room', 1, spaces))
  }, [data])

  useEffect(() => {
    if (!error) return
    setMessage(error instanceof ApiError ? error.message : '공간 정보를 불러오지 못했어요.')
  }, [error])

  function handleCategoryChange(nextCategory: SpaceCategory) {
    setCategory(nextCategory)
    if (!nameTouched || !name.trim()) {
      setName(getSuggestedName(nextCategory, floor, existingSpaces))
      setNameTouched(false)
    }
  }

  function handleFloorChange(nextFloor: 1 | 2 | 3) {
    setFloor(nextFloor)
    if (!nameTouched || !name.trim()) {
      setName(getSuggestedName(category, nextFloor, existingSpaces))
      setNameTouched(false)
    }
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return

    setUploading(true)
    setMessage(null)

    try {
      const uploadedPhotos: SpacePhoto[] = []

      for (const file of Array.from(files)) {
        const signed = await api.post<{ path: string; token: string }>(`/admin/properties/${id}/registration/upload-url`, {
          fileName: file.name,
          kind: 'spaces',
        })

        const { error } = await supabase.storage
          .from('images')
          .uploadToSignedUrl(signed.path, signed.token, file)

        if (error) {
          throw new Error(error.message)
        }

        uploadedPhotos.push({
          storagePath: signed.path,
          previewUrl: URL.createObjectURL(file),
        })
      }

      setPhotos((prev) => [...prev, ...uploadedPhotos])
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : '사진 업로드에 실패했어요.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, photoIndex) => photoIndex !== index))
  }

  function movePhoto(index: number, direction: 'left' | 'right') {
    setPhotos((prev) => {
      const nextIndex = direction === 'left' ? index - 1 : index + 1
      if (nextIndex < 0 || nextIndex >= prev.length) return prev

      const next = [...prev]
      const [target] = next.splice(index, 1)
      next.splice(nextIndex, 0, target)
      return next
    })
  }

  async function handleSubmit() {
    setSaving(true)
    setMessage(null)

    try {
      await createSpaceMutation.mutateAsync({
        category,
        floor,
        name,
        pyeong,
        notes: notes || undefined,
        photoPaths: photos.map((photo) => photo.storagePath),
      })
      router.push(`/admin/properties/${id}`)
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : '공간을 추가하지 못했어요.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        {!isMobile && <SiteHeader title="공간 추가" />}
        {isMobile && (
          <div className="mx-auto w-full max-w-[720px] px-6 pt-6 max-md:p-5">
            <MobileBackButton href={`/admin/properties/${id}`} mode="back" />
            <h1 className="mt-2 text-[22px] font-semibold text-[#222222]">공간 추가</h1>
          </div>
        )}
        <div className="flex flex-1 items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#EBEBEB] border-t-[#717171]" />
        </div>
      </>
    )
  }

  return (
    <>
      {!isMobile && <SiteHeader title="공간 추가" />}
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 p-6 max-md:p-5">
        {isMobile && (
          <div className="-mb-1">
            <MobileBackButton href={`/admin/properties/${id}`} mode="back" />
            <h1 className="mt-2 text-[22px] font-semibold text-[#222222]">공간 추가</h1>
          </div>
        )}
        <section className="space-y-4">
          <div>
            <p className="text-[16px] font-semibold text-[#222222]">공간 정보</p>
            <p className="mt-1 text-[13px] text-[#717171]">카테고리와 층수를 고르면 이름이 자동으로 채워져요.</p>
          </div>

          <CompoundInput>
            <CompoundField label="카테고리" borderRadius="12px 12px 0 0">
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as SpaceCategory)}
                className="w-full bg-transparent text-[16px] text-[#222222] outline-none"
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
                    onClick={() => handleFloorChange(value as 1 | 2 | 3)}
                    className={`inline-flex h-9 min-w-0 flex-1 items-center justify-center rounded-lg border text-[14px] font-medium transition-colors ${
                      floor === value
                        ? 'border-[#222222] bg-[#222222] text-white'
                        : 'border-[#D9D9D9] text-[#222222] hover:bg-[#F7F7F7]'
                    }`}
                  >
                    {value}층
                  </button>
                ))}
              </div>
            </CompoundField>
            <FloatingInput
              label="공간 이름"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameTouched(true)
              }}
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

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[16px] font-semibold text-[#222222]">사진</p>
              <p className="mt-1 text-[13px] text-[#717171]">여러 장을 추가할 수 있어요.</p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#D9D9D9] px-3 text-[13px] font-medium text-[#222222] transition-colors hover:bg-[#F7F7F7]"
            >
              <ImagePlusIcon size={14} />
              사진 추가
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void handleFilesSelected(e.target.files)}
          />

          {uploading && (
            <p className="text-[12px] text-[#717171]">사진 업로드 중...</p>
          )}

          {photos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D9D9D9] px-4 py-6 text-center text-[14px] text-[#717171]">
              아직 추가된 사진이 없어요.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div key={`${photo.storagePath}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />
                  {index === 0 && (
                    <div className="absolute left-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                      썸네일
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => movePhoto(index, 'left')}
                      disabled={index === 0}
                      className="rounded-full bg-black/60 p-1 text-white disabled:opacity-40"
                      aria-label="이전 순서로 이동"
                    >
                      <ChevronLeftIcon size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => movePhoto(index, 'right')}
                      disabled={index === photos.length - 1}
                      className="rounded-full bg-black/60 p-1 text-white disabled:opacity-40"
                      aria-label="다음 순서로 이동"
                    >
                      <ChevronRightIcon size={12} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                    aria-label="사진 삭제"
                  >
                    <XIcon size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {message && (
          <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pb-2 md:flex md:justify-end">
          <Link
            href={`/admin/properties/${id}`}
            className="inline-flex h-12 min-w-0 items-center justify-center whitespace-nowrap rounded-lg border border-[#D9D9D9] px-4 text-[14px] font-medium text-[#222222] transition-colors hover:bg-[#F7F7F7] md:min-w-[120px]"
          >
            취소
          </Link>
          <LoadingButton
            type="button"
            loading={saving}
            loadingText="추가 중..."
            onClick={handleSubmit}
            className="min-w-0 whitespace-nowrap md:min-w-[120px]"
            disabled={!name.trim() || !pyeong.trim() || photos.length === 0}
          >
            추가하기
          </LoadingButton>
        </div>
      </div>
    </>
  )
}
