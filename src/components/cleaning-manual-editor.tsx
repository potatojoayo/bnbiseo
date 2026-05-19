'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ImagePlusIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api-client'

export type EditorPhoto = {
  storagePath: string
  thumbnailStoragePath: string
  previewUrl: string
}

export type EditorInitialStep = {
  id?: string
  title: string
  description: string | null
  photos: Array<{
    storagePath: string
    thumbnailStoragePath: string
    signedUrl: string | null
    thumbnailSignedUrl: string | null
  }>
}

export type CleaningManualSavePayload = {
  steps: Array<{
    id?: string
    title: string
    description: string | null
    photos: Array<{ storagePath: string; thumbnailStoragePath: string }>
  }>
}

type StepDraft = {
  id?: string
  localId: string
  title: string
  description: string
  photos: EditorPhoto[]
}

type CleaningManualEditorProps = {
  propertyName: string
  initialSteps: EditorInitialStep[]
  uploadImage: (file: File) => Promise<EditorPhoto>
  onSave: (payload: CleaningManualSavePayload) => Promise<void>
  isSaving: boolean
  cancelHref: string
  description?: string
}

function makeLocalId() {
  return crypto.randomUUID()
}

export function CleaningManualEditor({
  propertyName,
  initialSteps,
  uploadImage,
  onSave,
  isSaving,
  cancelHref,
  description,
}: CleaningManualEditorProps) {
  const router = useRouter()
  const [steps, setSteps] = useState<StepDraft[]>(() =>
    initialSteps.map((step) => ({
      id: step.id,
      localId: makeLocalId(),
      title: step.title,
      description: step.description ?? '',
      photos: step.photos.map((photo) => ({
        storagePath: photo.storagePath,
        thumbnailStoragePath: photo.thumbnailStoragePath,
        previewUrl: photo.signedUrl || photo.thumbnailSignedUrl || '',
      })),
    })),
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const seededRef = useRef(false)

  useEffect(() => {
    if (seededRef.current) return
    if (initialSteps.length > 0) seededRef.current = true
  }, [initialSteps])

  function updateStep(localId: string, patch: Partial<StepDraft>) {
    setSteps((previous) => previous.map((step) => (step.localId === localId ? { ...step, ...patch } : step)))
  }

  function addStep() {
    setSteps((previous) => [
      ...previous,
      { localId: makeLocalId(), title: '', description: '', photos: [] },
    ])
  }

  function removeStep(localId: string) {
    setSteps((previous) => previous.filter((step) => step.localId !== localId))
  }

  function moveStep(localId: string, direction: 'up' | 'down') {
    setSteps((previous) => {
      const index = previous.findIndex((step) => step.localId === localId)
      if (index < 0) return previous
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= previous.length) return previous
      const next = [...previous]
      const [removed] = next.splice(index, 1)
      next.splice(target, 0, removed)
      return next
    })
  }

  async function handleSave() {
    setErrorMessage(null)
    const trimmed = steps.map((step) => ({ ...step, title: step.title.trim() }))
    const invalid = trimmed.find((step) => !step.title)
    if (invalid) {
      setErrorMessage('모든 단계에 제목을 입력해주세요.')
      return
    }
    try {
      await onSave({
        steps: trimmed.map((step) => ({
          id: step.id,
          title: step.title,
          description: step.description.trim() || null,
          photos: step.photos.map((photo) => ({
            storagePath: photo.storagePath,
            thumbnailStoragePath: photo.thumbnailStoragePath,
          })),
        })),
      })
    } catch (caught) {
      setErrorMessage(caught instanceof ApiError ? caught.message : '매뉴얼을 저장하지 못했어요.')
    }
  }

  return (
    <>
      <section>
        <p className="text-[22px] font-semibold text-ink">{propertyName}</p>
        <p className="mt-1 text-[14px] text-ink-muted">
          {description ?? '청소 매니저가 따라할 단계별 매뉴얼을 작성해주세요. 각 단계마다 사진과 설명을 추가할 수 있어요.'}
        </p>
      </section>

      {steps.length === 0 && (
        <div className="rounded-xl border border-dashed border-outline-strong px-4 py-8 text-center text-[14px] text-ink-muted">
          아직 등록된 단계가 없어요. 아래 버튼으로 첫 단계를 추가해보세요.
        </div>
      )}

      <ol className="flex flex-col gap-4">
        {steps.map((step, index) => (
          <StepEditor
            key={step.localId}
            index={index}
            total={steps.length}
            step={step}
            uploadImage={uploadImage}
            onChange={(patch) => updateStep(step.localId, patch)}
            onRemove={() => removeStep(step.localId)}
            onMoveUp={() => moveStep(step.localId, 'up')}
            onMoveDown={() => moveStep(step.localId, 'down')}
            onError={setErrorMessage}
          />
        ))}
      </ol>

      <button
        type="button"
        onClick={addStep}
        className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-outline-strong text-[14px] font-medium text-ink-muted transition-colors hover:bg-surface-soft"
      >
        <PlusIcon size={16} />
        단계 추가
      </button>

      {errorMessage && <p className="text-center text-[13px] text-danger">{errorMessage}</p>}

      <div className="flex flex-col gap-3">
        <LoadingButton
          type="button"
          onClick={() => void handleSave()}
          loading={isSaving}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-ink text-[15px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
        >
          저장하기
        </LoadingButton>
        <button
          type="button"
          onClick={() => router.replace(cancelHref)}
          className="w-full text-center text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
        >
          취소
        </button>
      </div>
    </>
  )
}

function StepEditor({
  index,
  total,
  step,
  uploadImage,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onError,
}: {
  index: number
  total: number
  step: StepDraft
  uploadImage: (file: File) => Promise<EditorPhoto>
  onChange: (patch: Partial<StepDraft>) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onError: (message: string | null) => void
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setPendingCount(files.length)
    onError(null)
    try {
      const uploaded: EditorPhoto[] = []
      for (const file of Array.from(files)) {
        const result = await uploadImage(file)
        uploaded.push(result)
      }
      onChange({ photos: [...step.photos, ...uploaded] })
    } catch (caught) {
      onError(caught instanceof ApiError ? caught.message : '사진 업로드에 실패했어요.')
    } finally {
      setUploading(false)
      setPendingCount(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removePhoto(photoIndex: number) {
    const target = step.photos[photoIndex]
    if (target?.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(target.previewUrl)
    }
    onChange({ photos: step.photos.filter((_, photoIdx) => photoIdx !== photoIndex) })
  }

  function movePhoto(photoIndex: number, direction: 'left' | 'right') {
    const nextIndex = direction === 'left' ? photoIndex - 1 : photoIndex + 1
    if (nextIndex < 0 || nextIndex >= step.photos.length) return
    const next = [...step.photos]
    const [removed] = next.splice(photoIndex, 1)
    next.splice(nextIndex, 0, removed)
    onChange({ photos: next })
  }

  return (
    <li className="rounded-2xl border border-outline-dim p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex h-7 min-w-7 items-center justify-center rounded-full bg-ink px-2 text-[13px] font-semibold text-white">
          {index + 1}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-soft disabled:opacity-30"
            aria-label="위로 이동"
          >
            <ArrowUpIcon size={14} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-soft disabled:opacity-30"
            aria-label="아래로 이동"
          >
            <ArrowDownIcon size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
            aria-label="단계 삭제"
          >
            <Trash2Icon size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={step.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="단계 제목 (예: 침구류 세탁하기)"
          className="block w-full rounded-lg border border-outline-strong bg-white px-3 py-2.5 text-[16px] font-medium text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
          maxLength={200}
        />
        <textarea
          value={step.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="구체적인 작업 방법이나 주의사항을 적어주세요. (선택)"
          rows={3}
          className="block w-full resize-y rounded-lg border border-outline-strong bg-white px-3 py-2.5 text-[16px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
          maxLength={2000}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-ink">사진</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-outline-strong px-2.5 text-[12px] font-medium text-ink transition-colors hover:bg-surface-soft disabled:opacity-60"
          >
            <ImagePlusIcon size={13} />
            사진 추가
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        {step.photos.length === 0 && pendingCount === 0 ? (
          <div className="rounded-lg border border-dashed border-outline-strong px-3 py-4 text-center text-[12px] text-ink-muted">
            아직 등록된 사진이 없어요.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {step.photos.map((photo, photoIndex) => (
              <div
                key={`${photo.storagePath}-${photoIndex}`}
                className="group relative aspect-square overflow-hidden rounded-lg shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />
                <div className="absolute bottom-1 left-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => movePhoto(photoIndex, 'left')}
                    disabled={photoIndex === 0}
                    className="rounded-full bg-black/60 p-1 text-white disabled:opacity-40"
                    aria-label="이전 순서로 이동"
                  >
                    <ChevronLeftIcon size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => movePhoto(photoIndex, 'right')}
                    disabled={photoIndex === step.photos.length - 1}
                    className="rounded-full bg-black/60 p-1 text-white disabled:opacity-40"
                    aria-label="다음 순서로 이동"
                  >
                    <ChevronRightIcon size={11} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto(photoIndex)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                  aria-label="사진 삭제"
                >
                  <XIcon size={11} />
                </button>
              </div>
            ))}
            {Array.from({ length: pendingCount }).map((_, pendingIndex) => (
              <div
                key={`pending-${pendingIndex}`}
                className="relative aspect-square overflow-hidden rounded-lg"
                aria-hidden="true"
              >
                <Skeleton className="h-full w-full rounded-none" />
              </div>
            ))}
          </div>
        )}
      </div>
    </li>
  )
}
