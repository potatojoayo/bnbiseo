'use client'

import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { PropertyForm } from '@/app/onboarding/property-form'

export default function MyNewPropertyPage() {
  return (
    <div className="min-h-[100dvh] bg-white flex flex-col items-center px-6 pt-6 max-md:pt-4 pb-8">
      <div className="w-full max-w-[560px] animate-fade-up-fast">
        <Link
          href="/my/properties"
          className="mb-3 -ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
        >
          <ChevronLeftIcon size={32} />
        </Link>
        <PropertyForm title="숙소 추가" redirectTo="/my/properties" animated={false} />
      </div>
    </div>
  )
}
