'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeftIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CreditCardIcon,
  HomeIcon,
  PhoneIcon,
  UserIcon,
} from 'lucide-react'
import { CleaningReportReadOnly } from '@/components/cleaning-report-read-only'
import { useCleaningRequest, useCleaningReport, useInvalidateCleaning } from '@/lib/hooks/use-cleaning'
import { formatDateLabel, formatTimeKorean, cn } from '@/lib/utils'
import { api } from '@/lib/api-client'
import { LoadingButton } from '@/components/ui/loading-button'
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton'
import { ReadOnlyPhotoGallery } from '@/components/read-only-photo-gallery'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { CleaningStatusBadge, getCleaningStatusLabel, type CleaningStatus } from '@/components/cleaning-status-badge'

const STATUS_CONFIG: Record<CleaningStatus, { label: string; step: number }> = {
  pending_payment: { label: getCleaningStatusLabel('pending_payment'), step: 0 },
  pending: { label: getCleaningStatusLabel('pending'), step: 1 },
  confirmed: { label: getCleaningStatusLabel('confirmed'), step: 2 },
  in_progress: { label: getCleaningStatusLabel('in_progress'), step: 3 },
  completed: { label: getCleaningStatusLabel('completed'), step: 4 },
  cancelled: { label: getCleaningStatusLabel('cancelled'), step: 0 },
}

const PROCESS_STEPS = [
  { num: 1, title: '결제 완료', desc: '청소 요청과 결제가 완료되었어요.' },
  { num: 2, title: '매니저 배정', desc: '비앤비서 전문 매니저가 배정되면 알림을 보내드려요.' },
  { num: 3, title: '호텔식 청소 + 시설 점검', desc: '호텔식 침구 세팅과 15항목 시설 점검을 진행해요.' },
  { num: 4, title: '점검 리포트 수신', desc: '청소 완료 후 사진과 함께 시설 점검 리포트를 받아요.' },
]

