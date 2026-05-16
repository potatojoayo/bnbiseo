'use client'

import { useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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
  BanknoteIcon,
  CheckIcon,
  CopyIcon,
} from 'lucide-react'
import { CleaningReportReadOnly } from '@/components/cleaning-report-read-only'
import { useCleaningRequest, useCleaningReport, useInvalidateCleaning } from '@/lib/hooks/use-cleaning'
import { formatDateLabel, formatTimeKorean, cn, formatKoreanPhone } from '@/lib/utils'
import { api } from '@/lib/api-client'
import { LoadingButton } from '@/components/ui/loading-button'
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton'
import type { CleaningPhotosBySpace } from '@/lib/hooks/use-cleaning'
import { CleaningPrepPhotoGrid } from '@/components/cleaning-prep-photo-grid'
import { CleaningPairPhotos } from '@/components/cleaning-pair-photos'

const SPACE_CATEGORY_LABELS: Record<CleaningPhotosBySpace['category'], string> = {
  living_room: '거실',
  bedroom: '침실',
  bathroom: '화장실',
  veranda: '베란다',
  exterior: '외부',
  other: '기타',
}
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
  { num: 3, title: '호텔식 청소 + 시설 점검', desc: '호텔식 침구 세팅과 시설 점검을 진행해요.' },
  { num: 4, title: '점검 리포트 수신', desc: '청소 완료 후 사진과 함께 시설 점검 리포트를 받아요.' },
]

const AC_PROCESS_STEPS = [
  { num: 1, title: '결제 완료', desc: '에어컨 청소 요청과 결제가 완료되었어요.' },
  { num: 2, title: '매니저 배정', desc: '에어컨 청소 전문 매니저가 배정되면 알림을 보내드려요.' },
  { num: 3, title: '에어컨 청소', desc: '선택하신 에어컨을 꼼꼼하게 청소해요.' },
  { num: 4, title: '완료 사진 수신', desc: '청소 완료 후 에어컨별 청소 전/후 사진을 받아요.' },
]

const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME ?? ''
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? ''
const BANK_HOLDER = process.env.NEXT_PUBLIC_BANK_HOLDER ?? ''

