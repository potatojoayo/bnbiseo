'use client'

import Link from 'next/link'
import { Building2Icon, CalendarIcon, WalletIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { useAdminProperties, useAdminStats } from '@/lib/hooks/use-admin'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data: properties = [], isLoading: propertiesLoading } = useAdminProperties()
  const isPageLoading = statsLoading || propertiesLoading

  const pendingProperties = properties.filter((property) => property.status === 'pending_activation')
  const activeProperties = properties.filter((property) => property.status === 'active')
  const todayTotal = stats
    ? stats.todayCleaning.pending + stats.todayCleaning.confirmed + stats.todayCleaning.inProgress + stats.todayCleaning.completed
    : 0

  return (
    <>
      {!isPageLoading && <SiteHeader title="대시보드" />}
      {isPageLoading ? (
        <div className="flex min-h-[100dvh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-4 p-6 max-md:animate-fade-up-fast max-md:gap-3">
          <Link href="/admin/properties" className="block transition-transform active:scale-[0.99]">
            <Card className="border-outline-dim">
              <CardHeader>
                <CardDescription className="text-[14px] text-ink-muted">미등록 숙소</CardDescription>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-[26px] font-semibold text-ink">
                      {pendingProperties.length}개
                    </CardTitle>
                    <p className="mt-1 text-[13px] text-ink-muted">
                      등록 대기 중인 숙소를 먼저 확인해주세요.
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link href="/admin/cleaning" className="block transition-transform active:scale-[0.99]">
              <Card className="h-full border-outline-dim">
                <CardHeader>
                  <CardDescription className="text-[14px] text-ink-muted">미배정 청소</CardDescription>
                  <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-[26px] font-semibold text-ink">
                      {stats?.pendingAssignment.length ?? 0}건
                    </CardTitle>
                    <p className="mt-1 text-[13px] text-ink-muted">배정이 필요한 요청이에요.</p>
                  </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/cleaning" className="block transition-transform active:scale-[0.99]">
              <Card className="h-full border-outline-dim">
                <CardHeader>
                  <CardDescription className="text-[14px] text-ink-muted">오늘 청소</CardDescription>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-[26px] font-semibold text-ink">
                        {todayTotal}건
                      </CardTitle>
                      <p className="mt-1 text-[13px] text-ink-muted">
                        대기 {stats?.todayCleaning.pending ?? 0} · 배정 {stats?.todayCleaning.confirmed ?? 0} · 진행 {stats?.todayCleaning.inProgress ?? 0} · 완료 {stats?.todayCleaning.completed ?? 0}
                      </p>
                    </div>
                    <CalendarIcon className="size-5 text-ink-faint" />
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Card className="h-full border-outline-dim">
              <CardHeader>
                <CardDescription className="text-[14px] text-ink-muted">오늘 매출</CardDescription>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-[26px] font-semibold text-ink">
                      {(stats?.todayRevenue ?? 0).toLocaleString()}원
                    </CardTitle>
                    <p className="mt-1 text-[13px] text-ink-muted">오늘 완료된 청소 기준 매출이에요.</p>
                  </div>
                  <WalletIcon className="size-5 text-ink-faint" />
                </div>
              </CardHeader>
            </Card>

            <Link href="/admin/properties" className="block transition-transform active:scale-[0.99]">
              <Card className="h-full border-outline-dim">
                <CardHeader>
                  <CardDescription className="text-[14px] text-ink-muted">전체 숙소</CardDescription>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                    <CardTitle className="text-[26px] font-semibold text-ink">
                        {activeProperties.length}개
                      </CardTitle>
                      <p className="mt-1 text-[13px] text-ink-muted">등록 완료된 숙소 기준이에요.</p>
                    </div>
                    <Building2Icon className="size-5 text-ink-faint" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
