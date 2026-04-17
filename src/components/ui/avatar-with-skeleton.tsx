'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

type AvatarWithSkeletonProps = {
  src?: string | null
  fallback: React.ReactNode
  className?: string
  fallbackClassName?: string
  skeletonClassName?: string
}

export function AvatarWithSkeleton({
  src,
  fallback,
  className,
  fallbackClassName,
  skeletonClassName,
}: AvatarWithSkeletonProps) {
  const [loading, setLoading] = useState(!!src)
  const showFallback = !src || !loading

  return (
    <div className={cn('relative shrink-0', className)}>
      {loading && (
        <Skeleton className={cn('absolute inset-0 rounded-full bg-outline-strong', skeletonClassName)} />
      )}
      <Avatar className={cn('size-full', className)}>
        {src && (
          <AvatarImage
            src={src}
            alt=""
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        )}
        <AvatarFallback className={cn(fallbackClassName, !showFallback && 'opacity-0')}>
          {fallback}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}
