'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-provider'
import { Logo } from '@/components/logo'
import { BellIcon } from 'lucide-react'

export default function HomePage() {
  const { user } = useAuth()

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  const today = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date())

  return (
    <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <Logo className="text-[20px]" />
        <button className="text-[#222222]">
          <BellIcon size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Greeting */}
      <div className="px-6 pt-4 pb-2">
        <h1 className="text-[22px] font-semibold text-[#222222]">
          안녕하세요, {displayName}님
        </h1>
        <p className="text-[14px] text-[#717171] mt-1">{today}</p>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-8">
        <Image
          src="/images/cleaning-white.png"
          alt="청소 서비스"
          width={240}
          height={120}
          priority
          className="mb-5 object-contain"
        />
        <h2 className="text-[18px] font-semibold text-[#222222] mb-2">
          처음 오셨나요?
        </h2>
        <p className="text-[14px] text-[#717171] leading-relaxed">
          10,000원 할인을 받고 첫 청소를 요청해보세요!
        </p>
        <Link
          href="/cleaning"
          className="px-5 h-10 rounded-lg bg-brand text-white text-[14px] font-semibold inline-flex items-center justify-center mt-6 active:scale-[0.98] transition-all"
        >
          청소 요청하기
        </Link>
      </div>
    </div>
  )
}
