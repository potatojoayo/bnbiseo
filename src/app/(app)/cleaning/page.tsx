'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckIcon } from 'lucide-react'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import { toast } from 'sonner'
import { CalendarPicker } from '@/components/calendar-picker'
import { PropertyCard } from '@/components/property-card'
import { cn, getToday, getTomorrow, formatDateLabel, formatTimeKorean, ALL_TIME_SLOTS, getMinTime, getAvailableTimeSlots, getDefaultTime } from '@/lib/utils'
import { calculateCleaningPrice, FIRST_CLEANING_DISCOUNT } from '@/lib/cleaning-pricing'
import { PROPERTY_REGISTRATION_STEPS } from '@/lib/process-steps'
import { useProperties } from '@/lib/hooks/use-properties'
import { useCleaningRequests } from '@/lib/hooks/use-cleaning'
import { useAuth } from '@/lib/auth-provider'
import { api } from '@/lib/api-client'
import { CompoundInput, CompoundField, FloatingTextarea } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading-button'
import { ProcessDrawer } from '@/components/process-drawer'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CleaningPage() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { data: properties = [], isLoading: propertiesLoading } = useProperties()
  const { data: cleaningHistory = [] } = useCleaningRequests()

  const isFirstCleaning = cleaningHistory.length === 0

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(searchParams.get('propertyId') ?? '')
  const [date, setDate] = useState(getTomorrow())
  const [time, setTime] = useState('11:00')
  const [memo, setMemo] = useState('')

  const [dateDrawerOpen, setDateDrawerOpen] = useState(false)
  const [timeDrawerOpen, setTimeDrawerOpen] = useState(false)
  const [pricingDrawerOpen, setPricingDrawerOpen] = useState(false)
  const [registrationDrawerOpen, setRegistrationDrawerOpen] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  const isUrgent = date === getToday()
  const activeProperties = properties.filter((property) => property.status === 'active')
  const pendingProperties = properties.filter((property) => property.status === 'pending_activation')
  const selectedProperty = activeProperties.find((p) => p.id === selectedPropertyId)
  const timeSlots = getAvailableTimeSlots(date)

  const priceInfo = selectedProperty?.pyeong
    ? calculateCleaningPrice({
        pyeong: selectedProperty.pyeong,
        livingRooms: selectedProperty.livingRooms ?? 0,
        bedrooms: selectedProperty.bedrooms ?? 0,
        bathrooms: selectedProperty.bathrooms ?? 0,
        isUrgent,
      })
    : null
  const estimatedPrice = priceInfo
    ? (isFirstCleaning ? Math.max(priceInfo.total - FIRST_CLEANING_DISCOUNT, 0) : priceInfo.total)
    : 0

  useEffect(() => {
    if (!propertiesLoading && activeProperties.length === 1 && !selectedPropertyId) {
      setSelectedPropertyId(activeProperties[0].id)
      return
    }

    if (!propertiesLoading && selectedPropertyId && !activeProperties.some((property) => property.id === selectedPropertyId)) {
      setSelectedPropertyId(activeProperties[0]?.id ?? '')
    }
  }, [activeProperties, propertiesLoading, selectedPropertyId])

  // When date changes, validate time
  function handleDateSelect(newDate: string) {
    setDate(newDate)
    const slots = getAvailableTimeSlots(newDate)
    if (!slots.includes(time)) {
      setTime(getDefaultTime(newDate))
    }
    setTimeout(() => setDateDrawerOpen(false), 300)
  }

  function handleTimeSelect(newTime: string) {
    setTime(newTime)
    setTimeout(() => setTimeDrawerOpen(false), 300)
  }

  // Create cleaning request → open Toss payment popup
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPropertyId || !user) return
    const minTime = getMinTime(date)
    if (minTime && time < minTime) {
      setTime(minTime)
      return
    }
    setSubmitting(true)
    try {
      // 1. 서버에 주문 생성 (pending_payment)
      const created = await api.post<{
        id: string
        orderId: string
        finalPrice: number
      }>('/cleaning', {
        propertyId: selectedPropertyId,
        scheduledDate: date,
        scheduledTime: time,
        memo: memo || undefined,
        isUrgent,
      })

      // 2. 토스 결제창 띄우기
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
      // 결제창 닫기 or 에러 — submitting 해제
    } finally {
      setSubmitting(false)
    }
  }

  if (propertiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-80px)]">
        <div className="w-6 h-6 rounded-full border-2 border-outline-dim border-t-ink-muted animate-spin" />
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="animate-fade-up-fast flex flex-col items-center justify-center min-h-[calc(100dvh-80px)] px-6 text-center">
        <h2 className="text-[18px] font-semibold text-ink mb-2">
          등록된 숙소가 없어요
        </h2>
        <p className="text-[14px] text-ink-muted leading-relaxed">
          청소를 요청하려면 먼저 숙소를 등록해주세요
        </p>
        <Link
          href="/properties/new"
          className="mt-6 px-5 h-10 rounded-lg bg-brand text-white text-[14px] font-semibold inline-flex items-center justify-center active:scale-[0.98] transition-all"
        >
          숙소 등록하기
        </Link>
      </div>
    )
  }

  if (activeProperties.length === 0) {
    return (
      <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col px-6 pt-6 pb-10">
        <h1 className="text-[22px] font-semibold text-ink mb-6">
          청소 요청
        </h1>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h2 className="text-[18px] font-semibold text-ink mb-2">
            숙소 등록 완료 후 청소를 요청할 수 있어요
          </h2>
          <p className="text-[14px] text-ink-muted leading-relaxed">
            48시간 이내 직접 방문해 숙소 등록을 완료해드려요.
          </p>
          <button
            type="button"
            onClick={() => setRegistrationDrawerOpen(true)}
            className="text-[13px] text-ink-muted underline underline-offset-2 hover:text-ink transition-colors mt-4"
          >
            숙소 등록은 어떻게 진행되나요?
          </button>
        </div>

        <ProcessDrawer
          open={registrationDrawerOpen}
          onOpenChange={setRegistrationDrawerOpen}
          title="숙소 등록 진행 과정"
          steps={PROPERTY_REGISTRATION_STEPS}
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col p-6 pb-0">
      {/* Header */}
      <h1 className="text-[22px] font-semibold text-ink mb-6">
        청소 요청
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Property Selection */}
        {activeProperties.length >= 1 && (
          <div>
            <div className="flex flex-col gap-3">
              {[...activeProperties, ...pendingProperties].map((p) => {
                const selected = p.status === 'active' && selectedPropertyId === p.id
                const disabled = p.status === 'pending_activation'
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (disabled) {
                        toast.info('등록 완료 후 청소를 요청할 수 있어요.')
                        return
                      }
                      setSelectedPropertyId(p.id)
                    }}
                    className={cn(
                      'w-full text-left transition-all active:scale-[0.99]',
                      disabled && 'opacity-70'
                    )}
                    aria-disabled={disabled}
                  >
                    <PropertyCard property={p} selected={selected} />
                  </button>
                )
              })}
            </div>
            <div className="flex justify-end mt-2">
              <Link
                href="/properties/new"
                className="text-[13px] text-ink-muted underline underline-offset-2 hover:text-ink transition-colors"
              >
                + 숙소 추가
              </Link>
            </div>
          </div>
        )}

        {/* Date & Time */}
        <div>
          <CompoundInput>
            {/* Date field — tappable */}
            <button
              type="button"
              className="w-full text-left"
              onClick={() => setDateDrawerOpen(true)}
            >
              <CompoundField
                label="희망 날짜"
                borderRadius="12px 12px 0 0"
              >
                <span className="block w-full text-[16px] text-ink" style={{ fontFamily: 'var(--font-body)' }}>
                  {formatDateLabel(date)}
                </span>
              </CompoundField>
            </button>

            {/* Time field — tappable */}
            <button
              type="button"
              className="w-full text-left"
              onClick={() => setTimeDrawerOpen(true)}
            >
              <CompoundField
                label="희망 시간"
                borderRadius="0 0 12px 12px"
              >
                <span className="block w-full text-[16px] text-ink" style={{ fontFamily: 'var(--font-body)' }}>
                  {formatTimeKorean(time)}
                </span>
              </CompoundField>
            </button>
          </CompoundInput>

          {isUrgent && (
            <p className="text-[13px] text-brand mt-2 px-1">
              당일 청소는 긴급 청소로 진행되며 별도 할증이 적용됩니다.
            </p>
          )}
        </div>

        {/* Memo */}
        <CompoundInput>
          <FloatingTextarea
            label="메모 (선택)"
            placeholder="특이사항이 있으면 알려주세요"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            borderRadius="12px"
          />
        </CompoundInput>

        {/* Price estimate */}
        {priceInfo && (
          <div className="rounded-xl border border-ink-faint px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-ink-muted">
                {isUrgent ? '긴급 청소 금액' : '청소 금액'}
              </span>
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
            {isFirstCleaning && (
              <p className="text-[12px] text-brand mt-1.5 text-right">
                첫 청소 {FIRST_CLEANING_DISCOUNT.toLocaleString()}원 할인 적용
              </p>
            )}
            {isUrgent && (
              <p className="text-[12px] text-ink-muted mt-1">
                긴급 할증 50% 포함
              </p>
            )}
          </div>
        )}

        {/* Pricing info */}
        {priceInfo && <>
          <button
            type="button"
            onClick={() => setPricingDrawerOpen(true)}
            className="text-[13px] text-ink-muted underline underline-offset-2 hover:text-ink transition-colors -mt-3"
          >
            청소 금액은 어떻게 계산되나요?
          </button>
          <Drawer open={pricingDrawerOpen} onOpenChange={setPricingDrawerOpen}>
          <DrawerContent>
            <div className="w-full px-5 pb-8 overflow-y-auto">
              <DrawerHeader className="px-0">
                <DrawerTitle className="text-[18px] font-semibold text-ink">
                  청소 금액 안내
                </DrawerTitle>
              </DrawerHeader>

              <div className="flex flex-col gap-5 mt-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-2">기본 요금</p>
                  <div className="rounded-lg bg-surface-subtle px-4 py-3 text-[14px] text-ink leading-relaxed">
                    숙소 면적(평수)에 따라 기본 청소 비용이 산정돼요.
                    <span className="block text-[13px] text-ink-muted mt-1">10평 이하 2,500원/평 · 11~20평 2,200원/평 · 21평+ 2,000원/평</span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-2">추가 요금</p>
                  <div className="rounded-lg bg-surface-subtle px-4 py-3 text-[14px] text-ink leading-relaxed">
                    방과 욕실 수에 따라 추가 비용이 발생해요.
                    <span className="block text-[13px] text-ink-muted mt-1">침실 1개당 8,000원 · 욕실 1개당 10,000원</span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-2">포함 서비스</p>
                  <div className="rounded-lg bg-surface-subtle px-4 py-3 text-[14px] text-ink leading-relaxed">
                    호텔식 침구 세팅과 15항목 시설 점검 리포트가 기본 포함돼요.
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-2">긴급 청소</p>
                  <div className="rounded-lg bg-surface-subtle px-4 py-3 text-[14px] text-ink leading-relaxed">
                    당일 요청 시 긴급 청소로 진행되며, 50% 할증이 적용돼요.
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-2">최소 금액</p>
                  <div className="rounded-lg bg-surface-subtle px-4 py-3 text-[14px] text-ink leading-relaxed">
                    기본 청소 요금은 최소 35,000원부터 시작해요.
                  </div>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
        </>}

        {/* Submit */}
        <LoadingButton
          type="submit"
          variant="primary"
          loading={submitting}
          loadingText="결제 진행 중..."
          disabled={!selectedPropertyId && !propertiesLoading}
        >
          {!selectedPropertyId
            ? '숙소를 선택해주세요'
            : estimatedPrice > 0
              ? `${estimatedPrice.toLocaleString()}원 결제하기`
              : '결제하기'}
        </LoadingButton>
      </form>

      {/* Date Picker Drawer — Calendar */}
      <Drawer open={dateDrawerOpen} onOpenChange={setDateDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left px-4 pt-4 pb-2">
            <DrawerTitle className="text-[18px] font-semibold text-ink">
              날짜 선택
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <CalendarPicker
              selected={date}
              onSelect={handleDateSelect}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Time Picker Drawer */}
      <Drawer open={timeDrawerOpen} onOpenChange={setTimeDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left px-4 pt-4 pb-2">
            <DrawerTitle className="text-[18px] font-semibold text-ink">
              시간 선택
            </DrawerTitle>
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
                  onClick={() => !isDisabled && handleTimeSelect(t)}
                  className={cn(
                    'w-full flex items-center justify-between py-3 px-4 text-[15px] transition-colors',
                    i > 0 && 'border-t border-outline-dim',
                    isDisabled
                      ? 'text-outline-strong cursor-default'
                      : isSelected
                        ? 'font-semibold text-ink'
                        : 'text-ink hover:bg-surface-soft active:bg-surface-dim'
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
    </div>
  )
}
