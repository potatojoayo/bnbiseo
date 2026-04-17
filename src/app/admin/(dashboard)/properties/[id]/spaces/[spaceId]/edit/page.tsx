'use client'

import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeftIcon, ChevronRightIcon, ImagePlusIcon, XIcon } from 'lucide-react'
import { MobileBackButton } from '@/components/mobile-back-button'
import { SiteHeader } from '@/components/site-header'
import { api, ApiError, supabase } from '@/lib/api-client'
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

type SpaceCategory = 'living_room' | 'bedroom' | 'bathroom'

type SpacePhoto = {
  id?: string
  storagePath: string
  previewUrl: string
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
    signedUrl: string | null
  }>
}

type RegistrationCache = {
  spaces: SpaceDetail[]
}

const CATEGORY_OPTIONS: Array<{ value: SpaceCategory; label: string }> = [
  { value: 'living_room', label: '거실' },
  { value: 'bedroom', label: '침실' },
  { value: 'bathroom', label: '화장실' },
]

export default function AdminSpaceEditPage() {
  const { id, spaceId } = useParams<{ id: string; spaceId: string }>()
  const { data, isLoading, error } = useAdminPropertyRegistration(id)
  const target = data?.spaces.find((space) => space.id === spaceId)

  if (isLoading) {
    return (
      <>
        <SiteHeader title="공간 수정" />
        <div className="flex min-h-[100dvh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
        </div>
      </>
    )
  }

  if (!target) {
    return (
      <>
        <SiteHeader title="공간 수정" />
        <div className="flex flex-1 items-center justify-center px-6 py-20 text-center text-[14px] text-ink-muted">
          {error instanceof ApiError ? error.message : '공간 정보를 찾을 수 없어요.'}
        </div>
      </>
    )
  }

  return <AdminSpaceEditForm key={target.id} propertyId={id} space={target} />
}

function AdminSpaceEditForm({
  propertyId,
  space,
}: {
  propertyId: string
  space: SpaceDetail
}) {
  const router = useRouter()
  const invalidate = useInvalidateAdmin()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [floor, setFloor] = useState<1 | 2 | 3>((space.floor as 1 | 2 | 3) || 1)
  const [category, setCategory] = useState<SpaceCategory>(space.category)
  const [name, setName] = useState(space.name)
  const [pyeong, setPyeong] = useState(String(space.pyeong))
  const [notes, setNotes] = useState(space.notes || '')
  const [photos, setPhotos] = useState<SpacePhoto[]>(
    space.photos.map((photo) => ({
      id: photo.id,
      storagePath: photo.storagePath,
      previewUrl: photo.signedUrl || '',
    })),
  )

  const updateMutation = useMutation({
    mutationFn: (payload: {
      category: SpaceCategory
      floor: 1 | 2 | 3
      name: string
      pyeong: string
      notes?: string
      photoPaths: string[]
    }) => api.patch(`/admin/properties/${propertyId}/registration/spaces/${space.id}`, payload),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(
        ['admin', 'property-registration', propertyId],
        (previous: RegistrationCache | undefined) =>
          previous
            ? {
                ...previous,
                spaces: previous.spaces.map((item) =>
                  item.id === space.id
                    ? {
                        ...item,
                        category: variables.category,
                        floor: variables.floor,
                        name: variables.name,
                        pyeong: Number(variables.pyeong),
                        notes: variables.notes || null,
                        photos: variables.photoPaths.map((storagePath, index) => ({
                          id: `${space.id}-${index}`,
                          storagePath,
                          signedUrl:
                            photos.find((photo) => photo.storagePath === storagePath)?.previewUrl || null,
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
    mutationFn: () => api.delete(`/admin/properties/${propertyId}/registration/spaces/${space.id}`),
    onSuccess: () => {
      queryClient.setQueryData(
        ['admin', 'property-registration', propertyId],
        (previous: RegistrationCache | undefined) =>
          previous
            ? {
                ...previous,
                spaces: previous.spaces.filter((item) => item.id !== space.id),
              }
            : previous,
      )
      invalidate.propertyRegistration(propertyId)
      invalidate.properties()
    },
  })

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return

    setUploading(true)
    setMessage(null)

    try {
      const uploadedPhotos: SpacePhoto[] = []

      for (const file of Array.from(files)) {
        const signed = await api.post<{ path: string; token: string }>(`/admin/properties/${propertyId}/registration/upload-url`, {
          fileName: file.name,
          kind: 'spaces',
        })

        const { error } = await supabase.storage
          .from('images')
          .uploadToSignedUrl(signed.path, signed.token, file)

        if (error) throw new Error(error.message)

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
      const [targetPhoto] = next.splice(index, 1)
      next.splice(nextIndex, 0, targetPhoto)
      return next
    })
  }

  async function handleSubmit() {
    setSaving(true)
    setMessage(null)

    try {
      await updateMutation.mutateAsync({
        category,
        floor,
        name,
        pyeong,
        notes: notes || undefined,
        photoPaths: photos.map((photo) => photo.storagePath),
      })
      router.push(`/admin/properties/${propertyId}/spaces/${space.id}`)
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : '공간 정보를 저장하지 못했어요.')
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setMessage(null)

    try {
      await deleteMutation.mutateAsync()
      router.push(`/admin/properties/${propertyId}`)
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : '공간 정보를 삭제하지 못했어요.')
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
    router.push(`/admin/properties/${propertyId}/spaces/${space.id}`)
  }

  return (
    <>
      <SiteHeader title="공간 수정" />
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 p-6 max-md:animate-fade-up-fast max-md:p-5">
        <div className="-mb-1 md:hidden">
          <MobileBackButton href={`/admin/properties/${propertyId}/spaces/${space.id}`} mode="back" />
          <h1 className="mt-2 text-[22px] font-semibold text-ink">공간 수정</h1>
        </div>

        <section className="space-y-4">
          <p className="text-[16px] font-semibold text-ink">공간 정보</p>

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
              value={name}
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

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[16px] font-semibold text-ink">사진</p>
              <p className="mt-1 text-[13px] text-ink-muted">순서를 바꾸면 첫 번째 사진이 썸네일이 돼요.</p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-outline-strong px-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface-soft"
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
            <p className="text-[12px] text-ink-muted">사진 업로드 중...</p>
          )}

          {photos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-outline-strong px-4 py-6 text-center text-[14px] text-ink-muted">
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
            disabled={!name.trim() || !pyeong.trim() || photos.length === 0}
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
          공간 삭제
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
