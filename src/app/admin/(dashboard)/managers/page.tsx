'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CameraIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { api } from '@/lib/api-client'
import { useAdminManagers, useInvalidateAdmin } from '@/lib/hooks/use-admin'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTablePagination, AdminTablePagination } from '@/components/admin-table-pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingButton } from '@/components/ui/loading-button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

type ManagerFilter = 'all' | 'active' | 'inactive'

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export default function AdminManagersPage() {
  const { data: managers = [], isLoading } = useAdminManagers()
  const invalidate = useInvalidateAdmin()
  const [filter, setFilter] = useState<ManagerFilter>('all')
  const [page, setPage] = useState(1)
  const [mobileVisibleCount, setMobileVisibleCount] = useState(10)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<(typeof managers)[number] | null>(null)
  const [deleting, setDeleting] = useState(false)
  const activeCount = managers.filter((manager) => manager.isActive).length
  const inactiveCount = managers.length - activeCount
  const filteredManagers = managers.filter((manager) => {
    if (filter === 'active') return manager.isActive
    if (filter === 'inactive') return !manager.isActive
    return true
  })
  const mobileManagers = filteredManagers.slice(0, mobileVisibleCount)
  const { paged, totalPages } = useTablePagination(filteredManagers, page)

  useEffect(() => {
    const target = loadMoreRef.current

    if (!target || mobileVisibleCount >= filteredManagers.length) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        setMobileVisibleCount((current) => Math.min(current + 10, filteredManagers.length))
      },
      { rootMargin: '120px 0px' },
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [filteredManagers.length, mobileVisibleCount])

  async function handleToggle(m: (typeof managers)[number]) {
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
      {!isLoading && <SiteHeader title="매니저 관리" />}
      {isLoading ? (
        <div className="flex min-h-[100dvh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
        </div>
      ) : (
      <div className="flex flex-1 flex-col gap-4 p-6 max-w-[960px] mx-auto w-full max-md:gap-3 max-md:animate-fade-up-fast">
        <Tabs
          value={filter}
          onValueChange={(value) => {
            setFilter(value as ManagerFilter)
            setPage(1)
            setMobileVisibleCount(10)
          }}
          className="w-full"
        >
          <div className="flex items-center gap-2">
            <TabsList className="!h-10 min-w-0 flex-1 justify-start overflow-x-auto rounded-xl bg-surface-subtle p-1">
              <TabsTrigger value="all" className="h-8 shrink-0 rounded-lg px-3 text-[13px] font-medium data-active:bg-background data-active:text-ink">
                전체({managers.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="h-8 shrink-0 rounded-lg px-3 text-[13px] font-medium data-active:bg-background data-active:text-ink">
                활성({activeCount})
              </TabsTrigger>
              <TabsTrigger value="inactive" className="h-8 shrink-0 rounded-lg px-3 text-[13px] font-medium data-active:bg-background data-active:text-ink">
                비활성({inactiveCount})
              </TabsTrigger>
            </TabsList>
            <Link
              href="/admin/managers/new"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-ink px-4 text-[13px] font-medium text-white"
            >
              매니저 추가
            </Link>
          </div>
        </Tabs>

        {filteredManagers.length === 0 ? (
          <p className="py-20 text-center text-[14px] text-ink-muted">등록된 매니저가 없어요</p>
        ) : (
          <>
          <div className="flex flex-col gap-3 md:hidden">
            {mobileManagers.map((m) => (
              <div key={m.id} className="rounded-xl border border-outline-dim px-4 py-4">
                <div className="mb-2 flex items-start gap-4">
                  <Avatar className="size-14 shrink-0">
                    {m.avatarThumbnailSignedUrl && <AvatarImage src={m.avatarThumbnailSignedUrl} alt="" />}
                    <AvatarFallback className="bg-surface-soft text-ink-muted">
                      <CameraIcon size={20} strokeWidth={1.75} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-ink">{m.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${m.isActive ? 'bg-success-soft text-success' : 'bg-surface-soft text-ink-faint'}`}>
                        {m.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                    {m.email && <p className="text-[13px] text-ink-muted">{m.email}</p>}
                    <p className="text-[13px] text-ink-muted">{m.phone}</p>
                    {m.memo && <p className="mt-1 text-[12px] text-ink-faint">{m.memo}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Link href={`/admin/managers/${m.id}/edit`} className="flex-1 rounded-lg border border-outline-dim px-3 py-1.5 text-center text-[12px] font-medium text-ink-muted">수정</Link>
                  <button onClick={() => handleToggle(m)} className="flex-1 rounded-lg border border-outline-dim px-3 py-1.5 text-[12px] font-medium text-ink-muted">{m.isActive ? '비활성화' : '활성화'}</button>
                  <button onClick={() => { setDeleteTarget(m); setDeleteOpen(true) }} className="flex-1 rounded-lg border border-danger-border bg-danger-soft px-3 py-1.5 text-[12px] font-medium text-danger">삭제</button>
                </div>
              </div>
            ))}
            {mobileVisibleCount < filteredManagers.length && (
              <div ref={loadMoreRef} className="flex items-center justify-center py-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
              </div>
            )}
          </div>
          <div className="overflow-hidden rounded-xl border border-outline-dim max-md:hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[72px]">사진</TableHead>
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
                    <TableCell>
                      <Avatar className="size-10">
                        {m.avatarThumbnailSignedUrl && <AvatarImage src={m.avatarThumbnailSignedUrl} alt="" />}
                        <AvatarFallback className="bg-surface-soft text-ink-muted">
                          <CameraIcon size={16} strokeWidth={1.75} />
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
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
                        <Link href={`/admin/managers/${m.id}/edit`} className="rounded-md border border-outline-dim px-2.5 py-1 text-[11px] font-medium text-ink-muted">수정</Link>
                        <button onClick={() => handleToggle(m)} className="rounded-md border border-outline-dim px-2.5 py-1 text-[11px] font-medium text-ink-muted">{m.isActive ? '비활성화' : '활성화'}</button>
                        <button onClick={() => { setDeleteTarget(m); setDeleteOpen(true) }} className="rounded-md border border-outline-dim px-2.5 py-1 text-[11px] font-medium text-ink-faint">삭제</button>
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
