'use client'

import Image from 'next/image'
import { PropertyCard } from '@/components/property-card'

type PendingProperty = {
  id: string
  name: string
  address: string
  addressDetail?: string | null
}

type PendingActivationPanelProps = {
  title: string
  description: string
  properties: PendingProperty[]
  className?: string
  action?: React.ReactNode
}

export function PendingActivationPanel({
  title,
  description,
  properties,
  className,
  action,
}: PendingActivationPanelProps) {
  return (
    <div className={className}>
      <div className="flex flex-col items-center text-center px-1 pt-12">
        <Image
          src="/images/register.png"
          alt="숙소 등록 진행"
          width={200}
          height={100}
          priority
          className="mb-5 h-auto w-[240px] object-contain"
        />
        <h2 className="text-[20px] font-semibold leading-tight text-[#222222]">
          {title}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[#717171]">
          {description}
        </p>
        {action}
      </div>

      {properties.length > 0 && (
        <div className="mt-20 flex flex-col gap-3">
          <p className="px-1 text-left text-[13px] font-medium text-[#717171]">등록 대기 숙소</p>
          <div className="flex flex-col gap-3">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={{ ...property, status: 'pending_activation' }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
