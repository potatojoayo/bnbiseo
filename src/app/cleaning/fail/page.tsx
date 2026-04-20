'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function FailContent() {
  const searchParams = useSearchParams()

  const code = searchParams.get('code') || ''
  const message = searchParams.get('message') || '결제 중 문제가 발생했어요'

  const isCancelled = code === 'PAY_PROCESS_CANCELED'

  return (
    <div className="animate-fade-up-fast flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
      <h2 className="mb-2 text-[20px] font-semibold text-ink">
        {isCancelled ? '결제가 취소되었어요' : '결제에 실패했어요'}
      </h2>
      <p className="mb-8 text-[14px] leading-relaxed text-ink-muted">
        {isCancelled
          ? '청소 요청 페이지로 돌아가 다시 시도할 수 있어요'
          : message}
      </p>
      <Link
        href="/cleaning/new"
        className="inline-flex h-12 items-center justify-center rounded-lg bg-ink px-6 text-[15px] font-semibold text-white transition-all active:scale-[0.98]"
      >
        {isCancelled ? '돌아가기' : '다시 시도하기'}
      </Link>
    </div>
  )
}

export default function CleaningFailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    }>
      <FailContent />
    </Suspense>
  )
}