export default function CleaningDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data: cleaning, isLoading } = useCleaningRequest(id)
  const { data: reportData } = useCleaningReport(id)
  const invalidateCleaning = useInvalidateCleaning()

  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [currentTime] = useState(() => Date.now())

  async function handleCancel() {
    setCancelling(true)
    try {
      await api.post(`/cleaning/${id}/cancel`)
      await invalidateCleaning()
      router.replace(`/cleaning/${id}/cancelled`)
    } catch {
      setCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-80px)]">
        <div className="w-6 h-6 rounded-full border-2 border-outline-dim border-t-ink-muted animate-spin" />
      </div>
    )
  }

  if (!cleaning) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-80px)] px-6 text-center">
        <h2 className="text-[18px] font-semibold text-ink mb-2">
          요청을 찾을 수 없어요
        </h2>
        <Link
          href="/home"
          className="mt-4 text-[14px] text-ink-muted underline underline-offset-2"
        >
          홈으로
        </Link>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[cleaning.status as CleaningStatus]
  const currentStep = statusConfig?.step ?? 0
  const showManagerSection = ['confirmed', 'in_progress', 'completed'].includes(cleaning.status)

  // 취소 정책: pending 전액 환불, confirmed 24시간 전까지만
  const scheduledAt = new Date(`${cleaning.scheduledDate}T${cleaning.scheduledTime}:00+09:00`)
  const hoursUntil = (scheduledAt.getTime() - currentTime) / (1000 * 60 * 60)
  const canCancel = cleaning.status === 'pending' || (cleaning.status === 'confirmed' && hoursUntil >= 24)
  const isFullRefund = cleaning.status === 'pending'
  const cleaningPhotos = cleaning.cleaningPhotos.map((photo) => ({
    id: photo.id,
    signedUrl: photo.signedUrl ?? photo.thumbnailSignedUrl,
  }))

  return (
    <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col px-6 pt-6 pb-10">
      {/* Header */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center justify-center w-10 h-10 -ml-4 mb-3 rounded-full hover:bg-surface-soft transition-colors text-ink"
      >
        <ChevronLeftIcon size={32} />
      </button>
      <h1 className="text-[22px] font-semibold text-ink mb-6">
        청소 요청 상세
      </h1>

      {/* Status badge */}
      {statusConfig && (
        <div className="mb-5">
          <CleaningStatusBadge status={cleaning.status as CleaningStatus} className="text-[12px]" />
        </div>
      )}

      {/* Property info */}
      {cleaning.propertyName && (
        <div className="rounded-xl border border-outline-dim px-4 py-4 flex flex-col gap-2.5 mb-4">
          <div className="flex items-center gap-2.5">
            <HomeIcon size={16} className="text-ink-muted shrink-0" strokeWidth={1.5} />
            <div className="text-[14px] text-ink">
              <span className="font-medium">{cleaning.propertyName}</span>
              {cleaning.propertyPyeong && (
                <span className="text-ink-muted ml-1.5 text-[12px]">
                  {cleaning.propertyPyeong}평 · 침실 {cleaning.propertyBedrooms} · 욕실 {cleaning.propertyBathrooms}
                </span>
              )}
            </div>
          </div>
          {cleaning.propertyAddress && (
            <div className="flex items-center gap-2.5">
              <MapPinIcon size={16} className="text-ink-muted shrink-0" strokeWidth={1.5} />
              <span className="text-[13px] text-ink-muted">
                {cleaning.propertyAddress}
                {cleaning.propertyAddressDetail && ` ${cleaning.propertyAddressDetail}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Cleaning details */}
      <div className="rounded-xl border border-outline-dim px-4 py-4 flex flex-col gap-2.5 mb-6">
        <div className="flex items-center gap-2.5">
          <CalendarIcon size={16} className="text-ink-muted shrink-0" strokeWidth={1.5} />
          <span className="text-[14px] text-ink">
            {formatDateLabel(cleaning.scheduledDate)}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <ClockIcon size={16} className="text-ink-muted shrink-0" strokeWidth={1.5} />
          <span className="text-[14px] text-ink">
            {formatTimeKorean(cleaning.scheduledTime)}
            {cleaning.cleaningType === 'urgent' && (
              <span className="text-brand ml-1.5 text-[12px]">긴급</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <CreditCardIcon size={16} className="text-ink-muted shrink-0" strokeWidth={1.5} />
          <span className="text-[14px] text-ink">
            {cleaning.finalPrice.toLocaleString()}원
            {cleaning.discount > 0 && (
              <span className="text-brand ml-1.5 text-[12px]">
                {cleaning.discount.toLocaleString()}원 할인
              </span>
            )}
          </span>
        </div>
        {cleaning.memo && (
          <div className="border-t border-outline-dim pt-2.5 mt-0.5">
            <p className="text-[13px] text-ink-muted">{cleaning.memo}</p>
          </div>
        )}
      </div>

      {showManagerSection && (
        <section className="mb-6 space-y-3">
          <p className="px-1 text-[13px] font-medium text-ink-muted">배정 매니저</p>
          <div className="overflow-hidden rounded-xl border border-outline-dim">
            <div className="flex items-start">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden bg-surface-soft">
                {cleaning.managerAvatarThumbnailSignedUrl ? (
                  <div className="relative h-full w-full">
                    <ImageWithSkeleton
                      src={cleaning.managerAvatarThumbnailSignedUrl}
                      alt=""
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <UserIcon size={18} strokeWidth={1.75} />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2.5 px-4 py-4">
                <div className="flex items-center gap-2.5">
                  <UserIcon size={16} className="text-ink-muted shrink-0" strokeWidth={1.5} />
                  <p className="text-[14px] text-ink">{cleaning.managerName || '-'}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <PhoneIcon size={16} className="text-ink-muted shrink-0" strokeWidth={1.5} />
                  {cleaning.managerPhone ? (
                    <a
                      href={`tel:${cleaning.managerPhone.replaceAll('-', '')}`}
                      className="text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
                    >
                      {cleaning.managerPhone}
                    </a>
                  ) : (
                    <p className="text-[13px] text-ink-muted">-</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {cleaning.status === 'completed' && (
        <div className="mb-6 flex flex-col gap-5">
          <ReadOnlyPhotoGallery
            title="청소 사진"
            photos={cleaningPhotos}
            emptyMessage="등록된 청소 사진이 없어요."
            titleClassName="mx-0"
            emptyMessageClassName="text-center"
            disableCarousel
            imageClassName="object-contain"
            useIntrinsicAspect
          />
          {reportData && (
            <section className="space-y-3">
              <p className="text-[16px] font-semibold text-ink">시설물 점검 리포트</p>
              <CleaningReportReadOnly
                propertyName={reportData.propertyName}
                spaces={reportData.spaces}
                assets={reportData.assets}
                report={reportData.report}
                showHeader={false}
              />
            </section>
          )}
        </div>
      )}

      {/* Process timeline */}
      {cleaning.status !== 'cancelled' && cleaning.status !== 'completed' && (
        <>
          <p className="text-[13px] font-medium text-ink-muted mb-3 px-1">진행 과정</p>
          <div className="flex flex-col gap-0 mb-6">
            {PROCESS_STEPS.map((step, i) => {
              const isDone = step.num <= currentStep
              return (
                <div key={step.num} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-7 h-7 rounded-full text-[13px] font-semibold flex items-center justify-center shrink-0',
                      isDone ? 'bg-brand text-white' : 'bg-outline-dim text-ink-faint'
                    )}>
                      {step.num}
                    </div>
                    {i < PROCESS_STEPS.length - 1 && (
                      <div className={cn(
                        'w-px flex-1 my-1',
                        isDone && i < currentStep - 1 ? 'bg-brand' : 'bg-outline-dim'
                      )} />
                    )}
                  </div>
                  <div className="pb-5">
                    <p className={cn(
                      'text-[15px] font-semibold',
                      isDone ? 'text-ink' : 'text-ink-faint'
                    )}>
                      {step.title}
                    </p>
                    <p className={cn(
                      'text-[13px] mt-0.5 leading-relaxed',
                      isDone ? 'text-ink-muted' : 'text-outline-strong'
                    )}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Cancel button */}
      {canCancel && (
        <button
          type="button"
          onClick={() => setCancelOpen(true)}
          className="text-[13px] text-ink-faint underline underline-offset-2 hover:text-ink-muted transition-colors self-center mt-auto"
        >
          청소 요청 취소
        </button>
      )}

      {/* Cancel Drawer */}
      <Drawer open={cancelOpen} onOpenChange={setCancelOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-ink">
                청소 요청을 취소할까요?
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-1.5 mb-6">
              {isFullRefund ? (
                <p className="text-[14px] text-ink-muted">
                  취소하면 결제 금액이 전액 환불돼요.
                </p>
              ) : (
                <>
                  <p className="text-[14px] text-ink-muted">
                    매니저가 이미 배정되었어요. 취소하면 결제 금액이 전액 환불돼요.
                  </p>
                  <p className="text-[13px] text-ink-faint">
                    청소 예정일 24시간 이내에는 취소가 불가해요.
                  </p>
                </>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <LoadingButton
                type="button"
                variant="destructive"
                loading={cancelling}
                loadingText="취소 중..."
                onClick={handleCancel}
              >
                취소하기
              </LoadingButton>
              <button
                type="button"
                onClick={() => setCancelOpen(false)}
                className="h-12 rounded-lg text-[15px] font-semibold text-ink-muted active:bg-surface-soft transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
