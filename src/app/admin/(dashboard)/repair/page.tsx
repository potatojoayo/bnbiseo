'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDownIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { useAdminRepair, useAdminManagers } from '@/lib/hooks/use-admin'
import { AdminRepairRequestCard } from '@/components/admin-repair-request-card'
import { RepairStatusBadge } from '@/components/repair-status-badge'
import type { RepairStatus } from '@/lib/hooks/use-repair'
import { formatDateLabel, formatTimeKorean } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTablePagination, AdminTablePagination } from '@/components/admin-table-pagination'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

type RepairFilter = 'all' | RepairStatus

export default function AdminRepairPage() {
  const [tab, setTab] = useState<RepairFilter>('all')
  const [page, setPage] = useState(1)
  const [mobileVisibleCount, setMobileVisibleCount] = useState(10)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const { data: allRequests = [], isLoading: requestsLoading } = useAdminRepair()
  const { isLoading: managersLoading } = useAdminManagers()
  const isPageLoading = requestsLoading || managersLoading

  const submittedCount = allRequests.filter((r) => r.status === 'submitted').length
  const quotedCount = allRequests.filter((r) => r.status === 'quoted').length
  const confirmedCount = allRequests.filter((r) => r.status === 'confirmed').length
  const inProgressCount = allRequests.filter((r) => r.status === 'in_progress').length
  const completedCount = allRequests.filter((r) => r.status === 'completed').length
  const cancelledCount = allRequests.filter((r) => r.status === 'cancelled').length
  const filteredRequests = allRequests.filter((r) => (tab === 'all' ? true : r.status === tab))
  const mobileRequests = filteredRequests.slice(0, mobileVisibleCount)
  const { paged, totalPages } = useTablePagination(filteredRequests, page)

  const [filterOpen, setFilterOpen] = useState(false)

  const filterOptions: Array<{ value: RepairFilter; label: string; count: number }> = [
    { value: 'all', label: '전체', count: allRequests.length },
    { value: 'submitted', label: '매니저 확인 중', count: submittedCount },
    { value: 'quoted', label: '견적 발송', count: quotedCount },
    { value: 'confirmed', label: '방문 예정', count: confirmedCount },
    { value: 'in_progress', label: '진행 중', count: inProgressCount },
    { value: 'completed', label: '완료', count: completedCount },
    { value: 'cancelled', label: '취소', count: cancelledCount },
  ]
  const currentFilter = filterOptions.find((option) => option.value === tab) ?? filterOptions[0]

  useEffect(() => {
    const target = loadMoreRef.current

    if (!target || mobileVisibleCount >= filteredRequests.length) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        setMobileVisibleCount((current) => Math.min(current + 10, filteredRequests.length))
      },
      { rootMargin: '120px 0px' },
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [filteredRequests.length, mobileVisibleCount])

  return (
    <>
      {!isPageLoading && <SiteHeader title="수리 관리" />}
      {isPageLoading ? (
        <div className="flex min-h-[100dvh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 p-6 max-w-[960px] mx-auto w-full max-md:gap-3 max-md:animate-fade-up-fast">
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-outline-dim bg-background px-4 text-[14px] font-medium text-ink transition-colors hover:bg-surface-soft"
            >
              <span>
                {currentFilter.label}
                <span className="ml-1 text-ink-muted">({currentFilter.count})</span>
              </span>
              <ChevronDownIcon size={16} className="text-ink-muted" />
            </button>
          </div>

          {filteredRequests.length === 0 ? (
            <p className="py-20 text-center text-[14px] text-ink-muted">수리 요청이 없어요</p>
          ) : (
            <>
              <div className="flex flex-col gap-3 md:hidden">
                {mobileRequests.map((r) => (
                  <Link
                    key={r.id}
                    href={`/admin/repair/${r.id}`}
                    className="block transition-transform active:scale-[0.99]"
                  >
                    <AdminRepairRequestCard request={r} />
                  </Link>
                ))}
                {mobileVisibleCount < filteredRequests.length && (
                  <div ref={loadMoreRef} className="flex items-center justify-center py-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
                  </div>
                )}
              </div>
              <div className="overflow-hidden rounded-xl border border-outline-dim max-md:hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>숙소</TableHead>
                      <TableHead>희망 날짜/시간</TableHead>
                      <TableHead>호스트</TableHead>
                      <TableHead>매니저</TableHead>
                      <TableHead>견적</TableHead>
                      <TableHead>상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((r) => (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() => {
                          window.location.href = `/admin/repair/${r.id}`
                        }}
                      >
                        <TableCell>{r.propertyName || '숙소'}</TableCell>
                        <TableCell>
                          {formatDateLabel(r.scheduledDate ?? r.preferredScheduledDate)}{' '}
                          {formatTimeKorean(r.scheduledTime ?? r.preferredScheduledTime)}
                        </TableCell>
                        <TableCell>{r.hostName || r.hostEmail || '-'}</TableCell>
                        <TableCell>
                          {r.managerName || <span className="text-ink-faint">미배정</span>}
                        </TableCell>
                        <TableCell>
                          {r.quotedCost != null ? `${r.quotedCost.toLocaleString()}원` : '-'}
                        </TableCell>
                        <TableCell>
                          <RepairStatusBadge status={r.status as RepairStatus} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="max-md:hidden">
                <AdminTablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      )}

      <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-ink">상태 필터</DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-2">
              {filterOptions.map((option) => {
                const selected = option.value === tab
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setTab(option.value)
                      setPage(1)
                      setMobileVisibleCount(10)
                      setFilterOpen(false)
                    }}
                    className={`flex h-12 items-center justify-between rounded-lg border px-4 text-[14px] font-medium transition-colors ${
                      selected
                        ? 'border-ink bg-surface-soft text-ink'
                        : 'border-outline-dim text-ink hover:bg-surface-soft'
                    }`}
                  >
                    <span>{option.label}</span>
                    <span className="text-[13px] text-ink-muted">{option.count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
