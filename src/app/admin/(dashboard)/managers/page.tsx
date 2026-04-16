'use client'

import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { api } from '@/lib/api-client'
import { useAdminManagers, useAdminUsers, useInvalidateAdmin } from '@/lib/hooks/use-admin'
import { useIsMobile } from '@/hooks/use-mobile'
import { PlusIcon } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTablePagination, AdminTablePagination } from '@/components/admin-table-pagination'
import { FloatingInput, CompoundInput } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading-button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

type Manager = {
  id: string
  profileId: string
  name: string
  phone: string
  memo: string | null
  isActive: boolean
}

type User = {
  id: string
  email: string | null
  fullName: string | null
  phone: string | null
  role: string
}

export default function AdminManagersPage() {
  const { data: managers = [], isLoading } = useAdminManagers()
  const { data: users = [] } = useAdminUsers()
  const invalidate = useInvalidateAdmin()
  const isMobile = useIsMobile()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Manager | null>(null)
  const [profileId, setProfileId] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Manager | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const { paged, totalPages } = useTablePagination(managers, page)
  const managerUsers = (users as User[]).filter((user) => user.role === 'manager')
  const linkedProfileIds = new Set(managers.map((manager) => manager.profileId))
  const availableManagerUsers = managerUsers.filter((user) =>
    !linkedProfileIds.has(user.id) || user.id === editTarget?.profileId
  )

  function openCreate() {
    setEditTarget(null)
    setProfileId('')
    setName('')
    setPhone('')
    setMemo('')
    setFormOpen(true)
  }

  function openEdit(m: Manager) {
    setEditTarget(m)
    setProfileId(m.profileId)
    setName(m.name)
    setPhone(m.phone)
    setMemo(m.memo || '')
    setFormOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    if (editTarget) {
      await api.patch(`/admin/managers/${editTarget.id}`, { profileId, name, phone, memo: memo || undefined })
    } else {
      await api.post('/admin/managers', { profileId, name, phone, memo: memo || undefined })
    }
    setSaving(false)
    setFormOpen(false)
    invalidate.managers()
    invalidate.stats()
  }

  async function handleToggle(m: Manager) {
    await api.post(`/admin/managers/${m.id}/toggle`)
    invalidate.managers()
    invalidate.stats()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await api.delete(`/admin/managers/${deleteTarget.id}`)
    setDeleting(false)
    setDeleteOpen(false)
    invalidate.managers()
    invalidate.stats()
  }

  return (
    <>
      <SiteHeader title="매니저 관리" />
      <div className="flex flex-1 flex-col gap-4 p-6 max-w-[960px] mx-auto w-full max-md:gap-3">
        <div className="flex items-center justify-between h-9">
          <p className="text-[14px] text-[#717171]">총 {managers.length}명</p>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#222222] text-white text-[13px] font-medium"
          >
            <PlusIcon size={14} />
            매니저 추가
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-[#EBEBEB] border-t-[#717171] animate-spin" />
          </div>
        ) : managers.length === 0 ? (
          <p className="text-center text-[14px] text-[#717171] py-20">등록된 매니저가 없어요</p>
        ) : isMobile ? (
          /* ─── Mobile: Cards ─── */
          <div className="flex flex-col gap-3">
            {managers.map((m) => (
              <div key={m.id} className="rounded-xl border border-[#EBEBEB] px-4 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[15px] font-semibold text-[#222222]">{m.name}</span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${m.isActive ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F7F7F7] text-[#B0B0B0]'}`}>
                    {m.isActive ? '활성' : '비활성'}
                  </span>
                </div>
                <p className="text-[13px] text-[#717171]">{m.phone}</p>
                {m.memo && <p className="text-[12px] text-[#B0B0B0] mt-1">{m.memo}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(m)} className="px-3 py-1.5 rounded-lg border border-[#EBEBEB] text-[12px] font-medium text-[#717171]">수정</button>
                  <button onClick={() => handleToggle(m)} className="px-3 py-1.5 rounded-lg border border-[#EBEBEB] text-[12px] font-medium text-[#717171]">{m.isActive ? '비활성화' : '활성화'}</button>
                  <button onClick={() => { setDeleteTarget(m); setDeleteOpen(true) }} className="px-3 py-1.5 rounded-lg border border-[#EBEBEB] text-[12px] font-medium text-[#B0B0B0]">삭제</button>
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
                  <TableHead>이름</TableHead>
                  <TableHead>전화번호</TableHead>
                  <TableHead>메모</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.phone}</TableCell>
                    <TableCell className="text-[#717171]">{m.memo || '-'}</TableCell>
                    <TableCell>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${m.isActive ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F7F7F7] text-[#B0B0B0]'}`}>
                        {m.isActive ? '활성' : '비활성'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(m)} className="px-2.5 py-1 rounded-md border border-[#EBEBEB] text-[11px] font-medium text-[#717171]">수정</button>
                        <button onClick={() => handleToggle(m)} className="px-2.5 py-1 rounded-md border border-[#EBEBEB] text-[11px] font-medium text-[#717171]">{m.isActive ? '비활성화' : '활성화'}</button>
                        <button onClick={() => { setDeleteTarget(m); setDeleteOpen(true) }} className="px-2.5 py-1 rounded-md border border-[#EBEBEB] text-[11px] font-medium text-[#B0B0B0]">삭제</button>
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

      {/* Create/Edit Drawer */}
      <Drawer open={formOpen} onOpenChange={setFormOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-[#222222]">{editTarget ? '매니저 수정' : '매니저 추가'}</DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-4">
              <CompoundInput>
                <div className="relative rounded-[12px] border border-[#B0B0B0] px-4 pb-[10px] pt-[26px]">
                  <label className="absolute left-4 top-[8px] text-[11px] font-semibold uppercase tracking-wider text-[#717171]">
                    매니저 회원
                  </label>
                  <select
                    value={profileId}
                    onChange={(e) => setProfileId(e.target.value)}
                    className="w-full bg-transparent text-[16px] text-[#222222] outline-none"
                  >
                    <option value="">매니저 회원 선택</option>
                    {availableManagerUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName || user.email || user.id}
                      </option>
                    ))}
                  </select>
                </div>
              </CompoundInput>
              <CompoundInput>
                <FloatingInput label="이름" value={name} onChange={(e) => setName(e.target.value)} borderRadius="12px 12px 0 0" />
                <FloatingInput label="전화번호" value={phone} onChange={(e) => setPhone(e.target.value)} borderRadius="0 0 12px 12px" />
              </CompoundInput>
              <CompoundInput>
                <FloatingInput label="메모 (선택)" value={memo} onChange={(e) => setMemo(e.target.value)} borderRadius="12px" />
              </CompoundInput>
              <LoadingButton type="button" variant="primary" loading={saving} loadingText="저장 중..." disabled={!profileId || !name || !phone} onClick={handleSave}>
                {editTarget ? '수정하기' : '추가하기'}
              </LoadingButton>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Delete Drawer */}
      <Drawer open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-[#222222]">매니저를 삭제할까요?</DrawerTitle>
            </DrawerHeader>
            <p className="text-[14px] text-[#717171] mb-6">{deleteTarget?.name}님을 삭제하면 되돌릴 수 없어요.</p>
            <div className="flex flex-col gap-2">
              <LoadingButton type="button" variant="destructive" loading={deleting} loadingText="삭제 중..." onClick={handleDelete}>삭제하기</LoadingButton>
              <button type="button" onClick={() => setDeleteOpen(false)} className="h-12 rounded-lg text-[15px] font-semibold text-[#717171] active:bg-[#F7F7F7] transition-colors">닫기</button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
