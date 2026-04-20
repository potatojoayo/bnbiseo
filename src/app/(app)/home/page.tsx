'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-provider'
import { useProfile } from '@/lib/hooks/use-profile'
import { useProperties } from '@/lib/hooks/use-properties'
import { useCleaningRequests } from '@/lib/hooks/use-cleaning'
import { Logo } from '@/components/logo'
import { useState } from 'react'
import { BellIcon } from 'lucide-react'
import { HostCleaningRequestCard } from '@/components/host-cleaning-request-card'
import { PropertyCard } from '@/components/property-card'
import { ProcessDrawer } from '@/components/process-drawer'
import { PROPERTY_REGISTRATION_STEPS } from '@/lib/process-steps'
import { nowKST } from '@/lib/utils'

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: properties = [], isLoading: propertiesLoading } = useProperties()
  const { data: cleaningRequests = [], isLoading: cleaningLoading } = useCleaningRequests()

  const displayName = profile?.fullName || user?.user_metadata?.full_name || ''
  const today = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date())

  const [registrationProcessOpen, setRegistrationProcessOpen] = useState(false)

  const activeProperties = properties.filter((p) => p.status === 'active')
  const pendingProperties = properties.filter((p) => p.status === 'pending_activation')
  const allProperties = [...activeProperties, ...pendingProperties]

  const now = nowKST()
  const upcomingCleanings = cleaningRequests
    .filter((r) => ['pending', 'confirmed', 'in_progress'].includes(r.status))
    .filter((r) => {
      const scheduledAt = new Date(`${r.scheduledDate}T${r.scheduledTime}:00+09:00`)
      return scheduledAt >= now
    })
    .sort((a, b) => {
      const aTime = new Date(`${a.scheduledDate}T${a.scheduledTime}:00+09:00`).getTime()
      const bTime = new Date(`${b.scheduledDate}T${b.scheduledTime}:00+09:00`).getTime()
      return aTime - bTime
    })
  const visibleUpcoming = upcomingCleanings.slice(0, 3)

  const isPageLoading =
    authLoading ||
    (!!user && (profileLoading || propertiesLoading || cleaningLoading))

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

      <div className="px-6 pt-6 pb-8 flex flex-col gap-6">
        {/* Property List */}
        {allProperties.length > 0 ? (
          <div className="flex flex-col gap-3">
            <p className="px-1 text-[13px] font-medium text-ink-muted">내 숙소</p>
            {allProperties.map((property) => (
              <Link
                key={property.id}
                href={`/my/properties/${property.id}?from=home`}
                className="block transition-transform active:scale-[0.99]"
              >
                <PropertyCard property={property} />
              </Link>
            ))}
            {pendingProperties.length > 0 && (
              <div className="flex justify-center mt-1">
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
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <p className="text-[15px] font-semibold text-ink">
              숙소를 등록하고 서비스를 시작하세요
            </p>
            <p className="text-[13px] text-ink-muted mt-1">
              청소, 수리 등 다양한 관리 서비스를 이용할 수 있어요
            </p>
            <Link
              href="/properties/new"
              className="mt-5 px-5 h-10 rounded-lg bg-brand text-white text-[14px] font-semibold inline-flex items-center justify-center active:scale-[0.98] transition-all"
            >
              숙소 등록하기
            </Link>
          </div>
        )}

        {/* Upcoming Schedule */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[13px] font-medium text-ink-muted">다가오는 일정</p>
            {upcomingCleanings.length > 3 && (
              <Link
                href="/cleaning"
                className="text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
              >
                더 보기
              </Link>
            )}
          </div>
          {visibleUpcoming.length > 0 ? (
            visibleUpcoming.map((r) => (
              <HostCleaningRequestCard key={r.id} request={r} href={`/cleaning/${r.id}`} />
            ))
          ) : (
            <div className="rounded-2xl border border-outline-dim bg-white px-4 py-6 text-center shadow-[0_6px_20px_rgba(0,0,0,0.04)]">
              <p className="text-[14px] text-ink-muted">예정된 일정이 없어요</p>
            </div>
          )}
        </div>
      </div>

      <ProcessDrawer
        open={registrationProcessOpen}
        onOpenChange={setRegistrationProcessOpen}
        title="숙소 등록 진행 과정"
        steps={PROPERTY_REGISTRATION_STEPS}
      />
    </div>
  )
}
