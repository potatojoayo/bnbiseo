'use client'

import Link from 'next/link'
import { ChevronLeftIcon, MapPinIcon, PlusIcon } from 'lucide-react'
import { useProperties } from '@/lib/hooks/use-properties'

export default function MyPropertiesPage() {
  const { data: properties = [], isLoading } = useProperties()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-80px)]">
        <div className="w-6 h-6 rounded-full border-2 border-[#EBEBEB] border-t-[#717171] animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col px-6 pt-6 pb-10">
      {/* Header */}
      <Link
        href="/my"
        className="inline-flex items-center justify-center w-10 h-10 -ml-4 mb-3 rounded-full hover:bg-[#F7F7F7] transition-colors text-[#222222]"
      >
        <ChevronLeftIcon size={32} />
      </Link>
      <h1 className="text-[22px] font-semibold text-[#222222] mb-6">
        내 숙소 관리
      </h1>

      {properties.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-[14px] text-[#717171] mb-4">등록된 숙소가 없어요</p>
          <Link
            href="/my/properties/new"
            className="px-5 h-10 rounded-lg bg-[#222222] text-white text-[14px] font-semibold inline-flex items-center justify-center active:scale-[0.98] transition-all"
          >
            숙소 추가하기
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {/* Property list */}
          <div className="rounded-xl border border-[#EBEBEB] overflow-hidden">
            {properties.map((p, i) => {
              const details = [
                p.pyeong && `${p.pyeong}평`,
                `방 ${p.bedrooms}`,
                `욕실 ${p.bathrooms}`,
              ].filter(Boolean)

              return (
                <Link
                  key={p.id}
                  href={`/my/properties/${p.id}`}
                  className={`block px-4 py-4 active:bg-[#F7F7F7] transition-colors ${i > 0 ? 'border-t border-[#EBEBEB]' : ''}`}
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-[#222222]">{p.name}</p>
                    {details.length > 0 && (
                      <p className="text-[13px] text-[#717171] mt-0.5">{details.join(' · ')}</p>
                    )}
                    <p className="text-[12px] text-[#B0B0B0] mt-0.5 flex items-center gap-0.5 truncate">
                      <MapPinIcon size={11} strokeWidth={1.75} className="shrink-0" />
                      {p.address}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Add button */}
          <Link
            href="/my/properties/new"
            className="mt-4 flex items-center justify-center gap-1.5 text-[13px] text-[#717171] hover:text-[#222222] transition-colors"
          >
            <PlusIcon size={14} strokeWidth={2} />
            숙소 추가
          </Link>
        </div>
      )}
    </div>
  )
}
