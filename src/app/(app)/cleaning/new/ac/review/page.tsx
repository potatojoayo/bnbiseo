'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BanknoteIcon, ChevronDownIcon, ChevronLeftIcon, CreditCardIcon } from 'lucide-react'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import { cn } from '@/lib/utils'
import { AC_FIRST_CLEANING_DISCOUNT, AC_PRICE_PER_UNIT, calculateAcCleaningPrice } from '@/lib/cleaning-pricing'
import { useProperties, usePropertyDetail } from '@/lib/hooks/use-properties'
import { useCleaningRequests } from '@/lib/hooks/use-cleaning'
import { useAuth } from '@/lib/auth-provider'
import { api } from '@/lib/api-client'
import { LoadingButton } from '@/components/ui/loading-button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

type PaymentMethod = 'card' | 'bank_transfer'

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!

const AC_SERVICES = [
  { icon: '🧊', label: '필터·전면 분해' },
  { icon: '💧', label: '내부 송풍팬 세척' },
  { icon: '🧴', label: '항균·탈취 처리' },
  { icon: '🔧', label: '드레인 관리' },
  { icon: '✨', label: '커버 광택 마무리' },
  { icon: '📋', label: '청소 전·후 사진' },
]

const AC_TERMS: Array<{
  title: string
  items: Array<{ label: string; desc: string }>
}> = [
  {
    title: '청소 범위',
    items: [
      {
        label: '대상',
        desc: '선택하신 에어컨만 분해 청소합니다. 다른 시설은 청소 대상이 아니며, 일반 청소를 원하신다면 별도로 요청해주세요.',
      },
      {
        label: '진행 방식',
        desc: '필터·커버 분리, 내부 송풍팬과 열교환기 청소, 항균·탈취 처리, 외관 마무리 순으로 진행됩니다.',
      },
      {
        label: '소요 시간',
        desc: '대당 약 60~90분이 소요되며 모델·오염 정도에 따라 달라질 수 있습니다.',
      },
    ],
  },
  {
    title: '예약 및 출입',
    items: [
      {
        label: '예약 시점',
        desc: '에어컨 청소는 다음 날부터 예약이 가능하며 당일 요청은 받지 않습니다.',
      },
      {
        label: '도어락 비밀번호',
        desc: '원활한 출입을 위해 도어락 비밀번호를 앱 내에 정확히 기재해주세요.',
      },
      {
        label: '서비스 시간',
        desc: '예약하신 시간은 작업 시작 시간이며, 대수와 상태에 따라 종료 시간은 차이가 있을 수 있습니다.',
      },
    ],
  },
  {
    title: '제외 사항 및 책임',
    items: [
      {
        label: '제외 사항',
        desc: '냉매 충전, 내부 PCB 수리, 천장 매립형 본체 분해(별도 견적) 등은 기본 서비스에 포함되지 않습니다.',
      },
      {
        label: '기존 결함',
        desc: '청소 전 이미 존재한 누수·소음·전원 이상 등 결함은 보상 범위에서 제외됩니다.',
      },
      {
        label: '파손 신고',
        desc: '서비스 과정에서 발생한 파손은 비앤비서 보험 가입 범위 내에서 보상됩니다.',
      },
    ],
  },
]