export default function CleaningDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromNew = searchParams.get('from') === 'new'
  const id = params.id as string
  const { data: cleaning, isLoading } = useCleaningRequest(id)
  const { data: reportData } = useCleaningReport(id)
  const invalidateCleaning = useInvalidateCleaning()

  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [currentTime] = useState(() => Date.now())
  const [copiedField, setCopiedField] = useState<'account' | null>(null)

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
  const isBankTransferPending =
    cleaning.status === 'pending_payment' && cleaning.paymentMethod === 'bank_transfer'

  // 취소 정책: pending 전액 환불, confirmed 24시간 전까지만, 무통장 입금 대기 건은 언제든 취소 가능
  const scheduledAt = new Date(`${cleaning.scheduledDate}T${cleaning.scheduledTime}:00+09:00`)
  const hoursUntil = (scheduledAt.getTime() - currentTime) / (1000 * 60 * 60)
  const canCancel =
    isBankTransferPending ||
    cleaning.status === 'pending' ||
    (cleaning.status === 'confirmed' && hoursUntil >= 24)
  const isFullRefund = cleaning.status === 'pending'

  async function handleCopyAccount() {
    try {
      await navigator.clipboard.writeText(BANK_ACCOUNT.replace(/\D/g, ''))
      setCopiedField('account')
      setTimeout(() => setCopiedField(null), 1500)
    } catch {
      // ignore
    }
  }
  const photoSpaces = cleaning.cleaningPhotosBySpace
  const photoAssets = cleaning.cleaningPhotosByAsset
  const selectedAssets = cleaning.selectedAssets
  const isAcService = cleaning.serviceType === 'ac'
  const showBeforePhotos = cleaning.status === 'in_progress' || cleaning.status === 'completed'
  const showAfterPhotos = cleaning.status === 'completed'

  return (
    <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col px-6 pt-6 pb-10">
      {/* Header */}
      <button
        type="button"
        onClick={() => {
          if (fromNew) router.replace('/home')
          else if (window.history.length > 1) router.back()
          else router.push('/home')
        }}
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
          <CleaningStatusBadge
            status={cleaning.status as CleaningStatus}
            label={isBankTransferPending ? '입금 대기' : undefined}
            className="text-[12px]"
          />
        </div>
      )}

      {/* 무통장 입금 안내 배너 */}
      {isBankTransferPending && (
        <div className="mb-4 rounded-2xl border border-outline-dim bg-white px-4 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-2 mb-2.5">
            <BanknoteIcon size={18} className="text-ink shrink-0" strokeWidth={1.75} />
            <p className="text-[14px] font-semibold text-ink">입금 대기 중</p>
          </div>
          <p className="text-[13px] text-ink-muted leading-relaxed mb-3.5">
            아래 계좌로 <span className="font-semibold text-ink">{cleaning.finalPrice.toLocaleString()}원</span>을 입금해주세요.
            입금이 확인되면 청소 요청이 정식 접수됩니다.
          </p>
          <div className="rounded-lg bg-surface-soft px-3.5 py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-ink-muted">은행</span>
              <span className="text-[13px] font-medium text-ink">{BANK_NAME || '-'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] text-ink-muted">계좌번호</span>
              <button
                type="button"
                onClick={handleCopyAccount}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink hover:text-brand transition-colors"
              >
                <span className="font-mono tracking-tight">{BANK_ACCOUNT || '-'}</span>
                {copiedField === 'account' ? (
                  <CheckIcon size={13} className="text-success" strokeWidth={2.5} />
                ) : (
                  <CopyIcon size={13} className="text-ink-muted" strokeWidth={1.75} />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-ink-muted">예금주</span>
              <span className="text-[13px] font-medium text-ink">{BANK_HOLDER || '-'}</span>
            </div>
            <div className="flex items-center justify-between border-t border-outline-dim pt-2 mt-0.5">
              <span className="text-[12px] text-ink-muted">입금 금액</span>
              <span className="text-[14px] font-semibold text-brand">
                {cleaning.finalPrice.toLocaleString()}원
              </span>
            </div>
          </div>
          <p className="text-[12px] text-ink-muted mt-3 leading-relaxed">
            · 입금자명에 본인 이름을 기재해 주세요.<br />
            · 영업일 기준 1~2시간 내에 입금 확인 후 매니저 배정이 시작됩니다.
          </p>
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
            <span className="text-ink-muted ml-1.5 text-[12px]">
              · {cleaning.cleaningPlan === 'regular' ? '정기' : '단건'}
            </span>
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
                      href={`tel:${cleaning.managerPhone.replace(/\D/g, '')}`}
                      className="text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
                    >
                      {formatKoreanPhone(cleaning.managerPhone)}
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

      {isAcService && selectedAssets.length > 0 && (
        <section className="mb-6 space-y-3">
          <p className="text-[16px] font-semibold text-ink">청소 대상 에어컨 ({selectedAssets.length}대)</p>
          <div className="flex flex-col gap-2">
            {selectedAssets.map((asset) => (
              <div key={asset.id} className="rounded-xl border border-outline-dim px-4 py-3">
                <p className="text-[14px] font-semibold text-ink">{asset.name}</p>
                <p className="mt-0.5 text-[12px] text-ink-muted">
                  {asset.location}
                  {asset.brand || asset.modelNumber
                    ? ` · ${[asset.brand, asset.modelNumber].filter(Boolean).join(' ')}`
                    : ''}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {isAcService && showBeforePhotos && photoAssets.length > 0 && (
        <section className="mb-6 space-y-4">
          <div>
            <p className="text-[16px] font-semibold text-ink">에어컨별 청소 사진</p>
            <p className="mt-1 text-[12px] text-ink-muted">
              {showAfterPhotos
                ? '매니저가 촬영한 에어컨별 청소 전/후 사진입니다.'
                : '매니저가 도착해 촬영한 청소 전 현황입니다.'}
            </p>
          </div>
          {showAfterPhotos ? (
            <CleaningPairPhotos
              spaces={photoAssets.map((asset) => ({
                spaceId: asset.assetId,
                spaceName: asset.assetName,
                categoryLabel: asset.location,
                before: asset.before,
                after: asset.after,
              }))}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {photoAssets.map((asset) => (
                <div key={asset.assetId} className="rounded-xl border border-outline-dim p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-semibold text-ink">{asset.assetName}</p>
                    <span className="text-[11px] font-medium text-ink-muted">{asset.location}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold text-ink-muted tracking-wider uppercase">청소 전</p>
                    <CleaningPrepPhotoGrid photos={asset.before} emptyText="청소 전 사진이 없어요." />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {!isAcService && showBeforePhotos && photoSpaces.length > 0 && (
        <section className="mb-6 space-y-4">
          <div>
            <p className="text-[16px] font-semibold text-ink">공간별 청소 사진</p>
            <p className="mt-1 text-[12px] text-ink-muted">
              {showAfterPhotos
                ? '매니저가 촬영한 공간별 청소 전/후 사진입니다.'
                : '매니저가 도착해 촬영한 청소 전 현황입니다.'}
            </p>
          </div>
          {showAfterPhotos ? (
            <CleaningPairPhotos
              spaces={photoSpaces.map((space) => ({
                spaceId: space.spaceId,
                spaceName: space.spaceName,
                categoryLabel: SPACE_CATEGORY_LABELS[space.category],
                before: space.before,
                after: space.after,
              }))}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {photoSpaces.map((space) => (
                <div key={space.spaceId} className="rounded-xl border border-outline-dim p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-semibold text-ink">{space.spaceName}</p>
                    <span className="text-[11px] font-medium text-ink-muted">
                      {SPACE_CATEGORY_LABELS[space.category]}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold text-ink-muted tracking-wider uppercase">청소 전</p>
                    <CleaningPrepPhotoGrid photos={space.before} emptyText="청소 전 사진이 없어요." />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {!isAcService && cleaning.status === 'completed' && reportData && (
        <section className="mb-6 space-y-3">
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

      {/* Process timeline */}
      {cleaning.status !== 'cancelled' && cleaning.status !== 'completed' && (() => {
        const steps = isAcService ? AC_PROCESS_STEPS : PROCESS_STEPS
        return (
        <>
          <p className="text-[13px] font-medium text-ink-muted mb-3 px-1">진행 과정</p>
          <div className="flex flex-col gap-0 mb-6">
            {steps.map((step, i) => {
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
                    {i < steps.length - 1 && (
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
        )
      })()}

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
              {isBankTransferPending ? (
                <p className="text-[14px] text-ink-muted">
                  아직 입금이 확인되지 않은 요청이에요. 취소하면 요청이 즉시 삭제됩니다.
                </p>
              ) : isFullRefund ? (
                <p className="text-[14px] text-ink-muted">
                  취소하면 결제 금액이 전액 환불됩니다.
                </p>
              ) : (
                <>
                  <p className="text-[14px] text-ink-muted">
                    매니저가 이미 배정되었어요. 취소하면 결제 금액이 전액 환불됩니다.
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
