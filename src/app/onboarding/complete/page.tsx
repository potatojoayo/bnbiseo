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
        <div className="mt-5 rounded-xl border border-brand/25 bg-brand/8 px-4 py-4 text-[13.5px] leading-relaxed">
          <p className="text-on-surface">
            숙소 등록 후 <span className="font-semibold text-brand">48시간 이내에 연락</span>을 드리고 직접 방문해요.
          </p>
          <p className="mt-1.5 font-semibold text-brand">
            꼭 연락을 잘 받아주세요!
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {properties.map((property) => (
          <Link
            key={property.id}
            href={`/onboarding/properties/${property.id}`}
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
