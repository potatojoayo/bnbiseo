'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  CalendarIcon,
  ChevronLeftIcon,
  ClockIcon,
  CreditCardIcon,
  HomeIcon,
  MapPinIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/api-client'
import {
  useInvalidateManager,
  useManagerMe,
  useManagerRepair,
} from '@/lib/hooks/use-manager'
import { RepairStatusBadge } from '@/components/repair-status-badge'
import { AssetCard } from '@/components/asset-card'
import { LoadingButton } from '@/components/ui/loading-button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { CompoundInput, FloatingInput, FloatingTextarea, CompoundField } from '@/components/ui/floating-input'
import { CalendarPicker } from '@/components/calendar-picker'
import { ALL_TIME_SLOTS, cn, formatDateLabel, formatTimeKorean, getAvailableTimeSlots, getDefaultTime } from '@/lib/utils'
import { calculateManagerPayout } from '@/lib/manager-payout'
import { uploadRepairCompletionImage, type UploadedRepairImage } from '@/lib/repair-image-upload'
import { CheckIcon } from 'lucide-react'
import { ReadOnlyPhotoGallery } from '@/components/read-only-photo-gallery'
import type { ManagerRepairDetail } from '@/lib/hooks/use-manager'

const ASSET_CATEGORY_LABELS: Record<ManagerRepairDetail['assets'][number]['category'], string> = {
  lighting: '조명',
  furniture: '가구',
  faucet: '수도/배관',
  boiler: '보일러',
  appliance: '가전',
  lock: '잠금장치',
  ac: '에어컨',
  washer: '세탁기',
  dryer: '건조기',
  vent: '환기',
  other: '기타',
}

