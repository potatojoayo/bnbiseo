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

export type PairedBeforePhoto = {
  id: string
  sortOrder: number
  signedUrl: string | null
  thumbnailSignedUrl: string | null
}

type ManagerPairedAfterFieldProps = {
  cleaningId: string
  propertySpaceId: string
  beforePhotos: PairedBeforePhoto[]
  afterBySlot: Record<number, UploadedManagerCleaningImage>
  readOnly?: boolean
  title?: string
  onChange: (next: Record<number, UploadedManagerCleaningImage>) => void
  onError?: (message: string | null) => void
  onOpenLightbox?: (slot: number, kind: 'before' | 'after') => void
}

export function ManagerPairedAfterField({
  cleaningId,
  propertySpaceId,
  beforePhotos,
  afterBySlot,
  readOnly = false,
  title = '청소 사진',
  onChange,
  onError,
  onOpenLightbox,
}: ManagerPairedAfterFieldProps) {
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const [pendingSlot, setPendingSlot] = useState<number | null>(null)

  const sortedBefore = [...beforePhotos].sort((a, b) => a.sortOrder - b.sortOrder)

  async function handleFile(slot: number, file: File | null) {
    if (!file || readOnly) return
    setPendingSlot(slot)
    onError?.(null)
    try {
      const uploaded = await uploadManagerCleaningImage(cleaningId, file, {
        kind: 'after',
        propertySpaceId,
      })
      onChange({ ...afterBySlot, [slot]: uploaded })
    } catch (error) {
      onError?.(error instanceof ApiError ? error.message : '사진 업로드에 실패했어요.')
    } finally {
      setPendingSlot(null)
      const input = inputRefs.current[slot]
      if (input) input.value = ''
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-semibold text-ink">{title}</p>
        {!readOnly && (
          <p className="text-[11px] text-ink-muted">청소 전 사진과 같은 각도로 찍어주세요</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {sortedBefore.map((before, index) => {
          const slot = before.sortOrder
          const beforeUrl = before.thumbnailSignedUrl || before.signedUrl
          const after = afterBySlot[slot]
          const isPending = pendingSlot === slot
          const slotLabel = `#${index + 1}`
          return (
            <div key={before.id} className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <p className="text-[11px] text-ink-muted">청소 전 {slotLabel}</p>
                {beforeUrl ? (
                  <button
                    type="button"
                    onClick={() => onOpenLightbox?.(slot, 'before')}
                    disabled={!onOpenLightbox}
                    className="relative block aspect-square w-full overflow-hidden rounded-lg bg-surface-soft transition-transform hover:scale-[1.02] disabled:cursor-default disabled:hover:scale-100"
                  >
                    <ImageWithSkeleton src={beforeUrl} alt="" fill sizes="50vw" className="object-cover" />
                  </button>
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-surface-soft text-[11px] text-ink-faint">
                    사진 없음
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-[11px] text-ink-muted">청소 후 {slotLabel}</p>
                <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-soft">
                  {after ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenLightbox?.(slot, 'after')}
                        disabled={!onOpenLightbox}
                        className="block h-full w-full disabled:cursor-default"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={after.previewUrl} alt="" className="h-full w-full object-cover" />
                      </button>
                      {!readOnly && (
                        <>
                          <input
                            ref={(el) => { inputRefs.current[slot] = el }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => void handleFile(slot, e.target.files?.[0] ?? null)}
                          />
                          <button
                            type="button"
                            onClick={() => inputRefs.current[slot]?.click()}
                            className="absolute right-1 top-1 inline-flex h-7 items-center gap-1 rounded-full bg-black/60 px-2 text-[11px] font-medium text-white"
                            aria-label="다시 업로드"
                          >
                            <RefreshCwIcon size={12} />
                            다시
                          </button>
                        </>
                      )}
                    </>
                  ) : isPending ? (
                    <Skeleton className="h-full w-full rounded-none" />
                  ) : !readOnly ? (
                    <>
                      <input
                        ref={(el) => { inputRefs.current[slot] = el }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => void handleFile(slot, e.target.files?.[0] ?? null)}
                      />
                      <button
                        type="button"
                        onClick={() => inputRefs.current[slot]?.click()}
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
            </div>
          )
        })}
      </div>
    </section>
  )
}
