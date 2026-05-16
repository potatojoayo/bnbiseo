'use client'

import { useRef, useState } from 'react'
import { ImagePlusIcon, RefreshCwIcon } from 'lucide-react'
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton'
import { Skeleton } from '@/components/ui/skeleton'
import {
  uploadManagerCleaningImage,
  type UploadedManagerCleaningImage,
} from '@/lib/manager-cleaning-image-upload'
import { ApiError } from '@/lib/api-client'

type AcAsset = {
  id: string
  name: string
  location: string
}

type ManagerAcPhotoFieldProps = {
  cleaningId: string
  asset: AcAsset
  beforeImage: UploadedManagerCleaningImage | null
  afterImage: UploadedManagerCleaningImage | null
  canEditBefore: boolean
  canEditAfter: boolean
  showAfter: boolean
  onBeforeChange: (image: UploadedManagerCleaningImage | null) => void
  onAfterChange: (image: UploadedManagerCleaningImage | null) => void
  onError?: (message: string | null) => void
  onOpenLightbox?: (kind: 'before' | 'after') => void
}

export function ManagerAcPhotoField({
  cleaningId,
  asset,
  beforeImage,
  afterImage,
  canEditBefore,
  canEditAfter,
  showAfter,
  onBeforeChange,
  onAfterChange,
  onError,
  onOpenLightbox,
}: ManagerAcPhotoFieldProps) {
  const beforeInputRef = useRef<HTMLInputElement | null>(null)
  const afterInputRef = useRef<HTMLInputElement | null>(null)
  const [pending, setPending] = useState<'before' | 'after' | null>(null)

  async function upload(file: File | null, kind: 'before' | 'after') {
    if (!file) return
    setPending(kind)
    onError?.(null)
    try {
      const uploaded = await uploadManagerCleaningImage(cleaningId, file, {
        kind,
        propertyAssetId: asset.id,
      })
      if (kind === 'before') onBeforeChange(uploaded)
      else onAfterChange(uploaded)
    } catch (error) {
      onError?.(error instanceof ApiError ? error.message : '사진 업로드에 실패했어요.')
    } finally {
      setPending(null)
      const ref = kind === 'before' ? beforeInputRef : afterInputRef
      if (ref.current) ref.current.value = ''
    }
  }

  return (
    <div className="rounded-xl border border-outline-dim p-4 space-y-3">
      <div>
        <p className="text-[14px] font-semibold text-ink">{asset.name}</p>
        <p className="mt-0.5 text-[12px] text-ink-muted">{asset.location}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Before */}
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-ink-muted">청소 전</p>
          <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-soft">
            {beforeImage ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenLightbox?.('before')}
                  disabled={!onOpenLightbox}
                  className="block h-full w-full disabled:cursor-default"
                >
                  {beforeImage.previewUrl.startsWith('blob:') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={beforeImage.previewUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageWithSkeleton src={beforeImage.previewUrl} alt="" fill sizes="50vw" className="object-cover" />
                  )}
                </button>
                {canEditBefore && (
                  <>
                    <input
                      ref={beforeInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void upload(e.target.files?.[0] ?? null, 'before')}
                    />
                    <button
                      type="button"
                      onClick={() => beforeInputRef.current?.click()}
                      className="absolute right-1 top-1 inline-flex h-7 items-center gap-1 rounded-full bg-black/60 px-2 text-[11px] font-medium text-white"
                      aria-label="다시 업로드"
                    >
                      <RefreshCwIcon size={12} />
                      다시
                    </button>
                  </>
                )}
              </>
            ) : pending === 'before' ? (
              <Skeleton className="h-full w-full rounded-none" />
            ) : canEditBefore ? (
              <>
                <input
                  ref={beforeInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void upload(e.target.files?.[0] ?? null, 'before')}
                />
                <button
                  type="button"
                  onClick={() => beforeInputRef.current?.click()}
                  className="flex h-full w-full flex-col items-center justify-center gap-1.5 border border-dashed border-outline-strong text-[12px] text-ink-muted transition-colors hover:bg-surface-soft"
                >
                  <ImagePlusIcon size={18} />
                  사진 업로드
                </button>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] text-ink-faint">
                미등록
              </div>
            )}
          </div>
        </div>

        {/* After */}
        {showAfter && (
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-ink-muted">청소 후</p>
            <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-soft">
              {afterImage ? (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenLightbox?.('after')}
                    disabled={!onOpenLightbox}
                    className="block h-full w-full disabled:cursor-default"
                  >
                    {afterImage.previewUrl.startsWith('blob:') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={afterImage.previewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageWithSkeleton src={afterImage.previewUrl} alt="" fill sizes="50vw" className="object-cover" />
                    )}
                  </button>
                  {canEditAfter && (
                    <>
                      <input
                        ref={afterInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => void upload(e.target.files?.[0] ?? null, 'after')}
                      />
                      <button
                        type="button"
                        onClick={() => afterInputRef.current?.click()}
                        className="absolute right-1 top-1 inline-flex h-7 items-center gap-1 rounded-full bg-black/60 px-2 text-[11px] font-medium text-white"
                        aria-label="다시 업로드"
                      >
                        <RefreshCwIcon size={12} />
                        다시
                      </button>
                    </>
                  )}
                </>
              ) : pending === 'after' ? (
                <Skeleton className="h-full w-full rounded-none" />
              ) : canEditAfter ? (
                <>
                  <input
                    ref={afterInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void upload(e.target.files?.[0] ?? null, 'after')}
                  />
                  <button
                    type="button"
                    onClick={() => afterInputRef.current?.click()}
                    className="flex h-full w-full flex-col items-center justify-center gap-1.5 border border-dashed border-outline-strong text-[12px] text-ink-muted transition-colors hover:bg-surface-soft"
                  >
                    <ImagePlusIcon size={18} />
                    사진 업로드
                  </button>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[11px] text-ink-faint">
                  미등록
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
