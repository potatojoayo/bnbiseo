'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CalendarIcon, ClockIcon, MapPinIcon, CreditCardIcon, HomeIcon, MessageSquareTextIcon } from 'lucide-react'
import { api } from '@/lib/api-client'
import { useInvalidateCleaning } from '@/lib/hooks/use-cleaning'
import { formatDateLabel, formatTimeKorean } from '@/lib/utils'

type Status = 'confirming' | 'success' | 'error'

type CleaningResult = {
  id: string
  scheduledDate: string
  scheduledTime: string
  finalPrice: number
  discount: number
  cleaningType: string
  memo: string | null
  property: {
    name: string
    address: string
    addressDetail: string | null
    pyeong: number | null
    bedrooms: number
    bathrooms: number
  } | null
}

const steps = [
  { num: 1, title: '결제 완료', desc: '청소 요청과 결제가 완료되었어요.' },
  { num: 2, title: '매니저 배정', desc: '비앤비서 전문 매니저가 배정되면 알림을 보내드려요.' },
  { num: 3, title: '호텔식 청소 + 시설 점검', desc: '호텔식 침구 세팅과 15항목 시설 점검을 진행해요.' },
  { num: 4, title: '점검 리포트 수신', desc: '청소 완료 후 사진과 함께 시설 점검 리포트를 받아요.' },
]

export default function CleaningSuccessPage() {
  const searchParams = useSearchParams()
  const invalidateCleaning = useInvalidateCleaning()

  const [status, setStatus] = useState<Status>('confirming')
  const [errorMessage, setErrorMessage] = useState('')
  const [cleaning, setCleaning] = useState<CleaningResult | null>(null)

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')
    const amount = searchParams.get('amount')

    if (!paymentKey || !orderId || !amount) {
      setStatus('error')
      setErrorMessage('결제 정보가 올바르지 않아요')
      return
    }

    async function confirmPayment() {
      try {
        const result = await api.post<CleaningResult>('/cleaning/confirm', {
          paymentKey,
          orderId,
          amount: Number(amount),
        })
        setCleaning(result)
        await invalidateCleaning()
        setStatus('success')
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '결제 승인에 실패했어요'
        setErrorMessage(message)
        setStatus('error')
      }
    }

    confirmPayment()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'confirming') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#EBEBEB] border-t-[#717171] animate-spin mb-5" />
        <p className="text-[15px] text-[#717171]">결제를 확인하고 있어요...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="animate-fade-up-fast flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
        <h2 className="text-[20px] font-semibold text-[#222222] mb-2">
          결제 승인에 실패했어요
        </h2>
        <p className="text-[14px] text-[#717171] leading-relaxed mb-8">
          {errorMessage}
        </p>
        <Link
          href="/cleaning"
          className="px-6 h-12 rounded-lg bg-[#222222] text-white text-[15px] font-semibold inline-flex items-center justify-center active:scale-[0.98] transition-all"
        >
          다시 시도하기
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast min-h-[100dvh] flex flex-col px-6 pt-6 pb-10 mx-auto max-w-[480px]">
      {/* Title */}
      <h1 className="text-[22px] font-semibold text-[#222222] mb-2">
        청소 요청이 완료되었어요
      </h1>
      <p className="text-[14px] text-[#717171] mb-6">
        매니저 배정 후 알림을 보내드려요
      </p>

      {/* Cleaning summary card */}
      {cleaning && (
        <div className="rounded-xl border border-[#EBEBEB] px-4 py-4 flex flex-col gap-3 mb-8">
          {cleaning.property && (
            <div className="flex items-center gap-2.5">
              <HomeIcon size={16} className="text-[#717171] shrink-0" strokeWidth={1.5} />
              <div className="text-[14px] text-[#222222]">
                <span className="font-medium">{cleaning.property.name}</span>
                {cleaning.property.pyeong && (
                  <span className="text-[#717171] ml-1.5 text-[12px]">
                    {cleaning.property.pyeong}평 · 방 {cleaning.property.bedrooms} · 욕실 {cleaning.property.bathrooms}
                  </span>
                )}
              </div>
            </div>
          )}
          {cleaning.property && (
            <div className="flex items-center gap-2.5">
              <MapPinIcon size={16} className="text-[#717171] shrink-0" strokeWidth={1.5} />
              <span className="text-[13px] text-[#717171]">
                {cleaning.property.address}
                {cleaning.property.addressDetail && ` ${cleaning.property.addressDetail}`}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <CalendarIcon size={16} className="text-[#717171] shrink-0" strokeWidth={1.5} />
            <span className="text-[14px] text-[#222222]">
              {formatDateLabel(cleaning.scheduledDate)}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <ClockIcon size={16} className="text-[#717171] shrink-0" strokeWidth={1.5} />
            <span className="text-[14px] text-[#222222]">
              {formatTimeKorean(cleaning.scheduledTime)}
              {cleaning.cleaningType === 'urgent' && (
                <span className="text-brand ml-1.5 text-[12px]">긴급</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <CreditCardIcon size={16} className="text-[#717171] shrink-0" strokeWidth={1.5} />
            <span className="text-[14px] text-[#222222]">
              {cleaning.finalPrice.toLocaleString()}원
              {cleaning.discount > 0 && (
                <span className="text-brand ml-1.5 text-[12px]">
                  {cleaning.discount.toLocaleString()}원 할인
                </span>
              )}
            </span>
          </div>
          {cleaning.memo && (
            <div className="flex items-start gap-2.5">
              <MessageSquareTextIcon size={16} className="text-[#717171] shrink-0 mt-0.5" strokeWidth={1.5} />
              <span className="text-[14px] text-[#717171]">{cleaning.memo}</span>
            </div>
          )}
        </div>
      )}

      {/* Process timeline */}
      <p className="text-[13px] font-medium text-[#717171] mb-3 px-1">앞으로의 진행 과정</p>
      <div className="flex flex-col gap-0">
        {steps.map((step, i) => (
          <div key={step.num} className="flex gap-3">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-7 h-7 rounded-full text-[13px] font-semibold flex items-center justify-center shrink-0',
                i === 0 ? 'bg-brand text-white' : 'bg-[#222222] text-white'
              )}>
                {step.num}
              </div>
              {i < steps.length - 1 && (
                <div className="w-px flex-1 bg-[#EBEBEB] my-1" />
              )}
            </div>
            {/* Content */}
            <div className="pb-5">
              <p className="text-[15px] font-semibold text-[#222222]">
                {step.title}
                {i === 0 && <span className="text-brand ml-1.5 text-[12px] font-normal">완료</span>}
              </p>
              <p className="text-[13px] text-[#717171] mt-0.5 leading-relaxed">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-auto pt-6">
        <Link
          href="/home"
          className="w-full h-12 rounded-lg bg-[#222222] text-white text-[15px] font-semibold flex items-center justify-center active:scale-[0.98] transition-all"
        >
          홈으로
        </Link>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
