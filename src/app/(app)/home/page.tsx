'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-provider'
import { useProfile } from '@/lib/hooks/use-profile'
import { useProperties } from '@/lib/hooks/use-properties'
import { useCleaningRequests } from '@/lib/hooks/use-cleaning'
import { Logo } from '@/components/logo'
import { BellIcon } from 'lucide-react'
import { HostCleaningRequestCard } from '@/components/host-cleaning-request-card'
import { CLEANING_PROCESS_STEPS, PROPERTY_REGISTRATION_STEPS } from '@/lib/process-steps'
import { PropertyCard } from '@/components/property-card'
import { PendingActivationPanel } from '@/components/pending-activation-panel'
import { ProcessDrawer } from '@/components/process-drawer'
import { nowKST } from '@/lib/utils'

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()
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

  const now = nowKST()
  const homeCleanings = cleaningRequests
    .filter((r) => ['pending', 'confirmed', 'in_progress', 'completed'].includes(r.status))
    .filter((r) => {
      if (r.status === 'completed') return true
      const scheduledAt = new Date(`${r.scheduledDate}T${r.scheduledTime}:00+09:00`)
      return scheduledAt >= now
    })
    .sort((a, b) => {
      const aTime = new Date(`${a.scheduledDate}T${a.scheduledTime}:00+09:00`).getTime()
      const bTime = new Date(`${b.scheduledDate}T${b.scheduledTime}:00+09:00`).getTime()
      return aTime - bTime
    })
  const visibleHomeCleanings = homeCleanings.slice(0, 3)
  const activeProperties = properties.filter((property) => property.status === 'active')
  const pendingProperties = properties.filter((property) => property.status === 'pending_activation')
  const allProperties = [...activeProperties, ...pendingProperties]
  const hasNoProperties = allProperties.length === 0
  const showPendingOnlyState = activeProperties.length === 0 && pendingProperties.length > 0

  function renderPropertyList() {
    return (
      <div className="mt-5">
        <div className="flex flex-col gap-3">
          <p className="px-1 text-left text-[13px] font-medium text-ink-muted">내 숙소</p>
          {allProperties.map((property) => (
            <Link
              key={property.id}
              href={`/my/properties/${property.id}?from=home`}
              className="block transition-transform active:scale-[0.99]"
            >
              <PropertyCard property={property} />
            </Link>
          ))}
        </div>
        {pendingProperties.length > 0 && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setRegistrationProcessOpen(true)}
              className="text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
            >
              숙소 등록은 어떻게 진행되나요?
            </button>
          </div>
        )}
      </div>
    )
  }

  const isPageLoading =
    authLoading ||
    profileLoading ||
    propertiesLoading ||
    cleaningLoading ||
    !user ||
    !profile

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-80px)]">
        <div className="w-6 h-6 rounded-full border-2 border-outline-dim border-t-ink-muted animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <Logo className="text-[20px]" />
        <button className="text-ink">
          <BellIcon size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Greeting */}
      <div className="px-6 pt-4 pb-2">
        <h1 className="text-[22px] font-semibold text-ink">
          안녕하세요, {displayName}님
        </h1>
        <p className="text-[14px] text-ink-muted mt-1">{today}</p>
      </div>

      {hasNoProperties ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pt-6 pb-10 text-center">
          <Image
            src="/images/empty.png"
            alt="숙소 등록 안내"
            width={220}
            height={220}
            priority
            className="mb-6 object-contain"
          />
          <h2 className="mb-2 text-[18px] font-semibold text-ink">
            등록된 숙소가 없어요
          </h2>
          <Link
            href="/properties/new?from=home"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-brand px-5 text-[14px] font-semibold text-white transition-all active:scale-[0.98] md:hover:-translate-y-0.5 md:hover:bg-brand/90 md:hover:shadow-[0_10px_24px_rgba(255,56,92,0.2)]"
          >
            숙소 등록하기
          </Link>
        </div>
      ) : showPendingOnlyState ? (
        <div className="px-6 pt-6 pb-8">
          <PendingActivationPanel
            title="숙소 등록을 진행하고 있어요"
            description="48시간 이내 직접 방문해 숙소 등록을 완료해드려요."
            properties={pendingProperties}
            action={
              <button
                type="button"
                onClick={() => setRegistrationProcessOpen(true)}
                className="text-[13px] text-ink-muted underline underline-offset-2 hover:text-ink transition-colors mt-4"
              >
                숙소 등록은 어떻게 진행되나요?
              </button>
            }
          />
        </div>
      ) : (
        <div className="px-6 pt-6 pb-8 flex flex-col gap-3">
          {homeCleanings.length > 0 ? (
            <>
              <p className="px-1 text-[13px] font-medium text-ink-muted">청소 내역</p>
              {visibleHomeCleanings.map((r) => (
                <HostCleaningRequestCard
                  key={r.id}
                  request={r}
                  href={`/cleaning/${r.id}`}
                />
              ))}
              {homeCleanings.length > 3 && (
                <div className="flex justify-center pt-1">
                  <Link
                    href="/my/cleaning-history"
                    className="text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
                  >
                    더 보기
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <Image
                src="/images/cleaning-white.png"
                alt="청소 서비스"
                width={240}
                height={120}
                priority
                className="mb-5 object-contain"
              />
              <h2 className="mb-2 text-[18px] font-semibold text-ink">
                처음 오셨나요?
              </h2>
              <p className="text-[14px] leading-relaxed text-ink-muted">
                10,000원 할인을 받고 첫 청소를 요청해보세요!
              </p>
              <Link
                href="/cleaning"
                className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-brand px-5 text-[14px] font-semibold text-white transition-all active:scale-[0.98] md:hover:-translate-y-0.5 md:hover:bg-brand/90 md:hover:shadow-[0_10px_24px_rgba(255,56,92,0.2)]"
              >
                청소 요청하기
              </Link>
              <button
                type="button"
                onClick={() => setProcessOpen(true)}
                className="mt-4 text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
              >
                청소는 어떻게 진행되나요?
              </button>
            </div>
          )}

          {allProperties.length > 0 && (
            renderPropertyList()
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
