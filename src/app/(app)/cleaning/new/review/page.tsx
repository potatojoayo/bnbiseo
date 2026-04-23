'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDownIcon, ChevronLeftIcon } from 'lucide-react'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import { getToday } from '@/lib/utils'
import { calculateCleaningPrice, FIRST_CLEANING_DISCOUNT, LINEN_WASH_LABELS } from '@/lib/cleaning-pricing'
import { useProperties } from '@/lib/hooks/use-properties'
import { useCleaningRequests } from '@/lib/hooks/use-cleaning'
import { useAuth } from '@/lib/auth-provider'
import { api } from '@/lib/api-client'
import { LoadingButton } from '@/components/ui/loading-button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!

// ─── Cleaning scope & terms content ───────────────────────────────────────────

const CLEANING_SERVICES = [
  { icon: '🍳', label: '주방·설거지' },
  { icon: '🚿', label: '화장실 청소' },
  { icon: '🧹', label: '바닥 청소' },
  { icon: '🛏', label: '침구·수건 세팅' },
  { icon: '♻️', label: '분리수거' },
  { icon: '🎁', label: '게스트 웰컴 세팅' },
]

const CLEANING_TERMS: Array<{
  title: string
  items: Array<{ label: string; desc: string }>
}> = [
  {
    title: '출입 및 시간 관련',
    items: [
      {
        label: '비밀번호 확인',
        desc: '원활한 출입을 위해 도어락 비밀번호를 앱 내에 정확히 기재해주세요. (번호 변경 시 즉시 수정 필요)',
      },
      {
        label: '게스트 퇴실 지연',
        desc: '게스트의 체크아웃 지연으로 인해 매니저의 대기 시간이 발생할 경우, 30분당 1만 원의 추가 비용이 발생하거나 당일 서비스가 취소될 수 있습니다.',
      },
      {
        label: '서비스 시간',
        desc: '예약하신 시간은 서비스 시작 시간이며, 숙소 상태에 따라 종료 시간은 다소 차이가 있을 수 있습니다.',
      },
    ],
  },
  {
    title: '청소 범위 및 제외 대상',
    items: [
      {
        label: '표준 범위',
        desc: '거실, 방, 주방, 화장실 전체 청소 및 소모품(휴지, 수건 등) 세팅이 포함됩니다.',
      },
      {
        label: '제외 사항',
        desc: '전문적인 곰팡이 제거, 가전 내부(냉장고 심층 청소, 에어컨 필터 물세척 등), 높은 곳의 창문 외장 청소는 기본 서비스에 포함되지 않습니다.',
      },
      {
        label: '특수 오염',
        desc: '파티 흔적, 구토물, 다량의 반려동물 배설물 등 특수 오염이 심한 경우 현장에서 추가 비용이 청구될 수 있습니다.',
      },
    ],
  },
  {
    title: '세탁 및 쓰레기 배출',
    items: [
      {
        label: '세탁 옵션',
        desc: '세탁 서비스 미선택 시, 세탁물 교체 및 세팅만 진행하며 기존 세탁물은 숙소 내 지정된 위치에 정리해 둡니다.',
      },
      {
        label: '쓰레기 배출',
        desc: '해당 구의 종량제 봉투가 비치되어 있어야 합니다. 봉투 미비치 시 배출이 불가능할 수 있습니다.',
      },
      {
        label: '분리수거',
        desc: '대형 폐기물(가구, 대형 가전 등)의 배출은 포함되지 않습니다.',
      },
    ],
  },
  {
    title: '시설물 파손 및 귀중품 관련',
    items: [
      {
        label: '귀중품 보관',
        desc: '현금, 귀금속 등 귀중품은 반드시 호스트 전용 창고나 별도 장소에 보관해 주세요. 분실 시 당사는 책임을 지지 않습니다.',
      },
      {
        label: '파손 신고',
        desc: '매니저는 청소 시작 전/후 시설물을 점검합니다. 서비스 과정에서 발생한 파손은 비앤비서 보험 가입 범위 내에서 보상되며, 기존에 파손되어 있던 부분은 스캔 데이터와 대조하여 책임 소재를 명확히 합니다.',
      },
    ],
  },
]

