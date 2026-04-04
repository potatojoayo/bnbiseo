import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { properties, fixtures, repairRequests } from '@/db/schema'
import { eq, inArray, count } from 'drizzle-orm'
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

const REPAIR_STATUS_LABELS: Record<string, string> = {
  submitted: '접수됨',
  reviewing: '검토 중',
  scheduled: '일정 예약됨',
  in_progress: '진행 중',
  completed: '완료',
  cancelled: '취소됨',
}

const REPAIR_PRIORITY_LABELS: Record<string, string> = {
  low: '낮음',
  normal: '보통',
  high: '높음',
  urgent: '긴급',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-muted-foreground',
  normal: 'text-foreground',
  high: 'text-orange-600',
  urgent: 'text-destructive font-semibold',
}

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user's properties
  const userProperties = await db
    .select({ id: properties.id, name: properties.name })
    .from(properties)
    .where(eq(properties.hostId, user.id))

  const propertyIds = userProperties.map((p) => p.id)

  // Counts
  const [fixtureCount, activeRepairCount] = await Promise.all([
    propertyIds.length > 0
      ? db
          .select({ count: count() })
          .from(fixtures)
          .where(inArray(fixtures.propertyId, propertyIds))
          .then((r) => r[0]?.count ?? 0)
      : Promise.resolve(0),
    propertyIds.length > 0
      ? db
          .select({ count: count() })
          .from(repairRequests)
          .where(
            inArray(repairRequests.propertyId, propertyIds),
          )
          .then((r) => r[0]?.count ?? 0)
      : Promise.resolve(0),
  ])

  // Recent repair requests (last 5)
  const recentRepairs = propertyIds.length > 0
    ? await db
        .select({
          id: repairRequests.id,
          title: repairRequests.title,
          status: repairRequests.status,
          priority: repairRequests.priority,
          createdAt: repairRequests.createdAt,
          propertyId: repairRequests.propertyId,
        })
        .from(repairRequests)
        .where(inArray(repairRequests.propertyId, propertyIds))
        .orderBy(repairRequests.createdAt)
        .limit(5)
    : []

  // Map propertyId → name for display
  const propertyMap = Object.fromEntries(userProperties.map((p) => [p.id, p.name]))

  const summaryCards = [
    {
      title: '등록된 숙소',
      value: userProperties.length,
      icon: <Building2Icon className="size-5 text-muted-foreground" />,
      href: '/dashboard/properties',
    },
    {
      title: '총 시설물',
      value: fixtureCount,
      icon: <ClipboardListIcon className="size-5 text-muted-foreground" />,
      href: '/dashboard/properties',
    },
    {
      title: '수리 요청',
      value: activeRepairCount,
      icon: <WrenchIcon className="size-5 text-muted-foreground" />,
      href: '/dashboard/repairs',
    },
  ]

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

        {/* Recent repairs */}
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
            {recentRepairs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <WrenchIcon className="size-10 mb-3 opacity-30" />
                <p className="text-sm">아직 수리 요청이 없습니다.</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href="/dashboard/repairs/new">첫 수리 접수하기</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentRepairs.map((repair) => (
                  <li key={repair.id} className="flex items-center justify-between py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{repair.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {propertyMap[repair.propertyId] ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${PRIORITY_COLORS[repair.priority]}`}>
                        {REPAIR_PRIORITY_LABELS[repair.priority] ?? repair.priority}
                      </span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                        {REPAIR_STATUS_LABELS[repair.status] ?? repair.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
