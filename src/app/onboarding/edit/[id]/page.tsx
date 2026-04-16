'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'
import { api } from '@/lib/api-client'
import { PropertyForm } from '../../property-form'

type Property = {
  id: string
  name: string
  address: string
  addressDetail: string | null
  airbnbListingId: string | null
}

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const [property, setProperty] = useState<Property | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (authLoading || !user) return

    api.get<Property>(`/properties/${id}`)
      .then((data) => {
        setProperty(data)
        setReady(true)
      })
      .catch(() => setReady(true))
  }, [id, user, authLoading])

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="py-20 text-center text-[15px] text-ink-muted">
        숙소를 찾을 수 없습니다.
      </div>
    )
  }

  return (
    <PropertyForm
      mode="edit"
      backHref="/onboarding/complete"
      initialData={property}
    />
  )
}
