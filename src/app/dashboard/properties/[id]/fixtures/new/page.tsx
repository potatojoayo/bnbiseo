import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { properties } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { createFixture } from '@/actions/fixtures'
import { FixtureForm } from '../components/fixture-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function NewFixturePage({
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
    .select({ id: properties.id, name: properties.name })
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
            {property.name}으로 돌아가기
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-display)' }}>시설물 등록</CardTitle>
          <CardDescription>{property.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <FixtureForm
            action={createFixture}
            propertyId={id}
            submitLabel="시설물 등록"
          />
        </CardContent>
      </Card>
    </div>
  )
}
