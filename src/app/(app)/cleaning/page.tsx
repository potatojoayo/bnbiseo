'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-provider'
import { useProperties } from '@/lib/hooks/use-properties'
import { useCleaningRequests } from '@/lib/hooks/use-cleaning'
import { PROPERTY_REGISTRATION_STEPS } from '@/lib/process-steps'
import { HostCleaningRequestCard } from '@/components/host-cleaning-request-card'
import { ProcessDrawer } from '@/components/process-drawer'
import { CLEANING_PROCESS_STEPS } from '@/lib/process-steps'
import { nowKST } from '@/lib/utils'

export default function CleaningPage() {
  const { user, loading: authLoading } = useAuth()
  const { data: properties = [], isLoading: propertiesLoading } = useProperties()
  const { data: requests = [], isLoading } = useCleaningRequests()

  const [processOpen, setProcessOpen] = useState(false)
  const [registrationProcessOpen, setRegistrationProcessOpen] = useState(false)

  const activeProperties = properties.filter((p) => p.status === 'active')
  const pendingProperties = properties.filter((p) => p.status === 'pending_activation')

  const isPageLoading = authLoading || (!!user && (isLoading || propertiesLoading))

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-80px)]">
        <div className="w-6 h-6 rounded-full border-2 border-outline-dim border-t-ink-muted animate-spin" />
      </div>
    )
  }

  // 카드 결제 진행 중인 pending_payment는 숨기고, 무통장 입금 대기는 보여줌
  const visible = requests.filter(
    (r) => r.status !== 'pending_payment' || r.paymentMethod === 'bank_transfer',
  )
  const now = nowKST()

  const upcoming = visible
    .filter((r) => {
      if (['completed', 'cancelled'].includes(r.status)) return false
      const scheduledAt = new Date(`${r.scheduledDate}T${r.scheduledTime}:00+09:00`)
      return scheduledAt >= now
    })
    .sort((a, b) => {
      const aTime = new Date(`${a.scheduledDate}T${a.scheduledTime}:00+09:00`).getTime()
      const bTime = new Date(`${b.scheduledDate}T${b.scheduledTime}:00+09:00`).getTime()
      return aTime - bTime
    })

  const past = visible
    .filter((r) => !upcoming.includes(r))
    .sort((a, b) => {
      const aTime = new Date(`${a.scheduledDate}T${a.scheduledTime}:00+09:00`).getTime()
      const bTime = new Date(`${b.scheduledDate}T${b.scheduledTime}:00+09:00`).getTime()
      return bTime - aTime
    })

  return (
    <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col px-6 pt-6 pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-semibold text-ink">청소</h1>
        {visible.length > 0 && (
          <Link
            href="/cleaning/new"
            className="px-4 h-9 rounded-lg bg-brand text-white text-[13px] font-semibold inline-flex items-center justify-center shadow-[0_4px_14px_rgba(255,56,92,0.28)] active:scale-[0.98] transition-all"
          >
            청소 요청하기
          </Link>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <h2 className="mb-2 text-[18px] font-semibold text-ink">
            등록된 숙소가 없어요
          </h2>
          <p className="text-[14px] text-ink-muted leading-relaxed">
            청소를 요청하려면 먼저 숙소를 등록해주세요
          </p>
          <Link
            href="/properties/new"
            className="mt-6 px-5 h-10 rounded-lg bg-brand text-white text-[14px] font-semibold inline-flex items-center justify-center active:scale-[0.98] transition-all"
          >
            숙소 등록하기
          </Link>
        </div>
      ) : activeProperties.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <h2 className="mb-2 text-[18px] font-semibold text-ink">
            숙소 등록 완료 후 청소를 요청할 수 있어요
          </h2>
          <p className="text-[14px] text-ink-muted leading-relaxed">
            48시간 이내 직접 방문해 숙소 등록을 완료해드려요.
          </p>
          <button
            type="button"
            onClick={() => setRegistrationProcessOpen(true)}
            className="text-[13px] text-ink-muted underline underline-offset-2 hover:text-ink transition-colors mt-4"
          >
            숙소 등록은 어떻게 진행되나요?
          </button>
          <ProcessDrawer
            open={registrationProcessOpen}
            onOpenChange={setRegistrationProcessOpen}
            title="숙소 등록 진행 과정"
            steps={PROPERTY_REGISTRATION_STEPS}
          />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
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
            href="/cleaning/new"
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

          <ProcessDrawer
            open={processOpen}
            onOpenChange={setProcessOpen}
            title="청소 진행 과정"
            steps={CLEANING_PROCESS_STEPS}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {upcoming.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="px-1 text-[13px] font-medium text-ink-muted">다가오는 청소</p>
              {upcoming.map((r) => (
                <HostCleaningRequestCard key={r.id} request={r} href={`/cleaning/${r.id}`} />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="px-1 text-[13px] font-medium text-ink-muted">지난 청소</p>
              {past.map((r) => (
                <HostCleaningRequestCard key={r.id} request={r} href={`/cleaning/${r.id}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
