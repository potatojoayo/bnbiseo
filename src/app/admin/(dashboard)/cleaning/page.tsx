'use client'

import { useEffect, useRef, useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { api } from '@/lib/api-client'
import { useAdminCleaning, useAdminManagers, useInvalidateAdmin } from '@/lib/hooks/use-admin'
import { formatDateLabel, formatTimeKorean } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTablePagination, AdminTablePagination } from '@/components/admin-table-pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { LoadingButton } from '@/components/ui/loading-button'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: '결제 대기', color: 'bg-warning-soft text-warning' },
  pending: { label: '배정 대기', color: 'bg-brand/8 text-brand' },
  confirmed: { label: '배정 완료', color: 'bg-success-soft text-success' },
  in_progress: { label: '진행 중', color: 'bg-info-soft text-info' },
  completed: { label: '완료', color: 'bg-surface-soft text-ink' },
  cancelled: { label: '취소', color: 'bg-surface-soft text-ink-faint' },
}

type CleaningFilter = 'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

function StatusBadge({ status }: { status: string }) {
  const info = STATUS_LABELS[status]
  if (!info) return null
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${info.color}`}>{info.label}</span>
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
          <Tabs
            value={tab}
            onValueChange={(value) => {
              setTab(value as CleaningFilter)
              setPage(1)
              setMobileVisibleCount(10)
            }}
            className="w-full"
          >
            <TabsList className="!h-10 w-full justify-start overflow-x-auto rounded-xl bg-surface-subtle p-1">
              <TabsTrigger value="all" className="h-8 shrink-0 rounded-lg px-3 text-[13px] font-medium data-active:bg-background data-active:text-ink">
                전체({allRequests.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="h-8 shrink-0 rounded-lg px-3 text-[13px] font-medium data-active:bg-background data-active:text-ink">
                배정 대기({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="h-8 shrink-0 rounded-lg px-3 text-[13px] font-medium data-active:bg-background data-active:text-ink">
                배정 완료({confirmedCount})
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="h-8 shrink-0 rounded-lg px-3 text-[13px] font-medium data-active:bg-background data-active:text-ink">
                진행 중({inProgressCount})
              </TabsTrigger>
              <TabsTrigger value="completed" className="h-8 shrink-0 rounded-lg px-3 text-[13px] font-medium data-active:bg-background data-active:text-ink">
                완료({completedCount})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="h-8 shrink-0 rounded-lg px-3 text-[13px] font-medium data-active:bg-background data-active:text-ink">
                취소({cancelledCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filteredRequests.length === 0 ? (
          <p className="py-20 text-center text-[14px] text-ink-muted">청소 요청이 없어요</p>
        ) : (
          <>
          <div className="flex flex-col gap-3 md:hidden">
            {mobileRequests.map((r) => (
              <div key={r.id} className="rounded-xl border border-outline-dim px-4 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[15px] font-semibold text-ink">{r.propertyName || '숙소'}</span>
                  <StatusBadge status={r.status} />
                </div>
                <div className="mb-3 flex flex-col gap-1 text-[13px] text-ink-muted">
                  <p>{formatDateLabel(r.scheduledDate)} {formatTimeKorean(r.scheduledTime)} {r.cleaningType === 'urgent' && '(긴급)'}</p>
                  <p>호스트: {r.hostName || r.hostEmail || '-'}</p>
                  <p>매니저: {r.managerName || '미배정'}</p>
                  <p>금액: {r.finalPrice.toLocaleString()}원</p>
                </div>
                <div className="flex gap-2">
                  {r.status === 'pending' && (
                    <button onClick={() => { setAssignTargetId(r.id); setAssignOpen(true) }} className="rounded-lg bg-ink px-3 py-1.5 text-[12px] font-medium text-white">매니저 배정</button>
                  )}
                  {['pending', 'confirmed', 'in_progress'].includes(r.status) && (
                    <button onClick={() => { setStatusTargetId(r.id); setStatusOpen(true) }} className="rounded-lg border border-outline-dim px-3 py-1.5 text-[12px] font-medium text-ink-muted">상태 변경</button>
                  )}
                </div>
              </div>
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
                        {['pending', 'confirmed', 'in_progress'].includes(r.status) && (
                          <button onClick={() => { setStatusTargetId(r.id); setStatusOpen(true) }} className="rounded-md border border-outline-dim px-2.5 py-1 text-[11px] font-medium text-ink-muted">상태</button>
                        )}
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

      {/* Status Change Drawer */}
      <Drawer open={statusOpen} onOpenChange={setStatusOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-ink">상태 변경</DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-2">
              {['confirmed', 'in_progress', 'completed', 'cancelled'].map((s) => {
                const info = STATUS_LABELS[s]
                if (!info) return null
                return (
                  <LoadingButton key={s} type="button" variant="outline" loading={updating} onClick={() => handleStatusChange(s)}>
                    {info.label}
                  </LoadingButton>
                )
              })}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
