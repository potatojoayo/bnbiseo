'use client'

import { useState } from 'react'
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

type SpaceCategory = 'living_room' | 'bedroom' | 'bathroom' | 'veranda' | 'exterior' | 'other'

type SpacePhoto = {
  id?: string
  storagePath: string
  thumbnailStoragePath: string
  previewUrl: string
}

type SpaceDetail = {
  id: string
  category: SpaceCategory
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
}

type RegistrationCache = {
  spaces: SpaceDetail[]
}

const CATEGORY_OPTIONS: Array<{ value: SpaceCategory; label: string }> = [
  { value: 'living_room', label: '거실' },
  { value: 'bedroom', label: '침실' },
  { value: 'bathroom', label: '화장실' },
  { value: 'veranda', label: '베란다' },
  { value: 'exterior', label: '외부' },
  { value: 'other', label: '기타' },
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
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [category, setCategory] = useState<SpaceCategory>(space.category)
  const [name, setName] = useState(space.name)
  const [pyeong, setPyeong] = useState(String(space.pyeong))
  const [notes, setNotes] = useState(space.notes || '')
  const [photos, setPhotos] = useState<SpacePhoto[]>(
    space.photos.map((photo) => ({
      id: photo.id,
      storagePath: photo.storagePath,
      thumbnailStoragePath: photo.thumbnailStoragePath,
      previewUrl: photo.signedUrl || photo.thumbnailSignedUrl || '',
    })),
  )

  const updateMutation = useMutation({
    mutationFn: (payload: {
      category: SpaceCategory
      name: string
      pyeong: string
      notes?: string
      photos: Array<{ storagePath: string; thumbnailStoragePath: string }>
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
                        name: variables.name,
                        pyeong: Number(variables.pyeong),
                        notes: variables.notes || null,
                        photos: variables.photos.map((photo, index) => ({
                          id: `${space.id}-${index}`,
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

  async function handleSubmit() {
    setSaving(true)
    setMessage(null)

    try {
      await updateMutation.mutateAsync({
        category,
        name,
        pyeong,
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

      router.replace(`/admin/properties/${propertyId}/spaces/${space.id}`)
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
      router.replace(`/admin/properties/${propertyId}`)
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

        <AdminImageUploadField
          propertyId={propertyId}
          kind="spaces"
          images={photos as UploadedAdminImage[]}
          onChange={(nextImages) => setPhotos(nextImages)}
          description="순서를 바꾸면 첫 번째 사진이 썸네일이 됩니다."
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
