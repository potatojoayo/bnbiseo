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
  storagePath: string
  previewUrl: string
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

export default function AdminFixtureCreatePage() {
  const { id } = useParams<{ id: string }>()
  const isMobile = useIsMobile()
  const router = useRouter()
  const invalidate = useInvalidateAdmin()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { data, isLoading: loading, error } = useAdminPropertyRegistration(id)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [spaces, setSpaces] = useState<Array<{ id: string; name: string }>>([])
  const [category, setCategory] = useState<FixtureCategory>('other')
  const [name, setName] = useState('')
  const [spaceName, setSpaceName] = useState('')
  const [detailLocation, setDetailLocation] = useState('')
  const [brand, setBrand] = useState('')
  const [modelNumber, setModelNumber] = useState('')
  const [specNotes, setSpecNotes] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<FixturePhoto[]>([])
  const createFixtureMutation = useMutation({
    mutationFn: (payload: {
      category: FixtureCategory
      name: string
      location: string
      brand?: string
      modelNumber?: string
      specNotes?: string
      notes?: string
      photoPaths: string[]
    }) => api.post(`/admin/properties/${id}/registration/fixtures`, payload),
    onSuccess: () => {
      invalidate.propertyRegistration(id)
      invalidate.properties()
    },
  })

  useEffect(() => {
    setSpaces(data?.spaces?.map((space) => ({ id: space.id, name: space.name })) ?? [])
  }, [data])

  useEffect(() => {
    if (!error) return
    setMessage(error instanceof ApiError ? error.message : '공간 정보를 불러오지 못했어요.')
  }, [error])

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return

    setUploading(true)
    setMessage(null)

    try {
      const uploadedPhotos: FixturePhoto[] = []

      for (const file of Array.from(files)) {
        const signed = await api.post<{ path: string; token: string }>(`/admin/properties/${id}/registration/upload-url`, {
          fileName: file.name,
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
        photoPaths: photos.map((photo) => photo.storagePath),
      })
      router.push(`/admin/properties/${id}`)
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : '시설물을 추가하지 못했어요.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        {!isMobile && <SiteHeader title="시설물 추가" />}
        {isMobile && (
          <div className="mx-auto w-full max-w-[720px] px-6 pt-6 max-md:p-5">
            <MobileBackButton href={`/admin/properties/${id}`} mode="back" />
            <h1 className="mt-2 text-[22px] font-semibold text-[#222222]">시설물 추가</h1>
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
      {!isMobile && <SiteHeader title="시설물 추가" />}
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 p-6 max-md:p-5">
        {isMobile && (
          <div>
            <MobileBackButton href={`/admin/properties/${id}`} mode="back" />
            <h1 className="mt-2 text-[22px] font-semibold text-[#222222]">시설물 추가</h1>
          </div>
        )}
        <section className="space-y-4">
          <div>
            <p className="text-[16px] font-semibold text-[#222222]">시설물 정보</p>
            <p className="mt-1 text-[13px] text-[#717171]">이름과 공간 선택은 꼭 입력해주세요.</p>
          </div>

          <CompoundInput>
            <CompoundField label="카테고리" borderRadius="12px 12px 0 0">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FixtureCategory)}
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
                className="w-full bg-transparent text-[16px] text-[#222222] outline-none"
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
                <div key={`${photo.storagePath}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border border-[#D9D9D9]">
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
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
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

        {spaces.length === 0 && (
          <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[13px] text-[#92400E]">
            시설물을 추가하려면 먼저 공간을 등록해주세요.
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
            disabled={!name.trim() || !spaceName.trim() || spaces.length === 0 || photos.length === 0}
          >
            추가하기
          </LoadingButton>
        </div>
      </div>
    </>
  )
}
