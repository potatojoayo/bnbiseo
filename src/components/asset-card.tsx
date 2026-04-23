import Link from 'next/link'
import { XIcon } from 'lucide-react'
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton'
import { cn } from '@/lib/utils'

type AssetCardProps = {
  name: string
  category?: string
  location: string
  brand?: string | null
  modelNumber?: string | null
  notes?: string | null
  imageUrl: string | null
  href?: string
  onRemove?: () => void
  className?: string
}

export function AssetCard({
  name,
  category,
  location,
  brand,
  modelNumber,
  notes,
  imageUrl,
  href,
  onRemove,
  className,
}: AssetCardProps) {
  const content = (
    <div className="flex items-stretch">
      <div className="relative w-[104px] shrink-0 overflow-hidden bg-surface-soft">
        {imageUrl ? (
          <ImageWithSkeleton
            src={imageUrl}
            alt=""
            fill
            sizes="104px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[12px] text-ink-faint">
            사진 없음
          </div>
        )}
      </div>
      <div className={cn('flex min-w-0 flex-1 items-start py-3 pl-4', onRemove ? 'pr-10' : 'pr-4')}>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-ink">{name}</p>
          <p className="mt-1 text-[13px] text-ink-muted">
            {category ? `${category} · ${location}` : location}
          </p>
          {(brand || modelNumber) && (
            <p className="mt-1 text-[13px] text-ink-muted">
              {[brand, modelNumber].filter(Boolean).join(' · ')}
            </p>
          )}
          {notes && (
            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">{notes}</p>
          )}
        </div>
      </div>
    </div>
  )

  const baseClass = cn(
    'relative overflow-hidden rounded-xl border border-outline-dim transition-all',
    href && 'active:scale-[0.99] md:hover:-translate-y-0.5 md:hover:border-outline-strong md:hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)]',
    !href && 'bg-white',
    className,
  )

  return (
    <div className={baseClass}>
      {href ? (
        <Link href={href} className="block">
          {content}
        </Link>
      ) : (
        content
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-ink-muted transition-colors hover:bg-surface-soft hover:text-ink"
          aria-label="시설물 제거"
        >
          <XIcon size={16} />
        </button>
      )}
    </div>
  )
}
