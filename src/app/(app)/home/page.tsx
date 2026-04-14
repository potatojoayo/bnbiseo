'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-provider'
import { Logo } from '@/components/logo'
import { BellIcon } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

export default function HomePage() {
  const { user } = useAuth()
  const [processOpen, setProcessOpen] = useState(false)

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  const today = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date())

  const steps = [
    { num: 1, title: '청소 요청 및 결제', desc: '숙소와 희망 일시를 선택하고 청소를 요청해요.' },
    { num: 2, title: '매니저 배정', desc: '비앤비서 전문 매니저가 배정되면 알림을 보내드려요.' },
    { num: 3, title: '호텔식 청소 + 시설 점검', desc: '호텔식 침구 세팅과 15항목 시설 점검을 진행해요.' },
    { num: 4, title: '점검 리포트 수신', desc: '청소 완료 후 사진과 함께 시설 점검 리포트를 받아요.' },
  ]

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
        <button
          type="button"
          onClick={() => setProcessOpen(true)}
          className="text-[13px] text-[#717171] underline underline-offset-2 hover:text-[#222222] transition-colors mt-4"
        >
          청소는 어떻게 진행되나요?
        </button>
      </div>

      {/* Process Drawer */}
      <Drawer open={processOpen} onOpenChange={setProcessOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8 overflow-y-auto">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-[#222222]">
                청소 진행 과정
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-0 mt-2">
              {steps.map((step, i) => (
                <div key={step.num} className="flex gap-3">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-[#222222] text-white text-[13px] font-semibold flex items-center justify-center shrink-0">
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
                    </p>
                    <p className="text-[13px] text-[#717171] mt-0.5 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
