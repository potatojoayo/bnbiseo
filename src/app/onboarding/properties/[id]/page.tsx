'use client'

import { useParams } from 'next/navigation'
import { PropertyDetailView } from '@/components/property-detail-view'

export default function OnboardingPropertyDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <PropertyDetailView
      propertyId={id}
      backHref="/onboarding/complete"
      editHref={`/onboarding/edit/${id}`}
      detailBaseHref={`/my/properties/${id}`}
    />
  )
}
