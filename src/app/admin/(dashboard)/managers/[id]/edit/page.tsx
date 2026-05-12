'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CameraIcon } from 'lucide-react'
import { MobileBackButton } from '@/components/mobile-back-button'
import { SiteHeader } from '@/components/site-header'
import { api, ApiError, supabase } from '@/lib/api-client'
import { useAdminManagers, useInvalidateAdmin } from '@/lib/hooks/use-admin'
import { CompoundInput, FloatingInput } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading-button'
import { AvatarWithSkeleton } from '@/components/ui/avatar-with-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

const MANAGER_PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120' fill='none'%3E%3Crect width='120' height='120' rx='60' fill='%23F4F4F4'/%3E%3Ccircle cx='60' cy='46' r='18' fill='%23C8C8C8'/%3E%3Cpath d='M28 94c4-16 18-26 32-26s28 10 32 26' fill='%23C8C8C8'/%3E%3C/svg%3E"

async function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('이미지를 불러오지 못했어요.'))
    }
    image.src = objectUrl
  })
}

async function createThumbnailFile(file: File, size = 320) {
  const image = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('썸네일을 만들 수 없어요.')
  }

  const sourceSize = Math.min(image.width, image.height)
  const sourceX = (image.width - sourceSize) / 2
  const sourceY = (image.height - sourceSize) / 2

  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.8)
  })

  if (!blob) {
    throw new Error('썸네일을 만들 수 없어요.')
  }

  return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'avatar'}.jpg`, {
    type: 'image/jpeg',
  })
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export default function AdminManagerEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const invalidate = useInvalidateAdmin()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { data: managers = [], isLoading } = useAdminManagers()
  const manager = useMemo(() => managers.find((item) => item.id === id) ?? null, [id, managers])

  const [name, setName] = useState(manager?.name ?? '')
  const [phone, setPhone] = useState(formatPhoneNumber(manager?.phone ?? ''))
  const [memo, setMemo] = useState(manager?.memo ?? '')
  const [avatarStoragePath, setAvatarStoragePath] = useState(manager?.avatarStoragePath ?? '')
  const [avatarThumbnailStoragePath, setAvatarThumbnailStoragePath] = useState(manager?.avatarThumbnailStoragePath ?? '')
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(manager?.avatarSignedUrl ?? manager?.avatarThumbnailSignedUrl ?? '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!manager) return
    setName(manager.name)
    setPhone(formatPhoneNumber(manager.phone))
    setMemo(manager.memo ?? '')
    setAvatarStoragePath(manager.avatarStoragePath ?? '')
    setAvatarThumbnailStoragePath(manager.avatarThumbnailStoragePath ?? '')
    setAvatarPreviewUrl(manager.avatarSignedUrl ?? manager.avatarThumbnailSignedUrl ?? '')
  }, [manager])

  async function handleAvatarChange(file: File | null) {
    if (!file) return

    setUploadingAvatar(true)
    setMessage(null)
    try {
      const signed = await api.post<{
        original: { path: string; token: string }
        thumbnail: { path: string; token: string }
      }>('/admin/managers/upload-url', {
        fileName: file.name,
      })
      const thumbnailFile = await createThumbnailFile(file)
      const [{ error: originalError }, { error: thumbnailError }] = await Promise.all([
        supabase.storage.from('images').uploadToSignedUrl(signed.original.path, signed.original.token, file),
        supabase.storage.from('images').uploadToSignedUrl(signed.thumbnail.path, signed.thumbnail.token, thumbnailFile),
      ])

      if (originalError || thumbnailError) {
        throw new Error(originalError?.message || thumbnailError?.message || '프로필 사진 업로드에 실패했어요.')
      }

      if (avatarPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }

      setAvatarStoragePath(signed.original.path)
      setAvatarThumbnailStoragePath(signed.thumbnail.path)
      setAvatarPreviewUrl(URL.createObjectURL(file))
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.message)
      } else if (error instanceof Error) {
        setMessage(error.message)
      } else {
        setMessage('프로필 사진 업로드에 실패했어요.')
      }
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSave() {
    if (!manager) return
    setSaving(true)
    setMessage(null)
    try {
      await api.patch(`/admin/managers/${manager.id}`, {
        name,
        phone,
        memo: memo || undefined,
        avatarStoragePath,
        avatarThumbnailStoragePath,
      })
      invalidate.managers()
      invalidate.stats()
      router.back()
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.message)
      } else {
        setMessage('매니저 수정에 실패했어요.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  if (!manager) {
    return (
      <div className="flex items-center justify-center px-6 text-center text-[14px] text-ink-muted">
        매니저를 찾을 수 없어요.
      </div>
    )
  }

  return (
    <>
      <SiteHeader title="매니저 수정" />
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 p-6 max-md:animate-fade-up-fast max-md:p-5">
        <div className="-mb-1 md:hidden">
          <MobileBackButton href="/admin/managers" mode="back" />
        </div>

        <h1 className="text-[22px] font-semibold text-ink">매니저 수정</h1>

        <div className="space-y-4">
          <section className="flex justify-center pb-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar || saving}
              className="group relative rounded-full disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="프로필 사진 변경"
            >
              {uploadingAvatar ? (
                <Skeleton className="size-32 rounded-full bg-outline-strong" />
              ) : (
                <AvatarWithSkeleton
                  key={avatarPreviewUrl || MANAGER_PLACEHOLDER_IMAGE}
                  src={avatarPreviewUrl || MANAGER_PLACEHOLDER_IMAGE}
                  className="size-32"
                  fallback={name.trim().charAt(0) || 'M'}
                  fallbackClassName="bg-surface-soft text-[18px] font-semibold text-ink-muted"
                />
              )}
              <span className="absolute inset-0 hidden items-center justify-center rounded-full bg-black/35 text-white transition-opacity md:flex md:opacity-0 md:group-hover:opacity-100">
                <CameraIcon size={18} />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleAvatarChange(e.target.files?.[0] ?? null)}
            />
          </section>

          <CompoundInput>
            <FloatingInput
              label="이름"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              borderRadius="12px 12px 0 0"
            />
            <FloatingInput
              label="전화번호"
              inputMode="numeric"
              placeholder="010-1234-5678"
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              borderRadius="0 0 12px 12px"
            />
          </CompoundInput>

          <CompoundInput>
            <FloatingInput
              label="메모 (선택)"
              placeholder="간단한 메모를 남겨주세요"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              borderRadius="12px"
            />
          </CompoundInput>

          {message && (
            <p className="text-[13px] text-destructive">{message}</p>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <LoadingButton
            type="button"
            variant="primary"
            loading={saving}
            loadingText="저장 중..."
            disabled={!name || !phone || !avatarStoragePath || !avatarThumbnailStoragePath || uploadingAvatar}
            onClick={handleSave}
          >
            저장하기
          </LoadingButton>
        </div>
      </div>
    </>
  )
}
