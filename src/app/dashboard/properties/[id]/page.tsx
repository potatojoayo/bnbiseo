'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api-client'
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

type Fixture = {
  id: string
  name: string
  category: string
  location: string
  brand: string | null
  isActive: boolean
}

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
  isActive: boolean
  fixtures: Fixture[]
}

export default function PropertyDetailPage() {
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
      <div className="flex flex-1 flex-col">
        <SiteHeader title="" />
        <div className="flex items-center justify-center flex-1">
          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
        </div>
      </div>
    )
  }

  const id = property.id
  const propertyFixtures = property.fixtures

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title={property.name} />
      <div className="p-4 md:p-6">
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
          <DeleteButton propertyId={id} />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold" >
            {property.name}
          </h1>
          <Badge variant="secondary">
            {propertyTypeLabel[property.propertyType] ?? property.propertyType}
          </Badge>
          {!property.isActive && <Badge variant="outline">비활성</Badge>}
        </div>
        <p className="flex items-center gap-1 text-sm text-ink-muted">
          <MapPin className="h-3.5 w-3.5" />
          {property.address}
          {property.addressDetail && ` ${property.addressDetail}`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
                <p className="whitespace-pre-line text-sm text-slate-600">{property.description}</p>
              </CardContent>
            </Card>
          )}

          {property.checkinInfo && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">체크인 안내</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-slate-600">{property.checkinInfo}</p>
              </CardContent>
            </Card>
          )}

          {property.nearbyInfo && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">주변 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-slate-600">{property.nearbyInfo}</p>
              </CardContent>
            </Card>
          )}
        </div>

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
                  <p className="text-xs text-ink-faint">이름 (SSID)</p>
                  <p className="text-sm font-medium">{property.wifiSsid}</p>
                </div>
              )}
              {property.wifiPassword && (
                <div>
                  <p className="text-xs text-ink-faint">비밀번호</p>
                  <p className="text-sm font-medium">{property.wifiPassword}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Separator className="my-6" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold" >
              시설물 목록
            </h2>
            <p className="text-sm text-ink-muted">총 {propertyFixtures.length}개</p>
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
              <Wrench className="h-10 w-10 text-outline" />
              <div className="text-center">
                <p className="font-medium text-sm">등록된 시설물이 없습니다</p>
                <p className="mt-1 text-xs text-ink-muted">
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
                      <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint transition-colors group-hover:text-brand" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {fixtureCategoryLabel[fixture.category] ?? fixture.category}
                      </Badge>
                      <span className="text-xs text-ink-muted">{fixture.location}</span>
                    </div>
                    {fixture.brand && (
                      <p className="mt-1 text-xs text-ink-faint">{fixture.brand}</p>
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
