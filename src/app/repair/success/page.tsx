'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CalendarIcon, ClockIcon, CreditCardIcon, HomeIcon } from 'lucide-react'
import { api } from '@/lib/api-client'
import { useInvalidateRepair } from '@/lib/hooks/use-repair'
import { formatDateLabel, formatTimeKorean } from '@/lib/utils'

type Status = 'confirming' | 'success' | 'error'

type RepairResult = {
  id: string
  scheduledDate: string | null
  scheduledTime: string | null
  quotedCost: number | null
  property: {
    name: string
    address: string
    addressDetail: string | null
  } | null
}

export default function RepairSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="w-6 h-6 rounded-full border-2 border-outline-dim border-t-ink-muted animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const invalidateRepair = useInvalidateRepair()

  const [status, setStatus] = useState<Status>('confirming')
  const [errorMessage, setErrorMessage] = useState('')
  const [repair, setRepair] = useState<RepairResult | null>(null)

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')
    const amount = searchParams.get('amount')
    const repairId = searchParams.get('repairId')

    if (!paymentKey || !orderId || !amount || !repairId) {
      setStatus('error')
      setErrorMessage('결제 정보가 올바르지 않아요')
      return
    }

    async function confirmPayment() {
      try {
        const result = await api.post<RepairResult>(`/repair/${repairId}/confirm-payment`, {
          paymentKey,
          orderId,
          amount: Number(amount),
        })
        setRepair(result)
        await invalidateRepair()
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
        <div className="w-8 h-8 rounded-full border-2 border-outline-dim border-t-ink-muted animate-spin mb-5" />
        <p className="text-[15px] text-ink-muted">결제를 확인하고 있어요...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="animate-fade-up-fast flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
        <h2 className="text-[20px] font-semibold text-ink mb-2">
          결제 승인에 실패했어요
        </h2>
        <p className="text-[14px] text-ink-muted leading-relaxed mb-8">
          {errorMessage}
        </p>
        <Link
          href="/repair"
          className="px-6 h-12 rounded-lg bg-ink text-white text-[15px] font-semibold inline-flex items-center justify-center active:scale-[0.98] transition-all"
        >
          수리 목록으로
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast min-h-[100dvh] flex flex-col px-6 pt-6 pb-10 mx-auto max-w-[480px]">
      <h1 className="text-[22px] font-semibold text-ink mb-2">
        결제가 완료되었어요
      </h1>
      <p className="text-[14px] text-ink-muted mb-6">
        방문 일정이 최종 확정되었어요
      </p>

      {repair && (
        <div className="rounded-xl border border-outline-dim px-4 py-4 flex flex-col gap-3 mb-8">
          {repair.property && (
            <div className="flex items-center gap-2.5">
              <HomeIcon size={16} className="text-ink-muted shrink-0" strokeWidth={1.5} />
              <span className="text-[14px] text-ink font-medium">{repair.property.name}</span>
            </div>
          )}
          {repair.scheduledDate && (
            <div className="flex items-center gap-2.5">
              <CalendarIcon size={16} className="text-ink-muted shrink-0" strokeWidth={1.5} />
              <span className="text-[14px] text-ink">
                {formatDateLabel(repair.scheduledDate)}
              </span>
            </div>
          )}
          {repair.scheduledTime && (
            <div className="flex items-center gap-2.5">
              <ClockIcon size={16} className="text-ink-muted shrink-0" strokeWidth={1.5} />
              <span className="text-[14px] text-ink">
                {formatTimeKorean(repair.scheduledTime)}
              </span>
            </div>
          )}
          {repair.quotedCost != null && (
            <div className="flex items-center gap-2.5">
              <CreditCardIcon size={16} className="text-ink-muted shrink-0" strokeWidth={1.5} />
              <span className="text-[14px] text-ink">
                {repair.quotedCost.toLocaleString()}원
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto pt-6 flex flex-col gap-2">
        <Link
          href={repair ? `/repair/${repair.id}` : '/repair'}
          className="w-full h-12 rounded-lg bg-ink text-white text-[15px] font-semibold flex items-center justify-center active:scale-[0.98] transition-all"
        >
          요청 상세 보기
        </Link>
        <Link
          href="/home"
          className="w-full h-12 rounded-lg text-[15px] font-semibold text-ink-muted flex items-center justify-center active:bg-surface-soft transition-colors"
        >
          홈으로
        </Link>
      </div>
    </div>
  )
}
