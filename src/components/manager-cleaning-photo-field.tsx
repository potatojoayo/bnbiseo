'use client'

import { useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, ImagePlusIcon, XIcon } from 'lucide-react'
import {
  type CleaningPhotoKind,
  type UploadedManagerCleaningImage,
  uploadManagerCleaningImage,
} from '@/lib/manager-cleaning-image-upload'
import { ApiError } from '@/lib/api-client'
import { Skeleton } from '@/components/ui/skeleton'

type ManagerCleaningPhotoFieldProps = {
  cleaningId: string
  propertySpaceId: string
  kind: CleaningPhotoKind
  title?: string
  emptyText?: string
  images: UploadedManagerCleaningImage[]
  onChange: (images: UploadedManagerCleaningImage[]) => void
  onError?: (message: string | null) => void
  readOnly?: boolean
}

export function ManagerCleaningPhotoField({
  cleaningId,
  propertySpaceId,
  kind,
  title = '청소 사진',
  emptyText = '첨부된 사진이 없어요.',
  images,
  onChange,
  onError,
  readOnly = false,
}: ManagerCleaningPhotoFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [pendingCount, setPendingCount] = useState(0)

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0 || readOnly) return

    setPendingCount(files.length)
    onError?.(null)

    try {
      const uploadedImages: UploadedManagerCleaningImage[] = []

      for (const file of Array.from(files)) {
        uploadedImages.push(await uploadManagerCleaningImage(cleaningId, file, { kind, propertySpaceId }))
      }

      onChange([...images, ...uploadedImages])
    } catch (error) {
      onError?.(error instanceof ApiError ? error.message : '사진 업로드에 실패했어요.')
    } finally {
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
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[14px] font-semibold text-ink">{title}</p>
        {!readOnly && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-outline-strong px-3 text-[12px] font-medium text-ink transition-colors hover:bg-surface-soft"
          >
            <ImagePlusIcon size={13} />
            사진 추가
          </button>
        )}
      </div>

      {!readOnly && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void handleFilesSelected(e.target.files)}
        />
      )}

      {images.length === 0 && pendingCount === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-strong px-4 py-5 text-center text-[13px] text-ink-muted">
          {emptyText}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div key={`${image.storagePath}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.previewUrl} alt="" className="h-full w-full object-cover" />
              {!readOnly && (
                <>
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
                </>
              )}
            </div>
          ))}
          {Array.from({ length: pendingCount }).map((_, index) => (
            <div key={`pending-${index}`} className="relative aspect-square overflow-hidden rounded-lg" aria-hidden="true">
              <Skeleton className="h-full w-full rounded-none" />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
