'use client'

import Link from 'next/link'
import { ChevronLeftIcon, PlusIcon } from 'lucide-react'
import { useProperties } from '@/lib/hooks/use-properties'
import { PropertyCard } from '@/components/property-card'

export default function MyPropertiesPage() {
  const { data: properties = [], isLoading } = useProperties()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-80px)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col px-6 pt-6 pb-10">
      {/* Header */}
      <Link
        href="/my"
        className="mb-3 -ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
      >
        <ChevronLeftIcon size={32} />
      </Link>
      <h1 className="mb-6 text-[22px] font-semibold text-ink">
        내 숙소 관리
      </h1>

      {properties.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="mb-4 text-[14px] text-ink-muted">등록된 숙소가 없어요</p>
          <Link
            href="/my/properties/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-ink px-5 text-[14px] font-semibold text-white transition-all active:scale-[0.98]"
          >
            숙소 추가하기
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          <div className="flex flex-col gap-3">
            {properties.map((p) => (
              <Link
                key={p.id}
                href={`/my/properties/${p.id}`}
                className="block transition-transform active:scale-[0.99]"
              >
                <PropertyCard property={p} />
              </Link>
            ))}
          </div>

          {/* Add button */}
          <Link
            href="/my/properties/new"
            className="mt-4 flex items-center justify-center gap-1.5 text-[13px] text-ink-muted transition-colors hover:text-ink"
          >
            <PlusIcon size={14} strokeWidth={2} />
            숙소 추가
          </Link>
        </div>
      )}
    </div>
  )
}
