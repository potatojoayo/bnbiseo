'use client'

import Link from 'next/link'

export default function CleaningCancelledPage() {
  return (
    <div className="animate-fade-up-fast flex flex-col items-center justify-center min-h-[calc(100dvh-80px)] px-6 text-center">
      <h2 className="text-[20px] font-semibold text-[#222222] mb-2">
        청소 요청이 취소되었어요
      </h2>
      <p className="text-[14px] text-[#717171] leading-relaxed">
        결제 금액은 곧 환불될 예정입니다
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
