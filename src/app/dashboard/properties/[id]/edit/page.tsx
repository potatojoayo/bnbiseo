'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { PropertyForm } from '../../components/property-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

type Property = {
  id: string
  name: string
  address: string
  addressDetail: string | null
  propertyType: string
  description: string | null
  nearbyInfo: string | null
  checkinInfo: string | null
  wifiSsid: string | null
  wifiPassword: string | null
}

export default function EditPropertyPage() {
  const params = useParams<{ id: string }>()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Property>(`/properties/${params.id}`)
      .then(setProperty)
      .catch(() => notFound())
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading || !property) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/properties/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
            숙소로 돌아가기
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-display)' }}>숙소 정보 수정</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyForm
            propertyId={property.id}
            defaultValues={{
              name: property.name,
              address: property.address,
              addressDetail: property.addressDetail ?? undefined,
              propertyType: property.propertyType,
              description: property.description ?? undefined,
              nearbyInfo: property.nearbyInfo ?? undefined,
              checkinInfo: property.checkinInfo ?? undefined,
              wifiSsid: property.wifiSsid ?? undefined,
              wifiPassword: property.wifiPassword ?? undefined,
            }}
            submitLabel="수정 저장"
          />
        </CardContent>
      </Card>
    </div>
  )
}