export default function CleaningReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { data: properties = [], isLoading: propertiesLoading } = useProperties()
  const { data: cleaningHistory = [], isLoading: cleaningLoading } = useCleaningRequests()

  const propertyId = searchParams.get('propertyId') ?? ''
  const date = searchParams.get('date') ?? ''
  const time = searchParams.get('time') ?? ''
  const memo = searchParams.get('memo') ?? ''
  const linenWash = searchParams.get('linenWash') === '1'

  const [submitting, setSubmitting] = useState(false)

  // Redirect back to form if required params are missing
  useEffect(() => {
    if (!propertyId || !date || !time) {
      router.replace('/cleaning/new')
    }
  }, [propertyId, date, time, router])

  const isPageLoading =
    authLoading ||
    (!!user && (propertiesLoading || cleaningLoading))

  const isFirstCleaning = cleaningHistory.length === 0
  const isUrgent = date === getToday()
  const selectedProperty = properties.find((p) => p.id === propertyId)

  const priceInfo = selectedProperty?.pyeong
    ? calculateCleaningPrice({
        pyeong: selectedProperty.pyeong,
        livingRooms: selectedProperty.livingRooms ?? 0,
        bedrooms: selectedProperty.bedrooms ?? 0,
        bathrooms: selectedProperty.bathrooms ?? 0,
        isUrgent,
        linenWash,
        linenWashLocation: selectedProperty.linenWashLocation,
      })
    : null
  const estimatedPrice = priceInfo
    ? (isFirstCleaning ? Math.max(priceInfo.total - FIRST_CLEANING_DISCOUNT, 0) : priceInfo.total)
    : 0

  async function handlePay() {
    if (!propertyId || !user) return
    setSubmitting(true)
    try {
      const created = await api.post<{
        id: string
        orderId: string
        finalPrice: number
      }>('/cleaning', {
        propertyId,
        scheduledDate: date,
        scheduledTime: time,
        memo: memo || undefined,
        isUrgent,
        linenWash,
      })

      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY)
      const payment = tossPayments.payment({ customerKey: user.id })

      const propertyName = selectedProperty?.name || '숙소'
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: created.finalPrice },
        orderId: created.orderId,
        orderName: `비앤비서 청소 · ${propertyName}`,
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
    <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col p-6 pb-0">
      <button
        type="button"
        onClick={() => router.replace(`/cleaning/new?${searchParams.toString()}`)}
        className="mb-3 -ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
      >
        <ChevronLeftIcon size={32} />
      </button>
      <h1 className="text-[22px] font-semibold text-ink mb-6">
        청소 범위 및 유의사항
      </h1>

      <div className="flex flex-col gap-6">
        {/* 제공 서비스 */}
        <section>
          <p className="text-[16px] font-semibold text-ink mb-3">제공 서비스</p>
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-outline-dim p-4">
            {CLEANING_SERVICES.map((service) => (
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
            {CLEANING_TERMS.map((term) => (
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

        {/* 결제 요약 */}
        {priceInfo && (
          <div className="rounded-xl border border-ink-faint px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-ink-muted">최종 결제 금액</span>
              <div className="text-right">
                {isFirstCleaning && (
                  <span className="text-[14px] text-ink-faint line-through mr-2">
                    {priceInfo.total.toLocaleString()}원
                  </span>
                )}
                <span className="text-[20px] font-semibold text-ink">
                  {estimatedPrice.toLocaleString()}원
                </span>
              </div>
            </div>
            {linenWash && selectedProperty.linenWashLocation && (
              <p className="text-[12px] text-ink-muted mt-1.5 text-right">
                침구류 세탁 · {LINEN_WASH_LABELS[selectedProperty.linenWashLocation]} +{priceInfo.linenWashCharge.toLocaleString()}원
              </p>
            )}
            {isFirstCleaning && (
              <p className="text-[12px] text-brand mt-1.5 text-right">
                첫 청소 {FIRST_CLEANING_DISCOUNT.toLocaleString()}원 할인 적용
              </p>
            )}
            {isUrgent && (
              <p className="text-[12px] text-ink-muted mt-1 text-right">
                긴급 할증 50% 포함
              </p>
            )}
          </div>
        )}

        {/* 결제하기 */}
        <LoadingButton
          type="button"
          variant="primary"
          loading={submitting}
          loadingText="결제 진행 중..."
          onClick={handlePay}
        >
          {estimatedPrice > 0
            ? `${estimatedPrice.toLocaleString()}원 결제하기`
            : '결제하기'}
        </LoadingButton>
      </div>
    </div>
  )
}
