'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function CleaningFailPage() {
  const searchParams = useSearchParams()

  const code = searchParams.get('code') || ''
  const message = searchParams.get('message') || '결제 중 문제가 발생했어요'

  const isCancelled = code === 'PAY_PROCESS_CANCELED'

  return (
    <div className="animate-fade-up-fast flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
      <h2 className="text-[20px] font-semibold text-[#222222] mb-2">
        {isCancelled ? '결제가 취소되었어요' : '결제에 실패했어요'}
      </h2>
      <p className="text-[14px] text-[#717171] leading-relaxed mb-8">
        {isCancelled
          ? '청소 요청 페이지로 돌아가 다시 시도할 수 있어요'
          : message}
      </p>
      <Link
        href="/cleaning"
        className="px-6 h-12 rounded-lg bg-[#222222] text-white text-[15px] font-semibold inline-flex items-center justify-center active:scale-[0.98] transition-all"
      >
        {isCancelled ? '돌아가기' : '다시 시도하기'}
      </Link>
    </div>
  )
}
