'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircleIcon, CheckIcon } from 'lucide-react'
import { CalendarPicker } from '@/components/calendar-picker'
import { PropertyCard } from '@/components/property-card'
import { cn, getToday, getTomorrow, formatDateLabel, formatTimeKorean, ALL_TIME_SLOTS, getMinTime, getAvailableTimeSlots, getDefaultTime } from '@/lib/utils'
import { calculateCleaningPrice, FIRST_CLEANING_DISCOUNT } from '@/lib/cleaning-pricing'
import { useProperties } from '@/lib/hooks/use-properties'
import { useCleaningRequests, useInvalidateCleaning } from '@/lib/hooks/use-cleaning'
import { api } from '@/lib/api-client'
import { CompoundInput, CompoundField, FloatingTextarea } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading-button'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CleaningPage() {
  const searchParams = useSearchParams()
  const { data: properties = [], isLoading: propertiesLoading } = useProperties()
  const { data: cleaningHistory = [] } = useCleaningRequests()
  const invalidateCleaning = useInvalidateCleaning()

  const isFirstCleaning = cleaningHistory.length === 0

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(searchParams.get('propertyId') ?? '')
  const [date, setDate] = useState(getTomorrow())
  const [time, setTime] = useState('11:00')
  const [memo, setMemo] = useState('')

  const [dateDrawerOpen, setDateDrawerOpen] = useState(false)
  const [timeDrawerOpen, setTimeDrawerOpen] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const isUrgent = date === getToday()
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId)
  const timeSlots = getAvailableTimeSlots(date)

  useEffect(() => {
    if (!propertiesLoading && properties.length === 1 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id)
    }
  }, [properties, propertiesLoading, selectedPropertyId])

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPropertyId) return
    const minTime = getMinTime(date)
    if (minTime && time < minTime) {
      setTime(minTime)
      return
    }
    setSubmitting(true)
    try {
      await api.post('/cleaning', {
        propertyId: selectedPropertyId,
        scheduledDate: date,
        scheduledTime: time,
        memo: memo || undefined,
        isUrgent,
      })
      await invalidateCleaning()
      setSuccess(true)
    } catch {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="animate-fade-up-fast flex flex-col items-center justify-center min-h-[calc(100dvh-80px)] px-6 text-center">
        <CheckCircleIcon size={56} className="text-brand mb-5" strokeWidth={1.5} />
        <h2 className="text-[20px] font-semibold text-[#222222] mb-2">
          청소 요청이 완료되었어요
        </h2>
        <p className="text-[14px] text-[#717171] leading-relaxed">
          매니저 배정 후 알림을 보내드릴게요
        </p>
        <Link
          href="/home"
          className="mt-8 px-6 h-12 rounded-lg bg-[#222222] text-white text-[15px] font-semibold inline-flex items-center justify-center active:scale-[0.98] transition-all"
        >
          홈으로
        </Link>
      </div>
    )
  }

  if (propertiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-80px)]">
        <div className="w-6 h-6 rounded-full border-2 border-[#EBEBEB] border-t-[#717171] animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col px-6 pt-6 pb-10">
      {/* Header */}
      <h1 className="text-[22px] font-semibold text-[#222222] mb-6">
        청소 요청
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Property Selection */}
        {properties.length >= 1 && (
          <div>
            <p className="text-[13px] font-medium text-[#717171] mb-2 px-1">
              숙소 선택
            </p>
            <div className="flex flex-col gap-2">
              {properties.map((p) => {
                const selected = selectedPropertyId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPropertyId(p.id)}
                    className={cn(
                      'w-full text-left rounded-xl border transition-all active:scale-[0.99]',
                      selected ? 'border-[#222222]' : 'border-[#EBEBEB] hover:border-[#B0B0B0]'
                    )}
                  >
                    <PropertyCard property={p} selected={selected} />
                  </button>
                )
              })}
            </div>
            <div className="flex justify-end mt-2">
              <Link
                href="/properties/new"
                className="text-[13px] text-[#717171] underline underline-offset-2 hover:text-[#222222] transition-colors"
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
                <span className="block w-full text-[16px] text-[#222222]" style={{ fontFamily: 'var(--font-body)' }}>
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
                <span className="block w-full text-[16px] text-[#222222]" style={{ fontFamily: 'var(--font-body)' }}>
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
        {selectedProperty?.pyeong && (() => {
          const price = calculateCleaningPrice({
            pyeong: selectedProperty.pyeong,
            bedrooms: selectedProperty.bedrooms,
            bathrooms: selectedProperty.bathrooms,
            isUrgent,
          })
          const discountedTotal = isFirstCleaning
            ? Math.max(price.total - FIRST_CLEANING_DISCOUNT, 0)
            : price.total

          return (
            <div className="rounded-xl border border-[#EBEBEB] px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#717171]">
                  {isUrgent ? '긴급 청소 예상 금액' : '예상 청소 금액'}
                </span>
                <div className="text-right">
                  {isFirstCleaning && (
                    <span className="text-[14px] text-[#B0B0B0] line-through mr-2">
                      {price.total.toLocaleString()}원
                    </span>
                  )}
                  <span className="text-[20px] font-semibold text-[#222222]">
                    {discountedTotal.toLocaleString()}원
                  </span>
                </div>
              </div>
              {isFirstCleaning && (
                <p className="text-[12px] text-brand mt-1.5 text-right">
                  첫 청소 {FIRST_CLEANING_DISCOUNT.toLocaleString()}원 할인 적용
                </p>
              )}
              {isUrgent && (
                <p className="text-[12px] text-[#717171] mt-1">
                  긴급 할증 50% 포함
                </p>
              )}
            </div>
          )
        })()}

        {/* Pricing info */}
        {selectedProperty?.pyeong && <Drawer>
          <DrawerTrigger asChild>
            <button
              type="button"
              className="text-[13px] text-[#717171] underline underline-offset-2 hover:text-[#222222] transition-colors -mt-3"
            >
              청소 금액은 어떻게 계산되나요?
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-full max-w-[440px] px-6 pb-8 overflow-y-auto">
              <DrawerHeader className="px-0">
                <DrawerTitle className="text-[18px] font-semibold text-[#222222]">
                  청소 금액 안내
                </DrawerTitle>
              </DrawerHeader>

              <div className="flex flex-col gap-5 mt-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#717171] mb-2">기본 요금</p>
                  <div className="rounded-lg bg-[#F7F7F7] px-4 py-3 text-[14px] text-[#222222] leading-relaxed">
                    숙소 면적(평수)에 따라 기본 청소 비용이 산정돼요.
                    <span className="block text-[13px] text-[#717171] mt-1">10평 이하 2,500원/평 · 11~20평 2,200원/평 · 21평+ 2,000원/평</span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#717171] mb-2">추가 요금</p>
                  <div className="rounded-lg bg-[#F7F7F7] px-4 py-3 text-[14px] text-[#222222] leading-relaxed">
                    방과 욕실 수에 따라 추가 비용이 발생해요.
                    <span className="block text-[13px] text-[#717171] mt-1">방 1개당 8,000원 · 욕실 1개당 10,000원</span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#717171] mb-2">포함 서비스</p>
                  <div className="rounded-lg bg-[#F7F7F7] px-4 py-3 text-[14px] text-[#222222] leading-relaxed">
                    호텔식 침구 세팅과 15항목 시설 점검 리포트가 기본 포함돼요.
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#717171] mb-2">긴급 청소</p>
                  <div className="rounded-lg bg-[#F7F7F7] px-4 py-3 text-[14px] text-[#222222] leading-relaxed">
                    당일 요청 시 긴급 청소로 진행되며, 50% 할증이 적용돼요.
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#717171] mb-2">최소 금액</p>
                  <div className="rounded-lg bg-[#F7F7F7] px-4 py-3 text-[14px] text-[#222222] leading-relaxed">
                    기본 청소 요금은 최소 35,000원부터 시작해요.
                  </div>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>}

        {/* Submit */}
        <LoadingButton
          type="submit"
          variant="primary"
          loading={submitting}
          loadingText="요청 중..."
          disabled={!selectedPropertyId && !propertiesLoading}
        >
          청소 요청하기
        </LoadingButton>
      </form>

      {/* Date Picker Drawer — Calendar */}
      <Drawer open={dateDrawerOpen} onOpenChange={setDateDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left px-4 pt-4 pb-2">
            <DrawerTitle className="text-[18px] font-semibold text-[#222222]">
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
            <DrawerTitle className="text-[18px] font-semibold text-[#222222]">
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
                    i > 0 && 'border-t border-[#EBEBEB]',
                    isDisabled
                      ? 'text-[#D0D0D0] cursor-default'
                      : isSelected
                        ? 'font-semibold text-[#222222]'
                        : 'text-[#222222] hover:bg-[#F7F7F7] active:bg-[#F0F0F0]'
                  )}
                >
                  <span>{formatTimeKorean(t)}</span>
                  {isSelected && !isDisabled && (
                    <span className="w-[20px] h-[20px] rounded-full bg-[#222222] flex items-center justify-center shrink-0">
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
