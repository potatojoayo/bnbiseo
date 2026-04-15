'use client'

import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { api } from '@/lib/api-client'
import { PlusIcon } from 'lucide-react'
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
  name: string
  phone: string
  memo: string | null
  isActive: boolean
  createdAt: string
}

export default function AdminManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)

  // Create/Edit drawer
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Manager | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete drawer
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Manager | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchManagers() {
    setLoading(true)
    const data = await api.get<Manager[]>('/admin/managers')
    setManagers(data)
    setLoading(false)
  }

  useEffect(() => { fetchManagers() }, [])

  function openCreate() {
    setEditTarget(null)
    setName('')
    setPhone('')
    setMemo('')
    setFormOpen(true)
  }

  function openEdit(m: Manager) {
    setEditTarget(m)
    setName(m.name)
    setPhone(m.phone)
    setMemo(m.memo || '')
    setFormOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    if (editTarget) {
      await api.patch(`/admin/managers/${editTarget.id}`, { name, phone, memo: memo || undefined })
    } else {
      await api.post('/admin/managers', { name, phone, memo: memo || undefined })
    }
    setSaving(false)
    setFormOpen(false)
    fetchManagers()
  }

  async function handleToggle(m: Manager) {
    await api.post(`/admin/managers/${m.id}/toggle`)
    fetchManagers()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await api.delete(`/admin/managers/${deleteTarget.id}`)
    setDeleting(false)
    setDeleteOpen(false)
    fetchManagers()
  }

  return (
    <>
      <SiteHeader title="매니저 관리" />
      <div className="flex flex-1 flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-[14px] text-[#717171]">
            총 {managers.length}명
          </p>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#222222] text-white text-[13px] font-medium"
          >
            <PlusIcon size={14} />
            매니저 추가
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-[#EBEBEB] border-t-[#717171] animate-spin" />
          </div>
        ) : managers.length === 0 ? (
          <p className="text-center text-[14px] text-[#717171] py-20">등록된 매니저가 없어요</p>
        ) : (
          <div className="flex flex-col gap-3">
            {managers.map((m) => (
              <div key={m.id} className="rounded-xl border border-[#EBEBEB] px-4 py-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-[#222222]">{m.name}</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      m.isActive ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F7F7F7] text-[#B0B0B0]'
                    }`}>
                      {m.isActive ? '활성' : '비활성'}
                    </span>
                  </div>
                </div>
                <p className="text-[13px] text-[#717171]">{m.phone}</p>
                {m.memo && <p className="text-[12px] text-[#B0B0B0] mt-1">{m.memo}</p>}

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEdit(m)}
                    className="px-3 py-1.5 rounded-lg border border-[#EBEBEB] text-[12px] font-medium text-[#717171]"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleToggle(m)}
                    className="px-3 py-1.5 rounded-lg border border-[#EBEBEB] text-[12px] font-medium text-[#717171]"
                  >
                    {m.isActive ? '비활성화' : '활성화'}
                  </button>
                  <button
                    onClick={() => { setDeleteTarget(m); setDeleteOpen(true) }}
                    className="px-3 py-1.5 rounded-lg border border-[#EBEBEB] text-[12px] font-medium text-[#B0B0B0]"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Drawer */}
      <Drawer open={formOpen} onOpenChange={setFormOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-[#222222]">
                {editTarget ? '매니저 수정' : '매니저 추가'}
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-4">
              <CompoundInput>
                <FloatingInput
                  label="이름"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  borderRadius="12px 12px 0 0"
                />
                <FloatingInput
                  label="전화번호"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  borderRadius="0 0 12px 12px"
                />
              </CompoundInput>
              <CompoundInput>
                <FloatingInput
                  label="메모 (선택)"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  borderRadius="12px"
                />
              </CompoundInput>
              <LoadingButton
                type="button"
                variant="primary"
                loading={saving}
                loadingText="저장 중..."
                disabled={!name || !phone}
                onClick={handleSave}
              >
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
              <DrawerTitle className="text-[18px] font-semibold text-[#222222]">
                매니저를 삭제할까요?
              </DrawerTitle>
            </DrawerHeader>
            <p className="text-[14px] text-[#717171] mb-6">
              {deleteTarget?.name}님을 삭제하면 되돌릴 수 없어요.
            </p>
            <div className="flex flex-col gap-2">
              <LoadingButton
                type="button"
                variant="destructive"
                loading={deleting}
                loadingText="삭제 중..."
                onClick={handleDelete}
              >
                삭제하기
              </LoadingButton>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="h-12 rounded-lg text-[15px] font-semibold text-[#717171] active:bg-[#F7F7F7] transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
