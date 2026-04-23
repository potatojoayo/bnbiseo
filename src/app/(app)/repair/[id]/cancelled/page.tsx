'use client'

import Link from 'next/link'

export default function RepairCancelledPage() {
  return (
    <div className="animate-fade-up-fast flex flex-col items-center justify-center min-h-[calc(100dvh-80px)] px-6 text-center">
      <h2 className="mb-2 text-[20px] font-semibold text-ink">
        수리 요청이 취소되었어요
      </h2>
      <p className="text-[14px] leading-relaxed text-ink-muted">
        결제하신 금액이 있다면 곧 환불될 예정입니다
      </p>
      <Link
        href="/repair"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-ink px-6 text-[15px] font-semibold text-white transition-all active:scale-[0.98]"
      >
        수리 목록으로
      </Link>
    </div>
  )
}
