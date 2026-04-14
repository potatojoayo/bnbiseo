'use client'

import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { PropertyForm } from '@/app/onboarding/property-form'

export default function NewPropertyPage() {
  return (
    <div className="min-h-[100dvh] bg-white flex flex-col items-center px-6 pt-6 max-md:pt-4 pb-8">
      <div className="w-full max-w-[560px] animate-fade-up-fast">
        <Link
          href="/cleaning"
          className="inline-flex items-center justify-center w-10 h-10 -ml-4 mb-3 rounded-full hover:bg-[#F7F7F7] transition-colors text-[#222222]"
        >
          <ChevronLeftIcon size={32} />
        </Link>
        <PropertyForm title="숙소 추가" redirectTo="/cleaning" />
      </div>
    </div>
  )
}