export default function ManagerRepairDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data: repair, isLoading } = useManagerRepair(id)
  const { data: managerMe } = useManagerMe()
  const invalidate = useInvalidateManager()

  const [quoteOpen, setQuoteOpen] = useState(false)
  const [startingWork, setStartingWork] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [claimOpen, setClaimOpen] = useState(false)
  const [claiming, setClaiming] = useState(false)

  async function handleStart() {
    setStartingWork(true)
    try {
      await api.post(`/manager/repairs/${id}/start`)
      toast.success('작업을 시작했어요.')
      await invalidate.repairDetail(id)
      await invalidate.myRepairs()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '시작에 실패했어요.')
    } finally {
      setStartingWork(false)
    }
  }

  async function handleClaim() {
    setClaiming(true)
    try {
      await api.post(`/manager/repairs/${id}/claim`)
      toast.success('수리 요청을 맡았어요.')
      setClaimOpen(false)
      await Promise.all([
        invalidate.openRepairs(),
        invalidate.myRepairs(),
        invalidate.repairDetail(id),
      ])
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '요청을 가져오지 못했어요.')
    } finally {
      setClaiming(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-outline-dim border-t-ink-muted animate-spin" />
      </div>
    )
  }

  if (!repair) {
    return (
      <div className="flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-[18px] font-semibold text-ink mb-2">수리 요청을 찾을 수 없어요</h2>
        <Link href="/manager/repairs" className="mt-4 text-[14px] text-ink-muted underline underline-offset-2">
          목록으로
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast flex flex-col px-6 pt-6 pb-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center justify-center w-10 h-10 -ml-4 mb-3 rounded-full hover:bg-surface-soft transition-colors text-ink"
      >
        <ChevronLeftIcon size={32} />
      </button>
      <h1 className="text-[22px] font-semibold text-ink mb-6">수리 요청 상세</h1>

      <div className="mb-5">
        <RepairStatusBadge status={repair.status} className="text-[12px]" />
      </div>

      {/* 숙소 정보 */}
      <div className="rounded-xl border border-outline-dim px-4 py-4 flex flex-col gap-2.5 mb-4">
        <div className="flex items-center gap-2.5">
          <HomeIcon size={16} className="text-ink-muted shrink-0" strokeWidth={1.5} />
          <span className="text-[14px] text-ink font-medium">{repair.propertyName}</span>
        </div>
        {repair.propertyAddress && (
          <div className="flex items-center gap-2.5">
            <MapPinIcon size={16} className="text-ink-muted shrink-0" strokeWidth={1.5} />
            <span className="text-[13px] text-ink-muted">
              {repair.propertyAddress}
              {repair.propertyAddressDetail && ` ${repair.propertyAddressDetail}`}
            </span>
          </div>
        )}
      </div>

      {/* 일정 및 증상 */}
      <div className="rounded-xl border border-outline-dim px-4 py-4 flex flex-col gap-2.5 mb-4">
        <div className="flex items-center gap-2.5">
          <CalendarIcon size={16} className="text-ink-muted shrink-0" strokeWidth={1.5} />
          <span className="text-[14px] text-ink">
            {repair.scheduledDate
              ? `${formatDateLabel(repair.scheduledDate)} (확정)`
              : `희망 ${formatDateLabel(repair.preferredScheduledDate)}`}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <ClockIcon size={16} className="text-ink-muted shrink-0" strokeWidth={1.5} />
          <span className="text-[14px] text-ink">
            {formatTimeKorean(repair.scheduledTime ?? repair.preferredScheduledTime)}
          </span>
        </div>
        <div className="border-t border-outline-dim pt-2.5 mt-0.5">
          <p className="text-[12px] font-medium text-ink-muted mb-1">증상 설명</p>
          <p className="whitespace-pre-wrap text-[14px] text-ink leading-relaxed">
            {repair.description}
          </p>
        </div>
      </div>

      {/* 시설물 상세 (매니저 뷰 — 브랜드, 모델, 구매처) */}
      {repair.assets.length > 0 && (
        <section className="mb-4">
          <p className="px-1 mb-2 text-[13px] font-medium text-ink-muted">관련 시설물</p>
          <div className="flex flex-col gap-2">
            {repair.assets.map((asset) => (
              <AssetCard
                key={asset.id}
                name={asset.name}
                category={ASSET_CATEGORY_LABELS[asset.category]}
                location={asset.location}
                brand={asset.brand}
                modelNumber={asset.modelNumber}
                purchaseUrl={asset.purchaseUrl}
                notes={asset.notes}
                imageUrl={asset.photos[0]?.signedUrl ?? asset.photos[0]?.thumbnailSignedUrl ?? null}
                href={`/manager/repairs/${id}/assets/${asset.id}`}
                className="bg-white"
              />
            ))}
          </div>
        </section>
      )}

      {/* 요청 사진 */}
      {repair.photos.length > 0 && (
        <section className="mb-6">
          <ReadOnlyPhotoGallery
            title="첨부 사진"
            photos={repair.photos.map((photo) => ({
              id: photo.id,
              signedUrl: photo.signedUrl ?? photo.thumbnailSignedUrl,
            }))}
            disableCarousel
          />
        </section>
      )}

      {/* 견적서 (기존 발송된 것) */}
      {repair.quotedCost != null && (
        <div className="rounded-xl border border-outline-dim px-4 py-4 flex flex-col gap-2.5 mb-6">
          <div className="flex items-center gap-2.5">
            <CreditCardIcon size={16} className="text-ink-muted shrink-0" strokeWidth={1.5} />
            <span className="text-[14px] text-ink font-medium">
              정산 예정 {calculateManagerPayout(repair.quotedCost).toLocaleString()}원
            </span>
          </div>
          {repair.quoteNote && (
            <p className="border-t border-outline-dim pt-2.5 mt-0.5 whitespace-pre-wrap text-[13px] text-ink-muted leading-relaxed">
              {repair.quoteNote}
            </p>
          )}
        </div>
      )}

      {/* 완료 보고서 */}
      {repair.completionReport && (
        <section className="mb-6">
          <p className="px-1 mb-2 text-[13px] font-medium text-ink-muted">작성한 조치 보고서</p>
          <div className="space-y-3">
            {repair.completionReport.photos.length > 0 && (
              <div className="flex flex-col gap-3">
                {repair.completionReport.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-soft"
                  >
                    {(photo.signedUrl ?? photo.thumbnailSignedUrl) ? (
                      <Image
                        src={photo.signedUrl ?? photo.thumbnailSignedUrl!}
                        alt="조치 사진"
                        fill
                        sizes="100vw"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            <div className="rounded-xl border border-outline-dim bg-white p-4">
              <div>
                <p className="text-[12px] font-medium text-ink-muted mb-1">조치 내용</p>
                <p className="whitespace-pre-wrap text-[14px] text-ink leading-relaxed">
                  {repair.completionReport.actionNotes}
                </p>
              </div>
              {repair.completionReport.additionalNotes && (
                <>
                  <div className="my-4 border-t border-dashed border-outline-strong" />
                  <p className="text-[12px] font-medium text-ink-muted mb-1">추가 메모</p>
                  <p className="whitespace-pre-wrap text-[14px] text-ink leading-relaxed">
                    {repair.completionReport.additionalNotes}
                  </p>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 액션 버튼 */}
      {(() => {
        const currentManagerId = managerMe?.manager.id
        const isAssigned = !!currentManagerId && repair.managerId === currentManagerId
        const canClaim = repair.status === 'submitted' && repair.managerId === null

        if (canClaim) {
          return (
            <LoadingButton
              type="button"
              variant="primary"
              loading={false}
              onClick={() => setClaimOpen(true)}
            >
              배정받기
            </LoadingButton>
          )
        }

        if (!isAssigned) return null

        if (['submitted', 'quoted'].includes(repair.status)) {
          return (
            <LoadingButton
              type="button"
              variant="primary"
              loading={false}
              onClick={() => setQuoteOpen(true)}
            >
              {repair.status === 'submitted' ? '일정·견적 발송하기' : '견적 수정하기'}
            </LoadingButton>
          )
        }

        if (repair.status === 'confirmed') {
          return (
            <LoadingButton
              type="button"
              variant="primary"
              loading={startingWork}
              loadingText="시작 중..."
              onClick={handleStart}
            >
              작업 시작
            </LoadingButton>
          )
        }

        if (repair.status === 'in_progress' && !repair.completionReport) {
          return (
            <LoadingButton
              type="button"
              variant="primary"
              loading={false}
              onClick={() => setCompleteOpen(true)}
            >
              조치 보고서 작성
            </LoadingButton>
          )
        }

        if (['in_progress', 'completed'].includes(repair.status) && repair.completionReport) {
          return (
            <LoadingButton
              type="button"
              variant="primary"
              loading={false}
              onClick={() => setCompleteOpen(true)}
            >
              조치 보고서 수정
            </LoadingButton>
          )
        }

        return null
      })()}

      {/* 배정 확인 드로어 */}
      <Drawer open={claimOpen} onOpenChange={setClaimOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-ink">
                이 요청을 배정받을까요?
              </DrawerTitle>
            </DrawerHeader>
            <div className="space-y-4">
              <p className="text-[14px] leading-relaxed text-ink-muted">
                한 번 배정받은 요청은 비앤비서를 통해 일정·견적을 조율하고 견적서를 발송해야 해요.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setClaimOpen(false)}
                  className="h-12 rounded-xl border border-outline-dim px-4 py-3 text-[14px] font-medium text-ink"
                >
                  닫기
                </button>
                <LoadingButton
                  type="button"
                  variant="primary"
                  loading={claiming}
                  loadingText="배정 중..."
                  onClick={handleClaim}
                >
                  배정받기
                </LoadingButton>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* 견적 드로어 */}
      <QuoteDrawer
        open={quoteOpen}
        onOpenChange={setQuoteOpen}
        repairId={id}
        initialDate={repair.scheduledDate ?? repair.preferredScheduledDate}
        initialTime={repair.scheduledTime ?? repair.preferredScheduledTime}
        initialCost={repair.quotedCost}
        initialNote={repair.quoteNote}
        onSuccess={async () => {
          await invalidate.repairDetail(id)
          await invalidate.myRepairs()
        }}
      />

      {/* 완료 보고서 드로어 */}
      <CompleteReportDrawer
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        repairId={id}
        initialActionNotes={repair.completionReport?.actionNotes ?? ''}
        initialAdditionalNotes={repair.completionReport?.additionalNotes ?? ''}
        initialPhotos={(repair.completionReport?.photos ?? []).map((photo) => ({
          storagePath: photo.storagePath,
          thumbnailStoragePath: photo.thumbnailStoragePath,
          previewUrl: photo.signedUrl ?? photo.thumbnailSignedUrl ?? '',
        }))}
        onSuccess={async () => {
          await invalidate.repairDetail(id)
          await invalidate.myRepairs()
        }}
      />
    </div>
  )
}

function QuoteDrawer({
  open,
  onOpenChange,
  repairId,
  initialDate,
  initialTime,
  initialCost,
  initialNote,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  repairId: string
  initialDate: string
  initialTime: string
  initialCost: number | null
  initialNote: string | null
  onSuccess: () => void | Promise<void>
}) {
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState(initialTime)
  const [cost, setCost] = useState(initialCost ? String(initialCost) : '')
  const [note, setNote] = useState(initialNote || '')
  const [submitting, setSubmitting] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [timeOpen, setTimeOpen] = useState(false)

  const timeSlots = getAvailableTimeSlots(date)

  function handleDateSelect(newDate: string) {
    setDate(newDate)
    const slots = getAvailableTimeSlots(newDate)
    if (!slots.includes(time)) setTime(getDefaultTime(newDate))
    setTimeout(() => setDateOpen(false), 200)
  }

  function handleCostChange(value: string) {
    const digits = value.replace(/[^\d]/g, '')
    setCost(digits ? Number(digits).toLocaleString('ko-KR') : '')
  }

  async function handleSubmit() {
    const costNum = parseInt(cost.replace(/,/g, ''), 10)
    if (!costNum || costNum <= 0) {
      toast.error('견적 금액을 입력해주세요.')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/manager/repairs/${repairId}/quote`, {
        scheduledDate: date,
        scheduledTime: time,
        quotedCost: costNum,
        quoteNote: note || undefined,
      })
      toast.success('견적서를 발송했어요.')
      onOpenChange(false)
      await onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '발송에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <div className="w-full px-5 pb-8 max-h-[80dvh] overflow-y-auto">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-ink">
                일정·견적 발송
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-4">
              <CompoundInput>
                <button type="button" className="w-full text-left" onClick={() => setDateOpen(true)}>
                  <CompoundField label="방문 날짜" borderRadius="12px 12px 0 0">
                    <span className="block w-full text-[16px] text-ink">{formatDateLabel(date)}</span>
                  </CompoundField>
                </button>
                <button type="button" className="w-full text-left" onClick={() => setTimeOpen(true)}>
                  <CompoundField label="방문 시간" borderRadius="0 0 12px 12px">
                    <span className="block w-full text-[16px] text-ink">{formatTimeKorean(time)}</span>
                  </CompoundField>
                </button>
              </CompoundInput>

              <CompoundInput>
                <FloatingInput
                  label="견적 금액 (원)"
                  type="text"
                  inputMode="numeric"
                  value={cost}
                  onChange={(e) => handleCostChange(e.target.value)}
                  borderRadius="12px"
                />
              </CompoundInput>
              {(() => {
                const costNum = parseInt(cost.replace(/,/g, ''), 10)
                if (!costNum || costNum <= 0) return null
                return (
                  <p className="-mt-2 px-1 text-[12px] text-ink-muted">
                    정산 예정 {calculateManagerPayout(costNum).toLocaleString()}원 (부가세·플랫폼 수수료 20% 차감)
                  </p>
                )
              })()}

              <CompoundInput>
                <FloatingTextarea
                  label="견적 설명 (선택)"
                  placeholder="부품·공임 내역, 특이사항 등"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  borderRadius="12px"
                />
              </CompoundInput>

              <LoadingButton
                type="button"
                variant="primary"
                loading={submitting}
                loadingText="발송 중..."
                onClick={handleSubmit}
              >
                발송하기
              </LoadingButton>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={dateOpen} onOpenChange={setDateOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left px-4 pt-4 pb-2">
            <DrawerTitle className="text-[18px] font-semibold text-ink">날짜 선택</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <CalendarPicker selected={date} onSelect={handleDateSelect} />
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={timeOpen} onOpenChange={setTimeOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left px-4 pt-4 pb-2">
            <DrawerTitle className="text-[18px] font-semibold text-ink">시간 선택</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto flex-1 pb-safe">
            {ALL_TIME_SLOTS.map((t, i) => {
              const isSelected = t === time
              const isDisabled = !timeSlots.includes(t)
              return (
                <button
                  key={t}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return
                    setTime(t)
                    setTimeout(() => setTimeOpen(false), 200)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between py-3 px-4 text-[15px] transition-colors',
                    i > 0 && 'border-t border-outline-dim',
                    isDisabled
                      ? 'text-outline-strong cursor-default'
                      : isSelected
                        ? 'font-semibold text-ink'
                        : 'text-ink hover:bg-surface-soft active:bg-surface-dim',
                  )}
                >
                  <span>{formatTimeKorean(t)}</span>
                  {isSelected && !isDisabled && (
                    <span className="w-[20px] h-[20px] rounded-full bg-ink flex items-center justify-center shrink-0">
                      <CheckIcon size={12} strokeWidth={3} className="text-white" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

function CompleteReportDrawer({
  open,
  onOpenChange,
  repairId,
  initialActionNotes,
  initialAdditionalNotes,
  initialPhotos,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  repairId: string
  initialActionNotes: string
  initialAdditionalNotes: string
  initialPhotos: UploadedRepairImage[]
  onSuccess: () => void | Promise<void>
}) {
  const [actionNotes, setActionNotes] = useState(initialActionNotes)
  const [additionalNotes, setAdditionalNotes] = useState(initialAdditionalNotes)
  const [photos, setPhotos] = useState<UploadedRepairImage[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setActionNotes(initialActionNotes)
    setAdditionalNotes(initialAdditionalNotes)
    setPhotos(initialPhotos)
  }, [open, initialActionNotes, initialAdditionalNotes, initialPhotos])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    e.target.value = ''

    setUploading(true)
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast.error('이미지 파일만 업로드할 수 있어요.')
          continue
        }
        const uploaded = await uploadRepairCompletionImage(repairId, file)
        setPhotos((prev) => [...prev, uploaded])
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '사진 업로드에 실패했어요.')
    } finally {
      setUploading(false)
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!actionNotes.trim()) {
      toast.error('조치 내용을 입력해주세요.')
      return
    }
    if (photos.length === 0) {
      toast.error('조치 사진을 최소 1장 첨부해주세요.')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/manager/repairs/${repairId}/complete`, {
        actionNotes: actionNotes.trim(),
        additionalNotes: additionalNotes || undefined,
        photos: photos.map((p) => ({
          storagePath: p.storagePath,
          thumbnailStoragePath: p.thumbnailStoragePath,
        })),
      })
      toast.success('조치 보고서가 저장되었어요.')
      onOpenChange(false)
      await onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
          <div className="w-full px-5 pb-8 max-h-[85dvh] overflow-y-auto">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-ink">
                {initialActionNotes || initialPhotos.length > 0 || initialAdditionalNotes ? '조치 보고서 수정' : '조치 보고서 작성'}
              </DrawerTitle>
            </DrawerHeader>
          <div className="flex flex-col gap-4">
            <div>
              <p className="px-1 mb-2 text-[13px] font-medium text-ink-muted">조치 사진 (최소 1장, 필수)</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map((photo, i) => (
                  <div key={i} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-outline-dim">
                    <Image src={photo.previewUrl} alt={`사진 ${i + 1}`} fill sizes="80px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                    >
                      <XIcon size={12} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-outline-strong text-ink-muted transition-colors hover:bg-surface-soft disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
                  ) : (
                    <>
                      <PlusIcon size={20} />
                      <span className="mt-0.5 text-[11px]">사진 추가</span>
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <CompoundInput>
              <FloatingTextarea
                label="조치 내용 (필수)"
                placeholder="어떤 문제를 어떻게 해결했는지 설명해주세요"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                borderRadius="12px"
              />
            </CompoundInput>

            <CompoundInput>
              <FloatingTextarea
                label="추가 메모 (선택)"
                placeholder="교체한 부품, 권고사항 등"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                borderRadius="12px"
              />
            </CompoundInput>

            <LoadingButton
              type="button"
              variant="primary"
              loading={submitting}
              loadingText="저장 중..."
              disabled={uploading}
              onClick={handleSubmit}
            >
              저장하기
            </LoadingButton>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
