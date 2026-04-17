'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { FixtureForm } from '../../components/fixture-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

type Fixture = {
  id: string
  category: string
  name: string
  location: string
  brand: string | null
  modelNumber: string | null
  specNotes: string | null
  installedAt: string | null
  notes: string | null
}

export default function EditFixturePage() {
  const params = useParams<{ id: string; fixtureId: string }>()
  const [fixture, setFixture] = useState<Fixture | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Fixture>(`/assets/${params.fixtureId}`)
      .then(setFixture)
      .catch(() => notFound())
      .finally(() => setLoading(false))
  }, [params.fixtureId])

  if (loading || !fixture) {
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
          <Link href={`/dashboard/properties/${params.id}/assets/${params.fixtureId}`}>
            <ArrowLeft className="h-4 w-4" />
            시설물로 돌아가기
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle >시설물 수정</CardTitle>
          <CardDescription>{fixture.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <FixtureForm
            propertyId={params.id}
            fixtureId={fixture.id}
            defaultValues={{
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
