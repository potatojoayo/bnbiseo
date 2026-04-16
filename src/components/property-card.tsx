import { MapPinIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Property = {
  id: string
  status?: 'pending_activation' | 'active'
  name: string
  address: string
  addressDetail?: string | null
  pyeong?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
}

interface PropertyCardProps {
  property: Property
  selected?: boolean
  className?: string
}

export function PropertyCard({ property, selected, className }: PropertyCardProps) {
  const details = property.status === 'pending_activation'
    ? []
    : [
        property.pyeong && `${property.pyeong}평`,
        property.bedrooms && `방 ${property.bedrooms}`,
        property.bathrooms && `욕실 ${property.bathrooms}`,
      ].filter(Boolean)

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#EBEBEB] bg-white px-4 py-4 shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition-all',
        selected !== undefined && (selected ? 'border-[#222222] bg-[#F7F7F7]' : 'hover:border-[#D9D9D9]'),
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[16px] font-semibold leading-snug text-[#222222]">
            {property.name}
          </p>
          {details.length > 0 && (
            <p className="mt-1 text-[13px] text-[#717171]">
              {details.join(' · ')}
            </p>
          )}
        </div>

        {property.status === 'pending_activation' ? (
          <span className="shrink-0 rounded-full border border-[#EBEBEB] bg-[#FAFAFA] px-2.5 py-1 text-[11px] font-medium text-[#717171]">
            등록 대기
          </span>
        ) : selected !== undefined ? (
          <div
            className={cn(
              'mt-0.5 h-[18px] w-[18px] rounded-full border-[1.5px] shrink-0 flex items-center justify-center transition-all',
              selected ? 'border-[#222222]' : 'border-[#CCCCCC]'
            )}
          >
            {selected && <div className="h-[10px] w-[10px] rounded-full bg-[#222222]" />}
          </div>
        ) : null}
      </div>

      <div className="mt-3 h-px w-full bg-[#F1F1F1]" />

      <p className="mt-3 text-[13px] leading-relaxed text-[#717171]">
        <MapPinIcon className="inline-block size-3.5 align-[-2px] mr-1 text-[#B0B0B0]" strokeWidth={1.75} />
        {property.address}
        {property.addressDetail ? ` ${property.addressDetail}` : ''}
      </p>
    </div>
  )
}
