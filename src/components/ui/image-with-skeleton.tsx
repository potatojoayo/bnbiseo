'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type ImageWithSkeletonProps = ImageProps & {
  skeletonClassName?: string
}

export function ImageWithSkeleton({
  className,
  skeletonClassName,
  onLoad,
  onError,
  ...props
}: ImageWithSkeletonProps) {
  const [loading, setLoading] = useState(true)

  return (
    <>
      {loading && (
        <Skeleton className={cn('absolute inset-0 bg-outline-strong', skeletonClassName)} />
      )}
      <Image
        {...props}
        className={className}
        onLoad={(event) => {
          setLoading(false)
          onLoad?.(event)
        }}
        onError={(event) => {
          setLoading(false)
          onError?.(event)
        }}
      />
    </>
  )
}
