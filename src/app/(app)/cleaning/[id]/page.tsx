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
} from 'lucide-react'
import { useCleaningRequest, useInvalidateCleaning } from '@/lib/hooks/use-cleaning'
import { formatDateLabel, formatTimeKorean, cn } from '@/lib/utils'
import { api } from '@/lib/api-client'
import { LoadingButton } from '@/components/ui/loading-button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

const STATUS_CONFIG: Record<string, { label: string; color: string; step: number }> = {
  pending: { label: '매니저 배정 중', color: 'bg-brand/8 text-brand', step: 1 },
  confirmed: { label: '매니저 배정 완료', color: 'bg-success-soft text-success', step: 2 },
  in_progress: { label: '청소 진행 중', color: 'bg-info-soft text-info', step: 3 },
  completed: { label: '청소 완료', color: 'bg-surface-soft text-ink', step: 4 },
  cancelled: { label: '취소됨', color: 'bg-surface-soft text-ink-faint', step: 0 },
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

  const statusConfig = STATUS_CONFIG[cleaning.status]
  const currentStep = statusConfig?.step ?? 0

  // 취소 정책: pending 전액 환불, confirmed 24시간 전까지만
  const scheduledAt = new Date(`${cleaning.scheduledDate}T${cleaning.scheduledTime}:00+09:00`)
  const hoursUntil = (scheduledAt.getTime() - currentTime) / (1000 * 60 * 60)
  const canCancel = cleaning.status === 'pending' || (cleaning.status === 'confirmed' && hoursUntil >= 24)
  const isFullRefund = cleaning.status === 'pending'

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
          <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
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
                  {cleaning.propertyPyeong}평 · 방 {cleaning.propertyBedrooms} · 욕실 {cleaning.propertyBathrooms}
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

      {/* Process timeline */}
      {cleaning.status !== 'cancelled' && (
        <>
          <p className="text-[13px] font-medium text-ink-muted mb-3 px-1">진행 과정</p>
          <div className="flex flex-col gap-0 mb-6">
            {PROCESS_STEPS.map((step, i) => {
              const isDone = step.num <= currentStep
              const isCurrent = step.num === currentStep
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
                      {isCurrent && isDone && (
                        <span className="text-brand ml-1.5 text-[12px] font-normal">현재</span>
                      )}
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
