'use client'

import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { useAdminStats, useAdminManagers, useInvalidateAdmin } from '@/lib/hooks/use-admin'
import { useIsMobile } from '@/hooks/use-mobile'
import { api } from '@/lib/api-client'
import { formatDateLabel, formatTimeKorean } from '@/lib/utils'
import { useState } from 'react'
import {
  CalendarIcon,
  WalletIcon,
  ClockIcon,
  AlertCircleIcon,
  Building2Icon,
  UsersIcon,
  UserCheckIcon,
  ChevronRightIcon,
  BrushCleaningIcon,
} from 'lucide-react'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LoadingButton } from '@/components/ui/loading-button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '배정 대기', color: 'bg-brand/8 text-brand' },
  confirmed: { label: '배정 완료', color: 'bg-success-soft text-success' },
  in_progress: { label: '진행 중', color: 'bg-info-soft text-info' },
  completed: { label: '완료', color: 'bg-surface-soft text-ink' },
}

export default function AdminDashboardPage() {
  const { data: stats } = useAdminStats()
  const { data: allManagers = [] } = useAdminManagers()
  const invalidate = useInvalidateAdmin()
  const isMobile = useIsMobile()

  const activeManagers = allManagers.filter((m) => m.isActive)

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignTargetId, setAssignTargetId] = useState('')
  const [assigning, setAssigning] = useState(false)

  async function handleAssign(managerId: string) {
    setAssigning(true)
    await api.post(`/admin/cleaning/${assignTargetId}/assign`, { managerId })
    setAssigning(false)
    setAssignOpen(false)
    invalidate.stats()
    invalidate.cleaning()
  }

  const todayTotal = stats
    ? stats.todayCleaning.pending + stats.todayCleaning.confirmed + stats.todayCleaning.inProgress + stats.todayCleaning.completed
    : 0

  return (
    <>
      <SiteHeader title="대시보드" />
      <div className="flex flex-1 flex-col gap-6 p-6 max-w-[960px] mx-auto w-full">

        {/* ─── Section Cards ─── */}
        <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @5xl:grid-cols-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>오늘 청소</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {todayTotal}건
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <CalendarIcon className="size-3" />
                  오늘
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="flex gap-3 text-muted-foreground">
                <span>대기 {stats?.todayCleaning.pending ?? 0}</span>
                <span>배정 {stats?.todayCleaning.confirmed ?? 0}</span>
                <span>진행 {stats?.todayCleaning.inProgress ?? 0}</span>
                <span>완료 {stats?.todayCleaning.completed ?? 0}</span>
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardDescription>미배정 청소</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stats?.pendingAssignment.length ?? 0}건
              </CardTitle>
              <CardAction>
                {(stats?.pendingAssignment.length ?? 0) > 0 && (
                  <Badge variant="outline" className="text-brand border-brand/30">
                    <AlertCircleIcon className="size-3" />
                    처리 필요
                  </Badge>
                )}
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="text-muted-foreground">
                매니저 배정이 필요한 요청
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardDescription>오늘 매출</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {(stats?.todayRevenue ?? 0).toLocaleString()}원
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <WalletIcon className="size-3" />
                  당일
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="text-muted-foreground">
                이번 달 {(stats?.monthRevenue ?? 0).toLocaleString()}원
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardDescription>전체 현황</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stats?.totalProperties ?? 0}개 숙소
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <Building2Icon className="size-3" />
                  총계
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="flex gap-3 text-muted-foreground">
                <span>회원 {stats?.totalUsers ?? 0}</span>
                <span>매니저 {stats?.totalManagers ?? 0}</span>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* ─── Pending Assignment ─── */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircleIcon className="size-4 text-brand" />
              매니저 미배정
            </CardTitle>
            <CardAction>
              <Link href="/admin/cleaning?status=pending" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                전체 보기
                <ChevronRightIcon className="size-4" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="p-0">
            {!stats?.pendingAssignment.length ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <BrushCleaningIcon className="size-10 mb-3 opacity-30" />
                <p className="text-sm">미배정 청소가 없어요</p>
              </div>
            ) : isMobile ? (
              <div className="flex flex-col divide-y">
                {stats.pendingAssignment.map((r) => (
                  <div key={r.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[14px] font-medium">{r.propertyName || '숙소'}</span>
                      <button
                        onClick={() => { setAssignTargetId(r.id); setAssignOpen(true) }}
                        className="rounded-md bg-ink px-2.5 py-1 text-[11px] font-medium text-white"
                      >
                        배정
                      </button>
                    </div>
                    <p className="text-[12px] text-muted-foreground">
                      {formatDateLabel(r.scheduledDate)} {formatTimeKorean(r.scheduledTime)}
                      {r.cleaningType === 'urgent' && ' (긴급)'}
                      {' · '}{r.hostName || '-'}
                      {' · '}{r.finalPrice.toLocaleString()}원
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>숙소</TableHead>
                    <TableHead>날짜/시간</TableHead>
                    <TableHead>호스트</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.pendingAssignment.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.propertyName || '숙소'}</TableCell>
                      <TableCell>
                        {formatDateLabel(r.scheduledDate)} {formatTimeKorean(r.scheduledTime)}
                        {r.cleaningType === 'urgent' && <span className="text-brand ml-1 text-[11px]">긴급</span>}
                      </TableCell>
                      <TableCell>{r.hostName || '-'}</TableCell>
                      <TableCell>{r.finalPrice.toLocaleString()}원</TableCell>
                      <TableCell>
                        <button
                          onClick={() => { setAssignTargetId(r.id); setAssignOpen(true) }}
                          className="rounded-md bg-ink px-2.5 py-1 text-[11px] font-medium text-white"
                        >
                          배정
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* ─── Today's Schedule ─── */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <ClockIcon className="size-4" />
              오늘 스케줄
            </CardTitle>
            <CardAction>
              <Link href="/admin/cleaning" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                전체 보기
                <ChevronRightIcon className="size-4" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="p-0">
            {!stats?.todaySchedule.length ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <CalendarIcon className="size-10 mb-3 opacity-30" />
                <p className="text-sm">오늘 예정된 청소가 없어요</p>
              </div>
            ) : isMobile ? (
              <div className="flex flex-col divide-y">
                {stats.todaySchedule.map((s) => {
                  const statusInfo = STATUS_LABELS[s.status]
                  return (
                    <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <span className="text-[14px] font-medium">{formatTimeKorean(s.scheduledTime)}</span>
                        <span className="text-[13px] text-muted-foreground ml-2">{s.propertyName || '숙소'}</span>
                        {s.managerName && <span className="text-[12px] text-muted-foreground ml-2">· {s.managerName}</span>}
                      </div>
                      {statusInfo && (
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>시간</TableHead>
                    <TableHead>숙소</TableHead>
                    <TableHead>매니저</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.todaySchedule.map((s) => {
                    const statusInfo = STATUS_LABELS[s.status]
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          {formatTimeKorean(s.scheduledTime)}
                          {s.cleaningType === 'urgent' && <span className="text-brand ml-1 text-[11px]">긴급</span>}
                        </TableCell>
                        <TableCell>{s.propertyName || '숙소'}</TableCell>
                        <TableCell>{s.managerName || <span className="text-ink-faint">미배정</span>}</TableCell>
                        <TableCell>
                          {statusInfo && (
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assign Manager Drawer */}
      <Drawer open={assignOpen} onOpenChange={setAssignOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-ink">매니저 배정</DrawerTitle>
            </DrawerHeader>
            {activeManagers.length === 0 ? (
              <p className="text-[14px] text-ink-muted">등록된 매니저가 없어요</p>
            ) : (
              <div className="flex flex-col gap-2">
                {activeManagers.map((m) => (
                  <LoadingButton key={m.id} type="button" variant="outline" loading={assigning} onClick={() => handleAssign(m.id)}>
                    {m.name} ({m.phone})
                  </LoadingButton>
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
