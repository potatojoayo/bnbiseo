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
          <p className="text-[14px] text-[#717171]">총 {users.length}명</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-[#EBEBEB] border-t-[#717171] animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-[14px] text-[#717171] py-20">회원이 없어요</p>
        ) : isMobile ? (
          /* ─── Mobile: Cards ─── */
          <div className="flex flex-col gap-3">
            {users.map((u) => (
              <div key={u.id} className="rounded-xl border border-[#EBEBEB] px-4 py-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[15px] font-semibold text-[#222222]">{u.fullName || '이름 없음'}</span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F7F7F7] text-[#717171]">{ROLE_LABELS[u.role] || u.role}</span>
                </div>
                <p className="text-[13px] text-[#717171]">{u.email || '-'}</p>
                {u.phone && <p className="text-[13px] text-[#717171]">{u.phone}</p>}
                <p className="text-[12px] text-[#B0B0B0] mt-1">
                  가입일: {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                  {!u.onboardingCompleted && ' · 온보딩 미완료'}
                </p>
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
                    <TableCell className="text-[#717171]">{u.email || '-'}</TableCell>
                    <TableCell className="text-[#717171]">{u.phone || '-'}</TableCell>
                    <TableCell>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F7F7F7] text-[#717171]">{ROLE_LABELS[u.role] || u.role}</span>
                    </TableCell>
                    <TableCell className="text-[#717171]">{new Date(u.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                    <TableCell>
                      {u.onboardingCompleted
                        ? <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32]">완료</span>
                        : <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FFF8E1] text-[#F57F17]">미완료</span>
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
