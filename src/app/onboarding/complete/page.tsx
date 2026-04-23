'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-provider'
import { api } from '@/lib/api-client'
import { useInvalidateProfile } from '@/lib/hooks/use-profile'
import { PlusIcon, ArrowRightIcon } from 'lucide-react'
import { PropertyCard } from '@/components/property-card'
import { LoadingButton } from '@/components/ui/loading-button'

type Property = {
  id: string
  name: string
  address: string
  addressDetail: string | null
}

export default function CompletePage() {
  const { user, loading: authLoading } = useAuth()
  const invalidateProfile = useInvalidateProfile()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [ready, setReady] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    if (authLoading || !user) return

    api.get<Property[]>('/properties').then((data) => {
      if (data.length === 0) {
        router.replace('/onboarding')
        return
      }
      setProperties(data)
      setReady(true)
    })
  }, [user, authLoading, router])

  async function handleComplete() {
    setCompleting(true)
    await api.post('/profiles/complete-onboarding')
    await invalidateProfile()
    router.push('/home')
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-up-fast">
      <div>
        <h2
          className="text-2xl sm:text-3xl font-semibold tracking-tight text-on-surface leading-tight"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          숙소 등록 신청이
          <br />완료되었어요
        </h2>
        <div className="mt-5 rounded-xl border border-outline-dim bg-surface-subtle px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 size-5 shrink-0 text-ink"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97a15.485 15.485 0 0 1-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold leading-snug text-ink">
                48 시간 이내에 전화를 드려요
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                직접 방문해 공간 스캔 후 등록을 완료해드립니다. 연락을 잘 받아주세요.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {properties.map((property) => (
          <Link
            key={property.id}
            href={`/onboarding/edit/${property.id}`}
            className="block"
          >
            <PropertyCard property={property} />
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <LoadingButton
          type="button"
          onClick={handleComplete}
          loading={completing}
          loadingText="처리 중..."
          className="group"
        >
          시작하기
          <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2} />
        </LoadingButton>
        <Link
          href="/onboarding/add"
          className="flex h-12 items-center justify-center gap-2.5 rounded-lg border border-outline bg-white text-sm font-medium text-on-surface transition-all hover:border-input active:scale-[0.99]"
        >
          <PlusIcon className="size-4" strokeWidth={2} />
          숙소 추가하기
        </Link>
      </div>
    </div>
  )
}
