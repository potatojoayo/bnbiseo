'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'
import { PropertyForm } from '@/app/onboarding/property-form'

export default function NewPropertyPage() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from')
  const destination = from === 'cleaning' ? '/cleaning' : '/home'

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col items-center px-6 pt-6 max-md:pt-4 pb-8">
      <div className="w-full max-w-[560px] animate-fade-up-fast">
        <Link
          href={destination}
          className="mb-3 -ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
        >
          <ChevronLeftIcon size={32} />
        </Link>
        <PropertyForm title="숙소 추가" redirectTo={destination} animated={false} />
      </div>
    </div>
  )
}
