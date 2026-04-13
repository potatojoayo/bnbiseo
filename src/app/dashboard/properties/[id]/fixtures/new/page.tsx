'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { FixtureForm } from '../components/fixture-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NewFixturePage() {
  const params = useParams<{ id: string }>()

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
          <CardTitle style={{ fontFamily: 'var(--font-display)' }}>시설물 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <FixtureForm
            propertyId={params.id}
            submitLabel="시설물 등록"
          />
        </CardContent>
      </Card>
    </div>
  )
}
