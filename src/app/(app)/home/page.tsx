'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-provider'
import { useProfile } from '@/lib/hooks/use-profile'
import { useProperties } from '@/lib/hooks/use-properties'
import { useCleaningRequests } from '@/lib/hooks/use-cleaning'
import { Logo } from '@/components/logo'
import { BellIcon, CalendarIcon, ClockIcon, MapPinIcon } from 'lucide-react'
import { formatDateLabel, formatTimeKorean } from '@/lib/utils'
import { PropertyCard } from '@/components/property-card'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '매니저 배정 중', color: 'bg-[#FFF1F3] text-brand' },
  confirmed: { label: '매니저 배정 완료', color: 'bg-[#E8F5E9] text-[#2E7D32]' },
  in_progress: { label: '청소 진행 중', color: 'bg-[#E3F2FD] text-[#1565C0]' },
  completed: { label: '청소 완료', color: 'bg-[#F7F7F7] text-[#222222]' },
}

export default function HomePage() {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { data: properties = [], isLoading: propertiesLoading } = useProperties()
  const { data: cleaningRequests = [], isLoading: cleaningLoading } = useCleaningRequests()
  const [processOpen, setProcessOpen] = useState(false)

  const displayName = profile?.fullName || user?.user_metadata?.full_name || ''
  const today = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date())

  // pending_payment, cancelled 제외
  const upcoming = cleaningRequests.filter(
    (r) => r.status !== 'pending_payment' && r.status !== 'cancelled'
  )
  const activeProperties = properties.filter((property) => property.status === 'active')
  const pendingProperties = properties.filter((property) => property.status === 'pending_activation')
  const showPendingActivation = activeProperties.length === 0 && pendingProperties.length > 0

  const steps = [
    { num: 1, title: '청소 요청 및 결제', desc: '숙소와 희망 일시를 선택하고 청소를 요청해요.' },
    { num: 2, title: '매니저 배정', desc: '비앤비서 전문 매니저가 배정되면 알림을 보내드려요.' },
    { num: 3, title: '호텔식 청소 + 시설 점검', desc: '호텔식 침구 세팅과 15항목 시설 점검을 진행해요.' },
    { num: 4, title: '점검 리포트 수신', desc: '청소 완료 후 사진과 함께 시설 점검 리포트를 받아요.' },
  ]

  if (cleaningLoading || propertiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-80px)]">
        <div className="w-6 h-6 rounded-full border-2 border-[#EBEBEB] border-t-[#717171] animate-spin" />
      </div>
    )
  }

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

      {showPendingActivation ? (
        <div className="px-6 pt-6 pb-8 flex flex-col gap-4">
          <div className="rounded-2xl bg-[#FFF8EF] px-5 py-5">
            <div className="inline-flex rounded-full bg-[#FFE7C2] px-2.5 py-1 text-[11px] font-semibold text-[#9A5B00]">
              등록 대기
            </div>
            <h2 className="mt-3 text-[18px] font-semibold text-[#222222]">
              등록 완료 전에는 청소 요청을 할 수 없어요
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[#717171]">
              숙소 등록 후 48시간 이내에 비앤비서가 직접 방문해 운영 정보를 확인하고 등록을 완료해드려요.
            </p>
            <p className="mt-3 text-[13px] text-[#717171]">
              현장에서 출입 정보, 도어락, 와이파이, 시설 정보를 함께 확인합니다.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[13px] font-medium text-[#717171] px-1">등록 대기 숙소</p>
            {pendingProperties.map((property) => (
              <div key={property.id} className="rounded-xl border border-[#EBEBEB] bg-white">
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        </div>
      ) : upcoming.length > 0 ? (
        /* ─── Upcoming Cleanings ─── */
        <div className="px-6 pt-6 flex flex-col gap-3">
          <p className="text-[13px] font-medium text-[#717171] px-1">청소 내역</p>
          {upcoming.map((r) => {
            const statusInfo = STATUS_LABELS[r.status]
            return (
              <Link
                key={r.id}
                href={`/cleaning/${r.id}`}
                className="rounded-xl border border-[#EBEBEB] px-4 py-4 flex flex-col gap-2.5 active:scale-[0.99] transition-all"
              >
                {/* Status badge + property name */}
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-[#222222]">
                    {r.propertyName || '숙소'}
                  </span>
                  {statusInfo && (
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  )}
                </div>

                {/* Date & Time */}
                <div className="flex items-center gap-4 text-[13px] text-[#717171]">
                  <span className="flex items-center gap-1">
                    <CalendarIcon size={13} strokeWidth={1.5} />
                    {formatDateLabel(r.scheduledDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon size={13} strokeWidth={1.5} />
                    {formatTimeKorean(r.scheduledTime)}
                  </span>
                </div>

                {/* Address */}
                {r.propertyAddress && (
                  <p className="text-[12px] text-[#B0B0B0] flex items-center gap-1">
                    <MapPinIcon size={12} strokeWidth={1.5} />
                    {r.propertyAddress}
                  </p>
                )}
              </Link>
            )
          })}

        </div>
      ) : (
        /* ─── Empty State ─── */
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
      )}

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
