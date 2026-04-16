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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
        <p className="mb-4 text-[14px] text-ink-muted">숙소를 찾을 수 없어요</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[13px] text-ink-muted underline underline-offset-2"
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
          className="mb-3 -ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
        >
          <ChevronLeftIcon size={32} />
        </button>
        <PropertyForm
          title="숙소 수정"
          mode="edit"
          initialData={property}
          redirectTo={`/my/properties/${id}`}
          animated={false}
        />
      </div>
    </div>
  )
}
