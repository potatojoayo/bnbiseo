'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { PropertyDetailView } from '@/components/property-detail-view'

export default function MyPropertyDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const fromHome = searchParams.get('from') === 'home'

  return (
    <PropertyDetailView
      propertyId={id}
      backHref={fromHome ? '/home' : '/my/properties'}
      editHref={`/my/properties/${id}/edit`}
    />
  )
}
