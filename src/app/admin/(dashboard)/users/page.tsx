'use client'

import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { useAdminUsers } from '@/lib/hooks/use-admin'
import { useIsMobile } from '@/hooks/use-mobile'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTablePagination, AdminTablePagination } from '@/components/admin-table-pagination'

const ROLE_LABELS: Record<string, string> = {
  user: '일반',
  admin: '관리자',
  manager: '매니저',
}

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useAdminUsers()
  const isMobile = useIsMobile()
  const [page, setPage] = useState(1)
  const { paged, totalPages } = useTablePagination(users, page)

  return (
    <>
      <SiteHeader title="회원 관리" />
      <div className="flex flex-1 flex-col gap-4 p-6 max-w-[960px] mx-auto w-full max-md:gap-3">
        <div className="flex items-center h-9">
          <p className="text-[14px] text-ink-muted">총 {users.length}명</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
          </div>
        ) : users.length === 0 ? (
          <p className="py-20 text-center text-[14px] text-ink-muted">회원이 없어요</p>
        ) : isMobile ? (
          /* ─── Mobile: Cards ─── */
          <div className="flex flex-col gap-3">
            {users.map((u) => (
              <div key={u.id} className="rounded-xl border border-outline-dim px-4 py-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[15px] font-semibold text-ink">{u.fullName || '이름 없음'}</span>
                  <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[11px] font-medium text-ink-muted">{ROLE_LABELS[u.role] || u.role}</span>
                </div>
                <p className="text-[13px] text-ink-muted">{u.email || '-'}</p>
                {u.phone && <p className="text-[13px] text-ink-muted">{u.phone}</p>}
                <p className="mt-1 text-[12px] text-ink-faint">
                  가입일: {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                  {!u.onboardingCompleted && ' · 온보딩 미완료'}
                </p>
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
                  <TableHead>역할</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.fullName || '이름 없음'}</TableCell>
                    <TableCell className="text-ink-muted">{u.email || '-'}</TableCell>
                    <TableCell className="text-ink-muted">{u.phone || '-'}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[11px] font-medium text-ink-muted">{ROLE_LABELS[u.role] || u.role}</span>
                    </TableCell>
                    <TableCell className="text-ink-muted">{new Date(u.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                    <TableCell>
                      {u.onboardingCompleted
                        ? <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">완료</span>
                        : <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning">미완료</span>
                      }
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
    </>
  )
}
