import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { properties } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { updateProperty } from '@/actions/properties'
import { PropertyForm } from '../../components/property-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [property] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.hostId, user.id)))
    .limit(1)

  if (!property) notFound()

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/properties/${id}`}>
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
            action={updateProperty}
            defaultValues={{
              id: property.id,
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
