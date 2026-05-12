'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDownIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { api } from '@/lib/api-client'
import { useAdminCleaning, useAdminManagers, useInvalidateAdmin } from '@/lib/hooks/use-admin'
import { AdminCleaningRequestCard } from '@/components/admin-cleaning-request-card'
import { CleaningStatusBadge, getCleaningStatusLabel, type CleaningStatus } from '@/components/cleaning-status-badge'
import { formatDateLabel, formatTimeKorean, cn, formatKoreanPhone } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTablePagination, AdminTablePagination } from '@/components/admin-table-pagination'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { LoadingButton } from '@/components/ui/loading-button'

type CleaningFilter = 'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

function StatusBadge({ status }: { status: string }) {
  return (
    <CleaningStatusBadge
      status={status as CleaningStatus}
      label={
        status === 'pending'
          ? '배정 대기'
          : status === 'confirmed'
            ? '배정 완료'
            : status === 'in_progress'
              ? '진행 중'
              : status === 'completed'
                ? '완료'
                : status === 'cancelled'
                  ? '취소'
                  : undefined
      }
    />
  )
}

export default function AdminCleaningPage() {
  const [tab, setTab] = useState<CleaningFilter>('all')
  const [page, setPage] = useState(1)
  const [mobileVisibleCount, setMobileVisibleCount] = useState(10)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const { data: allRequests = [], isLoading: requestsLoading } = useAdminCleaning()
  const { data: allManagers = [], isLoading: managersLoading } = useAdminManagers()
  const invalidate = useInvalidateAdmin()
  const isPageLoading = requestsLoading || managersLoading

  const activeManagers = allManagers.filter((m) => m.isActive)
  const pendingCount = allRequests.filter((request) => request.status === 'pending').length
  const confirmedCount = allRequests.filter((request) => request.status === 'confirmed').length
  const inProgressCount = allRequests.filter((request) => request.status === 'in_progress').length
  const completedCount = allRequests.filter((request) => request.status === 'completed').length
  const cancelledCount = allRequests.filter((request) => request.status === 'cancelled').length
  const filteredRequests = allRequests.filter((request) => (tab === 'all' ? true : request.status === tab))
  const mobileRequests = filteredRequests.slice(0, mobileVisibleCount)
  const { paged, totalPages } = useTablePagination(filteredRequests, page)

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignTargetId, setAssignTargetId] = useState('')
  const [assigning, setAssigning] = useState(false)

  const [statusOpen, setStatusOpen] = useState(false)
  const [statusTargetId, setStatusTargetId] = useState('')
  const [updating, setUpdating] = useState(false)

  const [filterOpen, setFilterOpen] = useState(false)

  const filterOptions: Array<{ value: CleaningFilter; label: string; count: number }> = [
    { value: 'all', label: '전체', count: allRequests.length },
    { value: 'pending', label: '배정 대기', count: pendingCount },
    { value: 'confirmed', label: '배정 완료', count: confirmedCount },
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

  async function handleAssign(managerId: string) {
    setAssigning(true)
    await api.post(`/admin/cleaning/${assignTargetId}/assign`, { managerId })
    setAssigning(false)
    setAssignOpen(false)
    invalidate.cleaning()
    invalidate.stats()
  }

  async function handleStatusChange(status: string) {
    setUpdating(true)
    await api.post(`/admin/cleaning/${statusTargetId}/status`, { status })
    setUpdating(false)
    setStatusOpen(false)
    invalidate.cleaning()
    invalidate.stats()
  }

  return (
    <>
      {!isPageLoading && <SiteHeader title="청소 관리" />}
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
          <p className="py-20 text-center text-[14px] text-ink-muted">청소 요청이 없어요</p>
        ) : (
          <>
          <div className="flex flex-col gap-3 md:hidden">
            {mobileRequests.map((r) => (
              <Link key={r.id} href={`/admin/cleaning/${r.id}`} className="block transition-transform active:scale-[0.99]">
                <AdminCleaningRequestCard request={r} />
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
                  <TableHead>날짜/시간</TableHead>
                  <TableHead>호스트</TableHead>
                  <TableHead>매니저</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.propertyName || '숙소'}</TableCell>
                    <TableCell>
                      {formatDateLabel(r.scheduledDate)} {formatTimeKorean(r.scheduledTime)}
                      {r.cleaningType === 'urgent' && <span className="text-brand ml-1 text-[11px]">긴급</span>}
                    </TableCell>
                    <TableCell>{r.hostName || r.hostEmail || '-'}</TableCell>
                    <TableCell>{r.managerName || <span className="text-ink-faint">미배정</span>}</TableCell>
                    <TableCell>{r.finalPrice.toLocaleString()}원</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {r.status === 'pending' && (
                          <button onClick={() => { setAssignTargetId(r.id); setAssignOpen(true) }} className="rounded-md bg-ink px-2.5 py-1 text-[11px] font-medium text-white">배정</button>
                        )}
                        {/* {['pending', 'confirmed', 'in_progress'].includes(r.status) && (
                          <button onClick={() => { setStatusTargetId(r.id); setStatusOpen(true) }} className="rounded-md border border-outline-dim px-2.5 py-1 text-[11px] font-medium text-ink-muted">상태</button>
                        )} */}
                      </div>
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

      {/* Status Filter Drawer */}
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
                    {m.name} ({formatKoreanPhone(m.phone)})
                  </LoadingButton>
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Status Change Drawer */}
      <Drawer open={statusOpen} onOpenChange={setStatusOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-ink">상태 변경</DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-2">
              {(['confirmed', 'in_progress', 'completed', 'cancelled'] as CleaningStatus[]).map((status) => (
                <LoadingButton key={status} type="button" variant="outline" loading={updating} onClick={() => handleStatusChange(status)}>
                  {getCleaningStatusLabel(status)}
                </LoadingButton>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