export default function AcCleaningReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { data: properties = [], isLoading: propertiesLoading } = useProperties()
  const { data: cleaningHistory = [], isLoading: cleaningLoading } = useCleaningRequests()

  const propertyId = searchParams.get('propertyId') ?? ''
  const date = searchParams.get('date') ?? ''
  const time = searchParams.get('time') ?? ''
  const memo = searchParams.get('memo') ?? ''
  const assetIds = useMemo(
    () => (searchParams.get('assetIds') ?? '').split(',').filter(Boolean),
    [searchParams],
  )

  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>('bank_transfer')

  useEffect(() => {
    if (!propertyId || !date || !time || assetIds.length === 0) {
      router.replace('/cleaning/new/ac')
    }
  }, [propertyId, date, time, assetIds.length, router])

  const isPageLoading =
    authLoading || (!!user && (propertiesLoading || cleaningLoading))

  const isFirstAc = cleaningHistory.every((req) => req.serviceType !== 'ac')
  const selectedProperty = properties.find((p) => p.id === propertyId)
  const { data: propertyDetail } = usePropertyDetail(propertyId)
  const selectedAssets = useMemo(
    () => (propertyDetail?.assets ?? []).filter((asset) => assetIds.includes(asset.id) && asset.category === 'ac'),
    [propertyDetail?.assets, assetIds],
  )

  const priceInfo = assetIds.length > 0 ? calculateAcCleaningPrice({ acCount: assetIds.length }) : null
  const discount = isFirstAc ? AC_FIRST_CLEANING_DISCOUNT : 0
  const estimatedPrice = priceInfo ? Math.max(priceInfo.total - discount, 0) : 0

  async function handlePay() {
    if (!propertyId || !user || !paymentMethod || assetIds.length === 0) return
    setSubmitting(true)
    try {
      const created = await api.post<{
        id: string
        orderId: string
        finalPrice: number
      }>('/cleaning', {
        serviceType: 'ac',
        propertyId,
        scheduledDate: date,
        scheduledTime: time,
        memo: memo || undefined,
        assetIds,
        paymentMethod,
      })

      if (paymentMethod === 'bank_transfer') {
        router.replace(`/cleaning/${created.id}?from=new`)
        return
      }

      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY)
      const payment = tossPayments.payment({ customerKey: user.id })

      const propertyName = selectedProperty?.name || '숙소'
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: created.finalPrice },
        orderId: created.orderId,
        orderName: `비앤비서 에어컨 청소 · ${propertyName}`,
        successUrl: `${window.location.origin}/cleaning/success`,
        failUrl: `${window.location.origin}/cleaning/fail`,
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
      setSubmitting(false)
    }
  }

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-80px)]">
        <div className="w-6 h-6 rounded-full border-2 border-outline-dim border-t-ink-muted animate-spin" />
      </div>
    )
  }

  if (!selectedProperty) {
    return null
  }

  return (
    <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col p-6 pb-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-3 -ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
      >
        <ChevronLeftIcon size={32} />
      </button>
      <h1 className="text-[22px] font-semibold text-ink mb-6">에어컨 청소 안내</h1>

      <div className="flex flex-col gap-6">
        {/* 선택 에어컨 */}
        <section>
          <p className="text-[16px] font-semibold text-ink mb-3">청소할 에어컨 ({selectedAssets.length}대)</p>
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

        {/* 제공 서비스 */}
        <section>
          <p className="text-[16px] font-semibold text-ink mb-3">제공 서비스</p>
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-outline-dim p-4">
            {AC_SERVICES.map((service) => (
              <div key={service.label} className="flex flex-col items-center gap-1.5 py-2">
                <span className="text-[28px] leading-none">{service.icon}</span>
                <span className="text-[12px] font-medium text-ink text-center leading-tight">
                  {service.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 유의사항 */}
        <section>
          <p className="text-[16px] font-semibold text-ink mb-3">유의 사항</p>
          <div className="flex flex-col gap-2">
            {AC_TERMS.map((term) => (
              <Collapsible key={term.title}>
                <div className="rounded-xl border border-outline-dim overflow-hidden">
                  <CollapsibleTrigger className="group flex w-full items-center justify-between px-4 py-3.5 text-left text-[14px] font-semibold text-ink hover:bg-surface-soft transition-colors">
                    <span>{term.title}</span>
                    <ChevronDownIcon
                      size={18}
                      strokeWidth={2}
                      className="text-ink-muted transition-transform duration-200 group-data-[state=open]:rotate-180"
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    <div className="border-t border-outline-dim px-4 py-3 flex flex-col gap-3">
                      {term.items.map((item) => (
                        <div key={item.label}>
                          <p className="text-[13px] font-semibold text-ink mb-1">
                            · {item.label}
                          </p>
                          <p className="text-[13px] text-ink-muted leading-relaxed pl-3">
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        </section>

        {/* 결제 방법 */}
        <section>
          <p className="text-[16px] font-semibold text-ink mb-3">결제 방법</p>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('bank_transfer')}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors',
                paymentMethod === 'bank_transfer'
                  ? 'border-ink bg-surface-soft'
                  : 'border-ink-faint hover:bg-surface-soft',
              )}
            >
              <span
                className={cn(
                  'flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] shrink-0 transition-colors',
                  paymentMethod === 'bank_transfer' ? 'border-ink' : 'border-outline',
                )}
              >
                {paymentMethod === 'bank_transfer' && (
                  <span className="h-[10px] w-[10px] rounded-full bg-ink" />
                )}
              </span>
              <BanknoteIcon size={20} strokeWidth={1.5} className="text-ink shrink-0" />
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-ink">무통장 입금</p>
                <p className="text-[12px] text-ink-muted mt-0.5">
                  요청 후 안내된 계좌로 입금
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors',
                paymentMethod === 'card'
                  ? 'border-ink bg-surface-soft'
                  : 'border-ink-faint hover:bg-surface-soft',
              )}
            >
              <span
                className={cn(
                  'flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] shrink-0 transition-colors',
                  paymentMethod === 'card' ? 'border-ink' : 'border-outline',
                )}
              >
                {paymentMethod === 'card' && (
                  <span className="h-[10px] w-[10px] rounded-full bg-ink" />
                )}
              </span>
              <CreditCardIcon size={20} strokeWidth={1.5} className="text-ink shrink-0" />
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-ink">
                  카드/간편 결제 <span className="text-ink-muted font-normal">(준비중)</span>
                </p>
                <p className="text-[12px] text-ink-muted mt-0.5">
                  토스페이먼츠로 즉시 결제
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* 결제 요약 */}
        {priceInfo && (
          <div className="rounded-xl border border-ink-faint px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-ink-muted">최종 결제 금액</span>
              <div className="text-right">
                {isFirstAc && (
                  <span className="text-[14px] text-ink-faint line-through mr-2">
                    {priceInfo.total.toLocaleString()}원
                  </span>
                )}
                <span className="text-[20px] font-semibold text-ink">
                  {estimatedPrice.toLocaleString()}원
                </span>
              </div>
            </div>
            <p className="text-[12px] text-ink-muted mt-1.5 text-right">
              에어컨 {priceInfo.acCount}대 × {AC_PRICE_PER_UNIT.toLocaleString()}원
            </p>
            {isFirstAc && (
              <p className="text-[12px] text-brand mt-1 text-right">
                첫 에어컨 청소 {AC_FIRST_CLEANING_DISCOUNT.toLocaleString()}원 할인 적용
              </p>
            )}
          </div>
        )}

        <LoadingButton
          type="button"
          variant="primary"
          loading={submitting}
          loadingText={paymentMethod === 'bank_transfer' ? '요청 중...' : '결제 진행 중...'}
          disabled={!paymentMethod}
          onClick={handlePay}
        >
          {!paymentMethod
            ? '결제 방법을 선택해주세요'
            : paymentMethod === 'bank_transfer'
              ? estimatedPrice > 0
                ? `${estimatedPrice.toLocaleString()}원 청소 요청하기`
                : '청소 요청하기'
              : estimatedPrice > 0
                ? `${estimatedPrice.toLocaleString()}원 결제하기`
                : '결제하기'}
        </LoadingButton>
      </div>
    </div>
  )
}
