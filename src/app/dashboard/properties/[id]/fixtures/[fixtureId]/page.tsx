import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { properties, fixtures, fixturePhotos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { deleteFixture } from '@/actions/fixtures'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Calendar, MapPin } from 'lucide-react'
import { DeleteFixtureButton } from './components/delete-fixture-button'
import { FixturePhotoGallery } from './components/fixture-photo-gallery'

const fixtureCategoryLabel: Record<string, string> = {
  lighting: '조명',
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

export default async function FixtureDetailPage({
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

  // Ownership check via property
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

  const photos = await db
    .select()
    .from(fixturePhotos)
    .where(eq(fixturePhotos.fixtureId, fixtureId))
    .orderBy(fixturePhotos.sortOrder)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/properties/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            {property.name}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/properties/${id}/fixtures/${fixtureId}/edit`}>
              <Edit className="h-4 w-4" />
              수정
            </Link>
          </Button>
          <DeleteFixtureButton
            fixtureId={fixtureId}
            propertyId={id}
            action={deleteFixture}
          />
        </div>
      </div>

      {/* Fixture title */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {fixture.name}
          </h1>
          <Badge variant="secondary">
            {fixtureCategoryLabel[fixture.category] ?? fixture.category}
          </Badge>
        </div>
        <p className="text-sm text-[#6b7280] flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {fixture.location}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Details card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">기기 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fixture.brand && (
              <div>
                <p className="text-xs text-[#9ca3af]">브랜드</p>
                <p className="text-sm font-medium">{fixture.brand}</p>
              </div>
            )}
            {fixture.modelNumber && (
              <div>
                <p className="text-xs text-[#9ca3af]">모델 번호</p>
                <p className="text-sm font-medium">{fixture.modelNumber}</p>
              </div>
            )}
            {fixture.installedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#9ca3af]" />
                <div>
                  <p className="text-xs text-[#9ca3af]">설치일</p>
                  <p className="text-sm font-medium">{fixture.installedAt}</p>
                </div>
              </div>
            )}
            {fixture.specNotes && (
              <div>
                <p className="text-xs text-[#9ca3af]">사양</p>
                <p className="text-sm whitespace-pre-line text-[#4b5563]">{fixture.specNotes}</p>
              </div>
            )}
            {fixture.notes && (
              <div>
                <p className="text-xs text-[#9ca3af]">메모</p>
                <p className="text-sm whitespace-pre-line text-[#4b5563]">{fixture.notes}</p>
              </div>
            )}
            {!fixture.brand && !fixture.modelNumber && !fixture.installedAt && !fixture.specNotes && !fixture.notes && (
              <p className="text-sm text-[#9ca3af]">등록된 정보가 없습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">사진 ({photos.length}장)</CardTitle>
          </CardHeader>
          <CardContent>
            <FixturePhotoGallery
              photos={photos}
              propertyId={id}
              fixtureId={fixtureId}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
