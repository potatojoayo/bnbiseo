'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Calendar, MapPin } from 'lucide-react'
import { DeleteFixtureButton } from './components/delete-fixture-button'
import { FixturePhotoGallery } from './components/fixture-photo-gallery'

const fixtureCategoryLabel: Record<string, string> = {
  lighting: '조명',
  bedding: '침구/침대',
  faucet: '수도/배관',
  boiler: '보일러',
  appliance: '가전',
  lock: '잠금장치',
  ac: '에어컨',
  washer: '세탁기',
  dryer: '건조기',
  vent: '환기',
  other: '기타',
}

type Photo = {
  id: string
  storagePath: string
  caption: string | null
  sortOrder: number | null
}

type Fixture = {
  id: string
  propertyId: string
  category: string
  name: string
  location: string
  brand: string | null
  modelNumber: string | null
  specNotes: string | null
  installedAt: string | null
  notes: string | null
  photos: Photo[]
}

export default function FixtureDetailPage() {
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

  const { id, fixtureId } = params

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/properties/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            숙소로
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/properties/${id}/assets/${fixtureId}/edit`}>
              <Edit className="h-4 w-4" />
              수정
            </Link>
          </Button>
          <DeleteFixtureButton fixtureId={fixtureId} propertyId={id} />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold" >
            {fixture.name}
          </h1>
          <Badge variant="secondary">
            {fixtureCategoryLabel[fixture.category] ?? fixture.category}
          </Badge>
        </div>
        <p className="flex items-center gap-1 text-sm text-ink-muted">
          <MapPin className="h-3.5 w-3.5" />
          {fixture.location}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">기기 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fixture.brand && (
              <div>
                <p className="text-xs text-ink-faint">브랜드</p>
                <p className="text-sm font-medium">{fixture.brand}</p>
              </div>
            )}
            {fixture.modelNumber && (
              <div>
                <p className="text-xs text-ink-faint">모델 번호</p>
                <p className="text-sm font-medium">{fixture.modelNumber}</p>
              </div>
            )}
            {fixture.installedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-ink-faint" />
                <div>
                  <p className="text-xs text-ink-faint">설치일</p>
                  <p className="text-sm font-medium">{fixture.installedAt}</p>
                </div>
              </div>
            )}
            {fixture.specNotes && (
              <div>
                <p className="text-xs text-ink-faint">사양</p>
                <p className="whitespace-pre-line text-sm text-slate-600">{fixture.specNotes}</p>
              </div>
            )}
            {fixture.notes && (
              <div>
                <p className="text-xs text-ink-faint">메모</p>
                <p className="whitespace-pre-line text-sm text-slate-600">{fixture.notes}</p>
              </div>
            )}
            {!fixture.brand && !fixture.modelNumber && !fixture.installedAt && !fixture.specNotes && !fixture.notes && (
              <p className="text-sm text-ink-faint">등록된 정보가 없습니다.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">사진 ({fixture.photos.length}장)</CardTitle>
          </CardHeader>
          <CardContent>
            <FixturePhotoGallery
              photos={fixture.photos}
              propertyId={id}
              fixtureId={fixtureId}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
