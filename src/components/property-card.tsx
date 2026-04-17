import { MapPinIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Property = {
  id: string
  status?: 'pending_activation' | 'active'
  name: string
  address: string
  addressDetail?: string | null
  pyeong?: number | null
  livingRooms?: number | null
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
        property.livingRooms && `거실 ${property.livingRooms}`,
        property.bedrooms && `침실 ${property.bedrooms}`,
        property.bathrooms && `욕실 ${property.bathrooms}`,
      ].filter(Boolean)

  return (
    <div
      className={cn(
        'rounded-2xl border border-outline-dim bg-white px-4 py-4 shadow-[0_6px_20px_rgba(0,0,0,0.04)] transition-all md:hover:-translate-y-0.5 md:hover:border-outline-strong md:hover:shadow-[0_14px_32px_rgba(0,0,0,0.08)]',
        selected !== undefined && (selected ? 'border-ink bg-surface-soft md:hover:border-ink' : 'md:hover:border-outline-strong'),
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[16px] font-semibold leading-snug text-ink">
            {property.name}
          </p>
          {details.length > 0 && (
            <p className="mt-1 text-[13px] text-ink-muted">
              {details.join(' · ')}
            </p>
          )}
        </div>

        {property.status === 'pending_activation' ? (
          <span className="shrink-0 rounded-full border border-outline-dim bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-ink-muted">
            등록 대기
          </span>
        ) : selected !== undefined ? (
          <div
            className={cn(
              'mt-0.5 h-[18px] w-[18px] rounded-full border-[1.5px] shrink-0 flex items-center justify-center transition-all',
              selected ? 'border-ink' : 'border-outline'
            )}
          >
            {selected && <div className="h-[10px] w-[10px] rounded-full bg-ink" />}
          </div>
        ) : null}
      </div>

      <div className="mt-3 h-px w-full bg-outline-dim" />

      <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
        <MapPinIcon className="inline-block size-3.5 align-[-2px] mr-1 text-ink-faint" strokeWidth={1.75} />
        {property.address}
        {property.addressDetail ? ` ${property.addressDetail}` : ''}
      </p>
    </div>
  )
}
