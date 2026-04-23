'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import { toast } from 'sonner'
import { RepairCompletionReportReadOnly } from '@/components/repair-completion-report-read-only'
import { useRepairRequest, useRepairReport, useInvalidateRepair } from '@/lib/hooks/use-repair'
import { formatDateLabel, formatTimeKorean, cn } from '@/lib/utils'
import { api } from '@/lib/api-client'
import { LoadingButton } from '@/components/ui/loading-button'
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { RepairStatusBadge } from '@/components/repair-status-badge'
import { AssetCard } from '@/components/asset-card'
import { ReadOnlyPhotoGallery } from '@/components/read-only-photo-gallery'
import { useAuth } from '@/lib/auth-provider'
import type { RepairStatus } from '@/lib/hooks/use-repair'

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!

const STATUS_STEP: Record<RepairStatus, number> = {
  submitted: 1,
  quoted: 2,
  confirmed: 3,
  in_progress: 4,
  completed: 5,
  cancelled: 0,
}

const PROCESS_STEPS = [
  { num: 1, title: '수리 요청', desc: '증상과 희망 일시가 매니저에게 전달되었어요.' },
  { num: 2, title: '일정·견적 협의', desc: '매니저가 유선으로 연락해 일정과 견적을 조율해요.' },
  { num: 3, title: '견적 확인 및 결제', desc: '발송된 견적서를 확인한 후 결제하면 방문이 확정돼요.' },
  { num: 4, title: '방문 수리', desc: '확정 일정에 매니저가 방문해 수리 작업을 진행해요.' },
  { num: 5, title: '조치 보고서 수신', desc: '작업 완료 후 사진과 조치 내용을 담은 보고서를 받아요.' },
]

