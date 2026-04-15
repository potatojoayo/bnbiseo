'use client'

import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { api } from '@/lib/api-client'
import { useAdminCleaning, useAdminManagers, useInvalidateAdmin } from '@/lib/hooks/use-admin'
import { formatDateLabel, formatTimeKorean } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTablePagination, AdminTablePagination } from '@/components/admin-table-pagination'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { LoadingButton } from '@/components/ui/loading-button'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: '결제 대기', color: 'bg-[#FFF8E1] text-[#F57F17]' },
  pending: { label: '배정 대기', color: 'bg-[#FFF1F3] text-brand' },
  confirmed: { label: '배정 완료', color: 'bg-[#E8F5E9] text-[#2E7D32]' },
  in_progress: { label: '진행 중', color: 'bg-[#E3F2FD] text-[#1565C0]' },
  completed: { label: '완료', color: 'bg-[#F7F7F7] text-[#222222]' },
  cancelled: { label: '취소', color: 'bg-[#F7F7F7] text-[#B0B0B0]' },
}

const TABS = [
  { key: '', label: '전체' },
  { key: 'pending', label: '배정 대기' },
  { key: 'confirmed', label: '배정 완료' },
  { key: 'in_progress', label: '진행 중' },
  { key: 'completed', label: '완료' },
  { key: 'cancelled', label: '취소' },
]

function StatusBadge({ status }: { status: string }) {
  const info = STATUS_LABELS[status]
  if (!info) return null
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${info.color}`}>{info.label}</span>
}

export default function AdminCleaningPage() {
  const [tab, setTab] = useState('')
  const { data: requests = [], isLoading } = useAdminCleaning(tab || undefined)
  const { data: allManagers = [] } = useAdminManagers()
  const invalidate = useInvalidateAdmin()
  const isMobile = useIsMobile()

  const activeManagers = allManagers.filter((m) => m.isActive)

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignTargetId, setAssignTargetId] = useState('')
  const [assigning, setAssigning] = useState(false)

  const [statusOpen, setStatusOpen] = useState(false)
  const [statusTargetId, setStatusTargetId] = useState('')
  const [updating, setUpdating] = useState(false)
  const [page, setPage] = useState(1)
  const { paged, totalPages } = useTablePagination(requests, page)

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
      <SiteHeader title="청소 관리" />
      <div className="flex flex-1 flex-col gap-4 p-6 max-w-[960px] mx-auto w-full max-md:gap-3">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                tab === t.key ? 'bg-[#222222] text-white' : 'bg-[#F7F7F7] text-[#717171] hover:bg-[#EBEBEB]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-[#EBEBEB] border-t-[#717171] animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-center text-[14px] text-[#717171] py-20">청소 요청이 없어요</p>
        ) : isMobile ? (
          /* ─── Mobile: Cards ─── */
          <div className="flex flex-col gap-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-xl border border-[#EBEBEB] px-4 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[15px] font-semibold text-[#222222]">{r.propertyName || '숙소'}</span>
                  <StatusBadge status={r.status} />
                </div>
                <div className="flex flex-col gap-1 text-[13px] text-[#717171] mb-3">
                  <p>{formatDateLabel(r.scheduledDate)} {formatTimeKorean(r.scheduledTime)} {r.cleaningType === 'urgent' && '(긴급)'}</p>
                  <p>호스트: {r.hostName || r.hostEmail || '-'}</p>
                  <p>매니저: {r.managerName || '미배정'}</p>
                  <p>금액: {r.finalPrice.toLocaleString()}원</p>
                </div>
                <div className="flex gap-2">
                  {r.status === 'pending' && (
                    <button onClick={() => { setAssignTargetId(r.id); setAssignOpen(true) }} className="px-3 py-1.5 rounded-lg bg-[#222222] text-white text-[12px] font-medium">매니저 배정</button>
                  )}
                  {['pending', 'confirmed', 'in_progress'].includes(r.status) && (
                    <button onClick={() => { setStatusTargetId(r.id); setStatusOpen(true) }} className="px-3 py-1.5 rounded-lg border border-[#EBEBEB] text-[12px] font-medium text-[#717171]">상태 변경</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ─── Desktop: Table ─── */
          <>
          <div className="rounded-xl border border-[#EBEBEB] overflow-hidden">
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
                    <TableCell>{r.managerName || <span className="text-[#B0B0B0]">미배정</span>}</TableCell>
                    <TableCell>{r.finalPrice.toLocaleString()}원</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {r.status === 'pending' && (
                          <button onClick={() => { setAssignTargetId(r.id); setAssignOpen(true) }} className="px-2.5 py-1 rounded-md bg-[#222222] text-white text-[11px] font-medium">배정</button>
                        )}
                        {['pending', 'confirmed', 'in_progress'].includes(r.status) && (
                          <button onClick={() => { setStatusTargetId(r.id); setStatusOpen(true) }} className="px-2.5 py-1 rounded-md border border-[#EBEBEB] text-[11px] font-medium text-[#717171]">상태</button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AdminTablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Assign Manager Drawer */}
      <Drawer open={assignOpen} onOpenChange={setAssignOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-[#222222]">매니저 배정</DrawerTitle>
            </DrawerHeader>
            {activeManagers.length === 0 ? (
              <p className="text-[14px] text-[#717171]">등록된 매니저가 없어요</p>
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
              <DrawerTitle className="text-[18px] font-semibold text-[#222222]">상태 변경</DrawerTitle>
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
