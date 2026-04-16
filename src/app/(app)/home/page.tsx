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
import { CLEANING_PROCESS_STEPS, PROPERTY_REGISTRATION_STEPS } from '@/lib/process-steps'
import { PropertyCard } from '@/components/property-card'
import { PendingActivationPanel } from '@/components/pending-activation-panel'
import { ProcessDrawer } from '@/components/process-drawer'

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
  const [registrationProcessOpen, setRegistrationProcessOpen] = useState(false)

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
  const showPendingOnlyState = activeProperties.length === 0 && pendingProperties.length > 0

  function renderPendingList() {
    return (
      <div className="mt-5">
        <div className="flex flex-col gap-3">
          <p className="px-1 text-left text-[13px] font-medium text-[#717171]">등록 대기 숙소</p>
          {pendingProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={{ ...property, status: 'pending_activation' }}
            />
          ))}
        </div>
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={() => setRegistrationProcessOpen(true)}
            className="text-[13px] text-[#717171] underline underline-offset-2 hover:text-[#222222] transition-colors"
          >
            숙소 등록은 어떻게 진행되나요?
          </button>
        </div>
      </div>
    )
  }

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

      {showPendingOnlyState ? (
        <div className="px-6 pt-6 pb-8">
          <PendingActivationPanel
            title="숙소 등록을 진행하고 있어요"
            description="48시간 이내 직접 방문해 숙소 등록을 완료해드려요."
            properties={pendingProperties}
            action={
              <button
                type="button"
                onClick={() => setRegistrationProcessOpen(true)}
                className="text-[13px] text-[#717171] underline underline-offset-2 hover:text-[#222222] transition-colors mt-4"
              >
                숙소 등록은 어떻게 진행되나요?
              </button>
            }
          />
        </div>
      ) : upcoming.length > 0 ? (
        /* ─── Upcoming Cleanings ─── */
        <div className="px-6 pt-6 pb-8 flex flex-col gap-3">
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
          {pendingProperties.length > 0 && (
            renderPendingList()
          )}
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
          {pendingProperties.length > 0 && (
            <div className="w-full mt-10 text-left">
              {renderPendingList()}
            </div>
          )}
        </div>
      )}

      {/* Process Drawer */}
      <ProcessDrawer
        open={registrationProcessOpen}
        onOpenChange={setRegistrationProcessOpen}
        title="숙소 등록 진행 과정"
        steps={PROPERTY_REGISTRATION_STEPS}
      />

      <ProcessDrawer
        open={processOpen}
        onOpenChange={setProcessOpen}
        title="청소 진행 과정"
        steps={CLEANING_PROCESS_STEPS}
      />
    </div>
  )
}
