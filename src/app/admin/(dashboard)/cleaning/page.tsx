'use client'

import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { api } from '@/lib/api-client'
import { formatDateLabel, formatTimeKorean } from '@/lib/utils'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { LoadingButton } from '@/components/ui/loading-button'

type CleaningRequest = {
  id: string
  propertyName: string | null
  propertyAddress: string | null
  hostName: string | null
  hostEmail: string | null
  managerId: string | null
  managerName: string | null
  cleaningType: string
  status: string
  scheduledDate: string
  scheduledTime: string
  memo: string | null
  finalPrice: number
  createdAt: string
}

type Manager = {
  id: string
  name: string
  phone: string
  isActive: boolean
}

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

export default function AdminCleaningPage() {
  const [requests, setRequests] = useState<CleaningRequest[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('')

  // Assign drawer
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<CleaningRequest | null>(null)
  const [assigning, setAssigning] = useState(false)

  // Status drawer
  const [statusOpen, setStatusOpen] = useState(false)
  const [statusTarget, setStatusTarget] = useState<CleaningRequest | null>(null)
  const [updating, setUpdating] = useState(false)

  async function fetchData() {
    setLoading(true)
    const [r, m] = await Promise.all([
      api.get<CleaningRequest[]>(`/admin/cleaning${tab ? `?status=${tab}` : ''}`),
      api.get<Manager[]>('/admin/managers'),
    ])
    setRequests(r)
    setManagers(m.filter((m) => m.isActive))
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [tab])

  async function handleAssign(managerId: string) {
    if (!assignTarget) return
    setAssigning(true)
    await api.post(`/admin/cleaning/${assignTarget.id}/assign`, { managerId })
    setAssigning(false)
    setAssignOpen(false)
    fetchData()
  }

  async function handleStatusChange(status: string) {
    if (!statusTarget) return
    setUpdating(true)
    await api.post(`/admin/cleaning/${statusTarget.id}/status`, { status })
    setUpdating(false)
    setStatusOpen(false)
    fetchData()
  }

  return (
    <>
      <SiteHeader title="청소 관리" />
      <div className="flex flex-1 flex-col p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'bg-[#222222] text-white'
                  : 'bg-[#F7F7F7] text-[#717171] hover:bg-[#EBEBEB]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-[#EBEBEB] border-t-[#717171] animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-center text-[14px] text-[#717171] py-20">청소 요청이 없어요</p>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((r) => {
              const statusInfo = STATUS_LABELS[r.status]
              return (
                <div key={r.id} className="rounded-xl border border-[#EBEBEB] px-4 py-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[15px] font-semibold text-[#222222]">
                      {r.propertyName || '숙소'}
                    </span>
                    {statusInfo && (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-col gap-1 text-[13px] text-[#717171] mb-3">
                    <p>{formatDateLabel(r.scheduledDate)} {formatTimeKorean(r.scheduledTime)} {r.cleaningType === 'urgent' && '(긴급)'}</p>
                    <p>호스트: {r.hostName || r.hostEmail || '-'}</p>
                    <p>매니저: {r.managerName || '미배정'}</p>
                    <p>금액: {r.finalPrice.toLocaleString()}원</p>
                    {r.memo && <p>메모: {r.memo}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {r.status === 'pending' && (
                      <button
                        onClick={() => { setAssignTarget(r); setAssignOpen(true) }}
                        className="px-3 py-1.5 rounded-lg bg-[#222222] text-white text-[12px] font-medium"
                      >
                        매니저 배정
                      </button>
                    )}
                    {['pending', 'confirmed', 'in_progress'].includes(r.status) && (
                      <button
                        onClick={() => { setStatusTarget(r); setStatusOpen(true) }}
                        className="px-3 py-1.5 rounded-lg border border-[#EBEBEB] text-[12px] font-medium text-[#717171]"
                      >
                        상태 변경
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Assign Manager Drawer */}
      <Drawer open={assignOpen} onOpenChange={setAssignOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-[#222222]">
                매니저 배정
              </DrawerTitle>
            </DrawerHeader>
            {managers.length === 0 ? (
              <p className="text-[14px] text-[#717171]">등록된 매니저가 없어요</p>
            ) : (
              <div className="flex flex-col gap-2">
                {managers.map((m) => (
                  <LoadingButton
                    key={m.id}
                    type="button"
                    variant="outline"
                    loading={assigning}
                    onClick={() => handleAssign(m.id)}
                  >
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
              <DrawerTitle className="text-[18px] font-semibold text-[#222222]">
                상태 변경
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-2">
              {['confirmed', 'in_progress', 'completed', 'cancelled'].map((s) => {
                const info = STATUS_LABELS[s]
                if (!info) return null
                return (
                  <LoadingButton
                    key={s}
                    type="button"
                    variant="outline"
                    loading={updating}
                    onClick={() => handleStatusChange(s)}
                  >
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
