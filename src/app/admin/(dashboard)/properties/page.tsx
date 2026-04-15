'use client'

import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { useAdminProperties } from '@/lib/hooks/use-admin'
import { useIsMobile } from '@/hooks/use-mobile'
import { MapPinIcon } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTablePagination, AdminTablePagination } from '@/components/admin-table-pagination'

export default function AdminPropertiesPage() {
  const { data: properties = [], isLoading } = useAdminProperties()
  const isMobile = useIsMobile()
  const [page, setPage] = useState(1)
  const { paged, totalPages } = useTablePagination(properties, page)

  return (
    <>
      <SiteHeader title="숙소 관리" />
      <div className="flex flex-1 flex-col gap-4 p-6 max-w-[960px] mx-auto w-full max-md:gap-3">
        <div className="flex items-center h-9">
          <p className="text-[14px] text-[#717171]">총 {properties.length}개</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-[#EBEBEB] border-t-[#717171] animate-spin" />
          </div>
        ) : properties.length === 0 ? (
          <p className="text-center text-[14px] text-[#717171] py-20">등록된 숙소가 없어요</p>
        ) : isMobile ? (
          /* ─── Mobile: Cards ─── */
          <div className="flex flex-col gap-3">
            {properties.map((p) => {
              const details = [p.pyeong && `${p.pyeong}평`, `방 ${p.bedrooms}`, `욕실 ${p.bathrooms}`].filter(Boolean)
              return (
                <div key={p.id} className="rounded-xl border border-[#EBEBEB] px-4 py-4">
                  <p className="text-[15px] font-semibold text-[#222222]">{p.name}</p>
                  {details.length > 0 && <p className="text-[13px] text-[#717171] mt-0.5">{details.join(' · ')}</p>}
                  <p className="text-[12px] text-[#B0B0B0] mt-0.5 flex items-center gap-0.5">
                    <MapPinIcon size={11} strokeWidth={1.75} />{p.address}
                  </p>
                  <p className="text-[12px] text-[#717171] mt-2">호스트: {p.hostName || p.hostEmail || '-'}</p>
                </div>
              )
            })}
          </div>
        ) : (
          /* ─── Desktop: Table ─── */
          <>
          <div className="rounded-xl border border-[#EBEBEB] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>숙소명</TableHead>
                  <TableHead>주소</TableHead>
                  <TableHead>면적</TableHead>
                  <TableHead>방/욕실</TableHead>
                  <TableHead>호스트</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="text-[#717171]">{p.address}</TableCell>
                    <TableCell>{p.pyeong ? `${p.pyeong}평` : '-'}</TableCell>
                    <TableCell>방 {p.bedrooms} · 욕실 {p.bathrooms}</TableCell>
                    <TableCell>{p.hostName || p.hostEmail || '-'}</TableCell>
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
