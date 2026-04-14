import { MapPinIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Property = {
  id: string
  name: string
  address: string
  addressDetail?: string | null
  pyeong?: number | null
  bedrooms?: number
  bathrooms?: number
}

interface PropertyCardProps {
  property: Property
  selected?: boolean
  className?: string
}

export function PropertyCard({ property, selected, className }: PropertyCardProps) {
  const details = [
    property.pyeong && `${property.pyeong}평`,
    property.bedrooms && `방 ${property.bedrooms}`,
    property.bathrooms && `욕실 ${property.bathrooms}`,
  ].filter(Boolean)

  return (
    <div className={cn('px-4 py-3.5', className)}>
      <div className="flex items-center gap-2">
        {selected !== undefined && (
          <div className={cn(
            'w-[18px] h-[18px] rounded-full border-[1.5px] shrink-0 flex items-center justify-center transition-all',
            selected ? 'border-[#222222]' : 'border-[#CCCCCC]'
          )}>
            {selected && <div className="w-[10px] h-[10px] rounded-full bg-[#222222]" />}
          </div>
        )}
        <p className="text-[15px] font-semibold text-[#222222] leading-snug">
          {property.name}
        </p>
      </div>
      {details.length > 0 && (
        <p className="text-[13px] text-[#717171] mt-1">
          {details.join(' · ')}
        </p>
      )}
      <p className="text-[13px] text-[#717171] mt-0.5">
        <MapPinIcon className="size-3 inline-block align-[-1px] mr-0.5" strokeWidth={1.75} />
        {property.address}
        {property.addressDetail ? ` ${property.addressDetail}` : ''}
      </p>
    </div>
  )
}
