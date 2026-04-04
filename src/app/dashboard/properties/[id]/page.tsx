import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { properties, fixtures } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { deleteProperty } from '@/actions/properties'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Edit,
  Plus,
  Wifi,
  MapPin,
  Info,
  Wrench,
  ChevronRight,
} from 'lucide-react'
import { DeleteButton } from './components/delete-button'
import { SiteHeader } from '@/components/site-header'

const propertyTypeLabel: Record<string, string> = {
  apartment: '아파트',
  house: '단독주택',
  studio: '원룸',
  villa: '빌라',
  other: '기타',
}

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

export default async function PropertyDetailPage({
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

  const propertyFixtures = await db
    .select({
      id: fixtures.id,
      name: fixtures.name,
      category: fixtures.category,
      location: fixtures.location,
      brand: fixtures.brand,
      isActive: fixtures.isActive,
    })
    .from(fixtures)
    .where(eq(fixtures.propertyId, id))
    .orderBy(fixtures.category, fixtures.name)

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title={property.name} />
      <div className="p-4 md:p-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/properties">
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/properties/${id}/edit`}>
              <Edit className="h-4 w-4" />
              수정
            </Link>
          </Button>
          <DeleteButton propertyId={id} action={deleteProperty} />
        </div>
      </div>

      {/* Property info */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {property.name}
          </h1>
          <Badge variant="secondary">
            {propertyTypeLabel[property.propertyType] ?? property.propertyType}
          </Badge>
          {!property.isActive && <Badge variant="outline">비활성</Badge>}
        </div>
        <p className="text-sm text-[#6b7280] flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {property.address}
          {property.addressDetail && ` ${property.addressDetail}`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          {property.description && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Info className="h-4 w-4" />
                  숙소 설명
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#4b5563] whitespace-pre-line">{property.description}</p>
              </CardContent>
            </Card>
          )}

          {property.checkinInfo && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">체크인 안내</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#4b5563] whitespace-pre-line">{property.checkinInfo}</p>
              </CardContent>
            </Card>
          )}

          {property.nearbyInfo && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">주변 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#4b5563] whitespace-pre-line">{property.nearbyInfo}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* WiFi */}
        {(property.wifiSsid || property.wifiPassword) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Wifi className="h-4 w-4" />
                와이파이
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {property.wifiSsid && (
                <div>
                  <p className="text-xs text-[#9ca3af]">이름 (SSID)</p>
                  <p className="text-sm font-medium">{property.wifiSsid}</p>
                </div>
              )}
              {property.wifiPassword && (
                <div>
                  <p className="text-xs text-[#9ca3af]">비밀번호</p>
                  <p className="text-sm font-medium">{property.wifiPassword}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Separator className="my-6" />

      {/* Fixtures section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              시설물 목록
            </h2>
            <p className="text-sm text-[#6b7280]">총 {propertyFixtures.length}개</p>
          </div>
          <Button size="sm" asChild>
            <Link href={`/dashboard/properties/${id}/fixtures/new`}>
              <Plus className="h-4 w-4" />
              시설물 등록
            </Link>
          </Button>
        </div>

        {propertyFixtures.length === 0 ? (
          <Card>
            <CardContent className="py-12 flex flex-col items-center gap-3">
              <Wrench className="h-10 w-10 text-[#D1C9BC]" />
              <div className="text-center">
                <p className="font-medium text-sm">등록된 시설물이 없습니다</p>
                <p className="text-xs text-[#6b7280] mt-1">
                  시설물을 등록하면 수리 접수 시 연결할 수 있습니다.
                </p>
              </div>
              <Button size="sm" asChild>
                <Link href={`/dashboard/properties/${id}/fixtures/new`}>
                  <Plus className="h-4 w-4" />
                  시설물 등록하기
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {propertyFixtures.map((fixture) => (
              <Link
                key={fixture.id}
                href={`/dashboard/properties/${id}/fixtures/${fixture.id}`}
              >
                <Card className="hover:shadow-md transition-all cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm group-hover:text-brand transition-colors">
                        {fixture.name}
                      </CardTitle>
                      <ChevronRight className="h-4 w-4 text-[#9ca3af] shrink-0 group-hover:text-brand transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {fixtureCategoryLabel[fixture.category] ?? fixture.category}
                      </Badge>
                      <span className="text-xs text-[#6b7280]">{fixture.location}</span>
                    </div>
                    {fixture.brand && (
                      <p className="text-xs text-[#9ca3af] mt-1">{fixture.brand}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
