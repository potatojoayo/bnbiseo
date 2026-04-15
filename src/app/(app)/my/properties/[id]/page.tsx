'use client'

import { useParams, useRouter } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'
import { useProperty } from '@/lib/hooks/use-properties'
import { PropertyForm } from '@/app/onboarding/property-form'

export default function MyPropertyEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data: property, isLoading } = useProperty(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="w-6 h-6 rounded-full border-2 border-[#EBEBEB] border-t-[#717171] animate-spin" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
        <p className="text-[14px] text-[#717171] mb-4">숙소를 찾을 수 없어요</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[13px] text-[#717171] underline underline-offset-2"
        >
          돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col items-center px-6 pt-6 max-md:pt-4 pb-8">
      <div className="w-full max-w-[560px] animate-fade-up-fast">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center w-10 h-10 -ml-4 mb-3 rounded-full hover:bg-[#F7F7F7] transition-colors text-[#222222]"
        >
          <ChevronLeftIcon size={32} />
        </button>
        <PropertyForm
          title="숙소 수정"
          mode="edit"
          initialData={property}
          redirectTo="/my/properties"
          animated={false}
        />
      </div>
    </div>
  )
}
