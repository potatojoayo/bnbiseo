'use client'

import { useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, ImagePlusIcon, XIcon } from 'lucide-react'
import {
  type AdminImageKind,
  type UploadedAdminImage,
  uploadAdminImage,
} from '@/lib/admin-image-upload'
import { ApiError } from '@/lib/api-client'
import { Skeleton } from '@/components/ui/skeleton'

type AdminImageUploadFieldProps = {
  propertyId: string
  kind: AdminImageKind
  images: UploadedAdminImage[]
  onChange: (images: UploadedAdminImage[]) => void
  title?: string
  description: string
  emptyText: string
  onError?: (message: string | null) => void
}

export function AdminImageUploadField({
  propertyId,
  kind,
  images,
  onChange,
  title = '사진',
  description,
  emptyText,
  onError,
}: AdminImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return

    setUploading(true)
    setPendingCount(files.length)
    onError?.(null)

    try {
      const uploadedImages: UploadedAdminImage[] = []

      for (const file of Array.from(files)) {
        uploadedImages.push(await uploadAdminImage(propertyId, kind, file))
      }

      onChange([...images, ...uploadedImages])
    } catch (error) {
      onError?.(error instanceof ApiError ? error.message : '사진 업로드에 실패했어요.')
    } finally {
      setUploading(false)
      setPendingCount(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removePhoto(index: number) {
    const target = images[index]
    if (target?.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(target.previewUrl)
    }
    onChange(images.filter((_, photoIndex) => photoIndex !== index))
  }

  function movePhoto(index: number, direction: 'left' | 'right') {
    const nextIndex = direction === 'left' ? index - 1 : index + 1
    if (nextIndex < 0 || nextIndex >= images.length) return

    const next = [...images]
    const [target] = next.splice(index, 1)
    next.splice(nextIndex, 0, target)
    onChange(next)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[16px] font-semibold text-ink">{title}</p>
          <p className="mt-1 text-[13px] text-ink-muted">{description}</p>
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

      {images.length === 0 && pendingCount === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-strong px-4 py-6 text-center text-[14px] text-ink-muted">
          {emptyText}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div key={`${image.storagePath}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.previewUrl} alt="" className="h-full w-full object-cover" />
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
                  disabled={index === images.length - 1}
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
          {Array.from({ length: pendingCount }).map((_, index) => (
            <div
              key={`pending-${index}`}
              className="relative aspect-square overflow-hidden rounded-lg"
              aria-hidden="true"
            >
              <Skeleton className="h-full w-full rounded-none" />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
