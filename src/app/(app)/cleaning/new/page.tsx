'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

const SERVICE_CARDS = [
  {
    href: '/cleaning/new/general',
    emoji: '🧹',
    title: '일반 청소',
    desc: '숙소 전체를 청소하고 시설 상태를 점검해드려요.',
  },
  {
    href: '/cleaning/new/ac',
    emoji: '❄️',
    title: '에어컨 청소',
    desc: '선택하신 에어컨을 꼼꼼하게 청소해드려요.',
  },
] as const

export default function NewCleaningTypeSelectPage() {
  const router = useRouter()

  return (
    <div className="animate-fade-up-fast flex min-h-[calc(100dvh-80px)] flex-col px-6 pt-6 pb-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-3 -ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
      >
        <ChevronLeftIcon size={32} />
      </button>
      <h1 className="text-[22px] font-semibold text-ink mb-2">청소 유형 선택</h1>
      <p className="text-[14px] text-ink-muted mb-6">
        어떤 청소를 요청하시겠어요?
      </p>

      <div className="flex flex-col gap-3">
        {SERVICE_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex items-center gap-4 rounded-2xl border border-outline-dim p-5 transition-all active:scale-[0.99] hover:border-outline-strong hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)]"
          >
            <span className="text-[36px] leading-none">{card.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-semibold text-ink">{card.title}</p>
              <p className="mt-1 text-[13px] text-ink-muted">{card.desc}</p>
            </div>
            <ChevronRightIcon size={20} className="text-ink-muted shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
