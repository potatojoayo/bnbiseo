'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { SiteHeader } from '@/components/site-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Building2Icon,
  WrenchIcon,
  ClipboardListIcon,
  PlusIcon,
  ChevronRightIcon,
} from 'lucide-react'

type Property = { id: string; name: string }

export default function DashboardPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Property[]>('/properties').then((data) => {
      setProperties(data)
      setLoading(false)
    })
  }, [])

  const summaryCards = [
    {
      title: '등록된 숙소',
      value: properties.length,
      icon: <Building2Icon className="size-5 text-muted-foreground" />,
      href: '/dashboard/properties',
    },
    {
      title: '총 시설물',
      value: '—',
      icon: <ClipboardListIcon className="size-5 text-muted-foreground" />,
      href: '/dashboard/properties',
    },
    {
      title: '수리 요청',
      value: '—',
      icon: <WrenchIcon className="size-5 text-muted-foreground" />,
      href: '/dashboard/repairs',
    },
  ]

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <SiteHeader title="대시보드" />
        <div className="flex items-center justify-center flex-1">
          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="대시보드" />
      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {summaryCards.map((card) => (
            <Link key={card.title} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  {card.icon}
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{card.value}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/properties/new">
              <PlusIcon className="size-4" />
              숙소 등록
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/repairs/new">
              <WrenchIcon className="size-4" />
              수리 접수
            </Link>
          </Button>
        </div>

        {/* Recent repairs placeholder */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">최근 수리 요청</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/repairs" className="flex items-center gap-1 text-sm">
                전체 보기
                <ChevronRightIcon className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <WrenchIcon className="size-10 mb-3 opacity-30" />
              <p className="text-sm">아직 수리 요청이 없습니다.</p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/dashboard/repairs/new">첫 수리 접수하기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
