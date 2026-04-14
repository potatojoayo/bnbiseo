'use client'

import { PropertyForm } from '@/app/onboarding/property-form'

export default function NewPropertyPage() {
  return (
    <div className="min-h-[100dvh] bg-white flex flex-col items-center px-6 pt-12 max-md:pt-8 pb-8">
      <div className="w-full max-w-[560px] animate-fade-up-fast">
        <h1 className="text-[22px] font-semibold text-[#222222] mb-8">
          숙소 추가
        </h1>
        <PropertyForm backHref="/cleaning" redirectTo="/cleaning" />
      </div>
    </div>
  )
}
