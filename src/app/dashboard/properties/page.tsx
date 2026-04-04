import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { properties } from '@/db/schema'
import { eq } from 'drizzle-orm'
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

export default async function PropertiesPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const userProperties = await db
    .select({
      id: properties.id,
      name: properties.name,
      address: properties.address,
      addressDetail: properties.addressDetail,
      propertyType: properties.propertyType,
      isActive: properties.isActive,
      createdAt: properties.createdAt,
    })
    .from(properties)
    .where(eq(properties.hostId, user.id))
    .orderBy(properties.createdAt)

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="숙소 목록" />
      <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          총 {userProperties.length}개의 숙소가 등록되어 있습니다.
        </p>
        <Button asChild>
          <Link href="/dashboard/properties/new">
            <Plus className="h-4 w-4" />
            숙소 등록
          </Link>
        </Button>
      </div>

      {userProperties.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-4">
            <Building2 className="h-14 w-14 text-[#D1C9BC]" />
            <div className="text-center">
              <p className="font-medium">등록된 숙소가 없습니다</p>
              <p className="text-sm text-[#6b7280] mt-1">
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
          {userProperties.map((property) => (
            <Link key={property.id} href={`/dashboard/properties/${property.id}`}>
              <Card className="hover:shadow-md transition-all cursor-pointer group h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base group-hover:text-[#D4421E] transition-colors">
                      {property.name}
                    </CardTitle>
                    <ChevronRight className="h-4 w-4 text-[#9ca3af] mt-0.5 shrink-0 group-hover:text-[#D4421E] transition-colors" />
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
                      <Badge variant="outline" className="text-[#9ca3af]">
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
