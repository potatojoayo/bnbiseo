'use client'

import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { api, ApiError } from '@/lib/api-client'
import { useAdminManagers, useInvalidateAdmin } from '@/lib/hooks/use-admin'
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
  email: string | null
  name: string
  phone: string
  memo: string | null
  isActive: boolean
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export default function AdminManagersPage() {
  const { data: managers = [], isLoading } = useAdminManagers()
  const invalidate = useInvalidateAdmin()
  const isMobile = useIsMobile()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Manager | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Manager | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const { paged, totalPages } = useTablePagination(managers, page)

  function openCreate() {
    setEditTarget(null)
    setEmail('')
    setPassword('')
    setName('')
    setPhone('')
    setMemo('')
    setMessage(null)
    setFormOpen(true)
  }

  function openEdit(m: Manager) {
    setEditTarget(m)
    setEmail(m.email || '')
    setPassword('')
    setName(m.name)
    setPhone(m.phone)
    setMemo(m.memo || '')
    setMessage(null)
    setFormOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      if (editTarget) {
        await api.patch(`/admin/managers/${editTarget.id}`, { name, phone, memo: memo || undefined })
      } else {
        await api.post('/admin/managers', { email, password, name, phone, memo: memo || undefined })
      }
      setFormOpen(false)
      invalidate.managers()
      invalidate.stats()
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.message)
      } else {
        setMessage(editTarget ? '매니저 수정에 실패했어요.' : '매니저 생성에 실패했어요.')
      }
    } finally {
      setSaving(false)
    }
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
          <p className="text-[14px] text-ink-muted">총 {managers.length}명</p>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[13px] font-medium text-white"
          >
            <PlusIcon size={14} />
            매니저 추가
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
          </div>
        ) : managers.length === 0 ? (
          <p className="py-20 text-center text-[14px] text-ink-muted">등록된 매니저가 없어요</p>
        ) : isMobile ? (
          /* ─── Mobile: Cards ─── */
          <div className="flex flex-col gap-3">
            {managers.map((m) => (
              <div key={m.id} className="rounded-xl border border-outline-dim px-4 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[15px] font-semibold text-ink">{m.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${m.isActive ? 'bg-success-soft text-success' : 'bg-surface-soft text-ink-faint'}`}>
                    {m.isActive ? '활성' : '비활성'}
                  </span>
                </div>
                {m.email && <p className="text-[13px] text-ink-muted">{m.email}</p>}
                <p className="text-[13px] text-ink-muted">{m.phone}</p>
                {m.memo && <p className="mt-1 text-[12px] text-ink-faint">{m.memo}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(m)} className="rounded-lg border border-outline-dim px-3 py-1.5 text-[12px] font-medium text-ink-muted">수정</button>
                  <button onClick={() => handleToggle(m)} className="rounded-lg border border-outline-dim px-3 py-1.5 text-[12px] font-medium text-ink-muted">{m.isActive ? '비활성화' : '활성화'}</button>
                  <button onClick={() => { setDeleteTarget(m); setDeleteOpen(true) }} className="rounded-lg border border-outline-dim px-3 py-1.5 text-[12px] font-medium text-ink-faint">삭제</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ─── Desktop: Table ─── */
          <>
          <div className="overflow-hidden rounded-xl border border-outline-dim">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
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
                    <TableCell className="text-ink-muted">{m.email || '-'}</TableCell>
                    <TableCell>{m.phone}</TableCell>
                    <TableCell className="text-ink-muted">{m.memo || '-'}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${m.isActive ? 'bg-success-soft text-success' : 'bg-surface-soft text-ink-faint'}`}>
                        {m.isActive ? '활성' : '비활성'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(m)} className="rounded-md border border-outline-dim px-2.5 py-1 text-[11px] font-medium text-ink-muted">수정</button>
                        <button onClick={() => handleToggle(m)} className="rounded-md border border-outline-dim px-2.5 py-1 text-[11px] font-medium text-ink-muted">{m.isActive ? '비활성화' : '활성화'}</button>
                        <button onClick={() => { setDeleteTarget(m); setDeleteOpen(true) }} className="rounded-md border border-outline-dim px-2.5 py-1 text-[11px] font-medium text-ink-faint">삭제</button>
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
              <DrawerTitle className="text-[18px] font-semibold text-ink">{editTarget ? '매니저 수정' : '매니저 추가'}</DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-4">
              {!editTarget ? (
                <CompoundInput>
                  <FloatingInput label="이메일" type="email" value={email} onChange={(e) => setEmail(e.target.value)} borderRadius="12px 12px 0 0" />
                  <FloatingInput label="비밀번호" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} borderRadius="0 0 12px 12px" />
                </CompoundInput>
              ) : (
                <CompoundInput>
                  <FloatingInput label="이메일" type="email" value={email} onChange={() => {}} disabled borderRadius="12px" />
                </CompoundInput>
              )}
              <CompoundInput>
                <FloatingInput label="이름" value={name} onChange={(e) => setName(e.target.value)} borderRadius="12px 12px 0 0" />
                <FloatingInput label="전화번호" inputMode="numeric" placeholder="010-1234-5678" value={phone} onChange={(e) => setPhone(formatPhoneNumber(e.target.value))} borderRadius="0 0 12px 12px" />
              </CompoundInput>
              <CompoundInput>
                <FloatingInput label="메모 (선택)" value={memo} onChange={(e) => setMemo(e.target.value)} borderRadius="12px" />
              </CompoundInput>
              {message && (
                <p className="text-[13px] text-destructive">
                  {message}
                </p>
              )}
              <LoadingButton type="button" variant="primary" loading={saving} loadingText="저장 중..." disabled={!name || !phone || (!editTarget && (!email || !password))} onClick={handleSave}>
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
              <DrawerTitle className="text-[18px] font-semibold text-ink">매니저를 삭제할까요?</DrawerTitle>
            </DrawerHeader>
            <p className="mb-6 text-[14px] text-ink-muted">{deleteTarget?.name}님을 삭제하면 되돌릴 수 없어요.</p>
            <div className="flex flex-col gap-2">
              <LoadingButton type="button" variant="destructive" loading={deleting} loadingText="삭제 중..." onClick={handleDelete}>삭제하기</LoadingButton>
              <button type="button" onClick={() => setDeleteOpen(false)} className="h-12 rounded-lg text-[15px] font-semibold text-ink-muted transition-colors active:bg-surface-soft">닫기</button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
