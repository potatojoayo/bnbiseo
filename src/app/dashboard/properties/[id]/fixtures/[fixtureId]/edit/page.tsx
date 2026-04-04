import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { properties, fixtures } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { updateFixture } from '@/actions/fixtures'
import { FixtureForm } from '../../components/fixture-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function EditFixturePage({
  params,
}: {
  params: Promise<{ id: string; fixtureId: string }>
}) {
  const { id, fixtureId } = await params

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

  const [fixture] = await db
    .select()
    .from(fixtures)
    .where(and(eq(fixtures.id, fixtureId), eq(fixtures.propertyId, id)))
    .limit(1)

  if (!fixture) notFound()

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/properties/${id}/fixtures/${fixtureId}`}>
            <ArrowLeft className="h-4 w-4" />
            시설물로 돌아가기
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-display)' }}>시설물 수정</CardTitle>
          <CardDescription>{fixture.name} — {property.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <FixtureForm
            action={updateFixture}
            propertyId={id}
            defaultValues={{
              fixtureId: fixture.id,
              category: fixture.category,
              name: fixture.name,
              location: fixture.location,
              brand: fixture.brand ?? undefined,
              modelNumber: fixture.modelNumber ?? undefined,
              specNotes: fixture.specNotes ?? undefined,
              installedAt: fixture.installedAt ?? undefined,
              notes: fixture.notes ?? undefined,
            }}
            submitLabel="수정 저장"
          />
        </CardContent>
      </Card>
    </div>
  )
}