export default function RepairDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { user } = useAuth()
  const { data: repair, isLoading } = useRepairRequest(id)
  const { data: reportData } = useRepairReport(id)
  const invalidateRepair = useInvalidateRepair()

  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [paying, setPaying] = useState(false)

  async function handlePay() {
    if (!repair || !user || repair.quotedCost == null || !repair.orderId) return
    setPaying(true)
    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY)
      const payment = tossPayments.payment({ customerKey: user.id })

      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: repair.quotedCost },
        orderId: repair.orderId,
        orderName: `비앤비서 수리 · ${repair.propertyName || '숙소'}`,
        successUrl: `${window.location.origin}/repair/success?repairId=${repair.id}`,
        failUrl: `${window.location.origin}/repair/fail`,
        customerEmail: user.email || undefined,
        customerName: user.user_metadata?.full_name || undefined,
        card: {
          useEscrow: false,
          flowMode: 'DEFAULT',
          useCardPoint: false,
          useAppCardOnly: false,
        },
      })
    } catch {
      // 결제창 닫기 or 에러
    } finally {
      setPaying(false)
    }
  }

  async function handleCancel() {
    setCancelling(true)
    try {
      await api.post(`/repair/${id}/cancel`)
      await invalidateRepair()
      router.replace(`/repair/${id}/cancelled`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '취소에 실패했어요.')
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

  if (!repair) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-80px)] px-6 text-center">
        <h2 className="text-[18px] font-semibold text-ink mb-2">요청을 찾을 수 없어요</h2>
        <Link href="/repair" className="mt-4 text-[14px] text-ink-muted underline underline-offset-2">
          수리 목록으로
        </Link>
      </div>
    )
  }

  const currentStep = STATUS_STEP[repair.status]
  const showManagerSection = ['confirmed', 'in_progress', 'completed'].includes(repair.status)
  const showQuoteSection = ['quoted', 'confirmed', 'in_progress', 'completed'].includes(repair.status) && repair.quotedCost != null

  // 취소 정책: 결제 전(submitted/quoted) 상태에서만 가능
  let canCancel = false
  if (['submitted', 'quoted'].includes(repair.status)) {
    canCancel = true
  }

  return (
    <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col px-6 pt-6 pb-10">
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
      {repair.propertyName && (
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
      )}

      {/* 수리 내용 */}
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

      {/* 선택된 시설물 */}
      {repair.assets.length > 0 && (
        <section className="mb-4">
          <p className="px-1 mb-2 text-[13px] font-medium text-ink-muted">관련 시설물</p>
          <div className="flex flex-col gap-2">
            {repair.assets.map((asset) => (
              <AssetCard
                key={asset.id}
                name={asset.name}
                location={asset.location}
                imageUrl={asset.signedUrl ?? asset.thumbnailSignedUrl}
                href={`/my/properties/${repair.propertyId}/assets/${asset.id}`}
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

      {/* 견적서 */}
      {showQuoteSection && repair.quotedCost != null && (
        <div className="rounded-xl border border-outline-dim px-4 py-4 flex flex-col gap-2.5 mb-6">
          <div className="flex items-center gap-2.5">
            <CreditCardIcon size={16} className="text-ink-muted shrink-0" strokeWidth={1.5} />
            <span className="text-[14px] text-ink font-medium">
              견적 {repair.quotedCost.toLocaleString()}원
            </span>
          </div>
          {repair.quoteNote && (
            <p className="border-t border-outline-dim pt-2.5 mt-0.5 whitespace-pre-wrap text-[13px] text-ink-muted leading-relaxed">
              {repair.quoteNote}
            </p>
          )}
        </div>
      )}

      {/* 매니저 섹션 */}
      {showManagerSection && (
        <section className="mb-6 space-y-3">
          <p className="px-1 text-[13px] font-medium text-ink-muted">배정 매니저</p>
          <div className="overflow-hidden rounded-xl border border-outline-dim">
            <div className="flex items-start">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden bg-surface-soft">
                {repair.managerAvatarThumbnailSignedUrl ? (
                  <div className="relative h-full w-full">
                    <ImageWithSkeleton
                      src={repair.managerAvatarThumbnailSignedUrl}
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
                  <p className="text-[14px] text-ink">{repair.managerName || '-'}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <PhoneIcon size={16} className="text-ink-muted shrink-0" strokeWidth={1.5} />
                  {repair.managerPhone ? (
                    <a
                      href={`tel:${repair.managerPhone.replaceAll('-', '')}`}
                      className="text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
                    >
                      {repair.managerPhone}
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

      {/* 완료 보고서 */}
      {repair.status === 'completed' && reportData && (
        <section className="mb-6">
          <RepairCompletionReportReadOnly
            report={reportData.report}
          />
        </section>
      )}

      {/* 결제 버튼 (quoted 상태에서만) */}
      {repair.status === 'quoted' && repair.quotedCost != null && (
        <div className="mb-6">
          <LoadingButton
            type="button"
            variant="primary"
            loading={paying}
            loadingText="결제 진행 중..."
            onClick={handlePay}
          >
            {repair.quotedCost.toLocaleString()}원 결제하기
          </LoadingButton>
        </div>
      )}

      {/* 진행 과정 */}
      {repair.status !== 'cancelled' && repair.status !== 'completed' && (
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
                      isDone ? 'bg-brand text-white' : 'bg-outline-dim text-ink-faint',
                    )}>
                      {step.num}
                    </div>
                    {i < PROCESS_STEPS.length - 1 && (
                      <div className={cn(
                        'w-px flex-1 my-1',
                        isDone && i < currentStep - 1 ? 'bg-brand' : 'bg-outline-dim',
                      )} />
                    )}
                  </div>
                  <div className="pb-5">
                    <p className={cn(
                      'text-[15px] font-semibold',
                      isDone ? 'text-ink' : 'text-ink-faint',
                    )}>
                      {step.title}
                    </p>
                    <p className={cn(
                      'text-[13px] mt-0.5 leading-relaxed',
                      isDone ? 'text-ink-muted' : 'text-outline-strong',
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

      {canCancel && (
        <button
          type="button"
          onClick={() => setCancelOpen(true)}
          className="text-[13px] text-ink-faint underline underline-offset-2 hover:text-ink-muted transition-colors self-center mt-auto"
        >
          수리 요청 취소
        </button>
      )}

      <Drawer open={cancelOpen} onOpenChange={setCancelOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-ink">
                수리 요청을 취소할까요?
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-1.5 mb-6">
              <p className="text-[14px] text-ink-muted">
                수리 요청을 취소해요. 언제든 다시 요청하실 수 있어요.
              </p>
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
