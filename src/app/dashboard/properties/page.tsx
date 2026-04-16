'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/site-header'
import { Building2, Plus, ChevronRight } from 'lucide-react'

const propertyTypeLabel: Record<string, string> = {
  apartment: '아파트',
  house: '단독주택',
  studio: '원룸',
  villa: '빌라',
  other: '기타',
}

type Property = {
  id: string
  name: string
  address: string
  addressDetail: string | null
  propertyType: string
  isActive: boolean
  createdAt: string
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Property[]>('/properties').then((data) => {
      setProperties(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <SiteHeader title="숙소 목록" />
        <div className="flex items-center justify-center flex-1">
          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="숙소 목록" />
      <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          총 {properties.length}개의 숙소가 등록되어 있습니다.
        </p>
        <Button asChild>
          <Link href="/dashboard/properties/new">
            <Plus className="h-4 w-4" />
            숙소 등록
          </Link>
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-4">
            <Building2 className="h-14 w-14 text-outline" />
            <div className="text-center">
              <p className="font-medium">등록된 숙소가 없습니다</p>
              <p className="mt-1 text-sm text-ink-muted">
                아래 버튼을 클릭해 첫 번째 숙소를 등록하세요.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/properties/new">
                <Plus className="h-4 w-4" />
                숙소 등록하기
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {properties.map((property) => (
            <Link key={property.id} href={`/dashboard/properties/${property.id}`}>
              <Card className="hover:shadow-md transition-all cursor-pointer group h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base group-hover:text-brand transition-colors">
                      {property.name}
                    </CardTitle>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint transition-colors group-hover:text-brand" />
                  </div>
                  <CardDescription className="text-sm">
                    {property.address}
                    {property.addressDetail && ` ${property.addressDetail}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {propertyTypeLabel[property.propertyType] ?? property.propertyType}
                    </Badge>
                    {!property.isActive && (
                      <Badge variant="outline" className="text-ink-faint">
                        비활성
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
