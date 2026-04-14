'use client'

import { PropertyForm } from '@/app/onboarding/property-form'

export default function NewPropertyPage() {
  return <PropertyForm backHref="/cleaning" redirectTo="/cleaning" />
}
