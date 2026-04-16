'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { useAdminProperties } from '@/lib/hooks/use-admin'
import { useIsMobile } from '@/hooks/use-mobile'
import { MapPinIcon } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTablePagination, AdminTablePagination } from '@/components/admin-table-pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const STATUS_STYLES = {
  pending_activation: 'border border-[#EBEBEB] bg-[#FAFAFA] text-[#717171]',
  active: 'bg-[#E8F5E9] text-[#2E7D32]',
} as const

const STATUS_LABELS = {
  pending_activation: '등록 대기',
  active: '등록 완료',
} as const

type PropertyFilter = 'all' | 'pending_activation' | 'active'

export default function AdminPropertiesPage() {
  const { data: properties = [], isLoading } = useAdminProperties()
  const isMobile = useIsMobile()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<PropertyFilter>('all')
  const pendingCount = properties.filter((property) => property.status === 'pending_activation').length
  const activeCount = properties.filter((property) => property.status === 'active').length
  const filteredProperties = properties.filter((property) =>
    filter === 'all' ? true : property.status === filter,
  )
  const { paged, totalPages } = useTablePagination(filteredProperties, page)

  return (
    <>
      <SiteHeader title="숙소 관리" />
      <div className="flex flex-1 flex-col gap-4 p-6 max-w-[960px] mx-auto w-full max-md:gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center h-9">
            <p className="text-[14px] text-[#717171]">총 {filteredProperties.length}개</p>
          </div>
          <Tabs
            value={filter}
            onValueChange={(value) => {
              setFilter(value as PropertyFilter)
              setPage(1)
            }}
            className="w-full"
          >
            <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl bg-[#F7F7F7] p-1">
              <TabsTrigger value="all" className="shrink-0 rounded-lg px-3 py-2 text-[13px] font-medium">
                전체({properties.length})
              </TabsTrigger>
              <TabsTrigger value="pending_activation" className="shrink-0 rounded-lg px-3 py-2 text-[13px] font-medium">
                등록 대기({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="active" className="shrink-0 rounded-lg px-3 py-2 text-[13px] font-medium">
                등록 완료({activeCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-[#EBEBEB] border-t-[#717171] animate-spin" />
          </div>
        ) : filteredProperties.length === 0 ? (
          <p className="text-center text-[14px] text-[#717171] py-20">등록된 숙소가 없어요</p>
        ) : isMobile ? (
          /* ─── Mobile: Cards ─── */
          <div className="flex flex-col gap-3">
            {filteredProperties.map((p) => {
              const details = p.status === 'active'
                ? [
                    p.pyeong && `${p.pyeong}평`,
                    p.bedrooms != null && `방 ${p.bedrooms}`,
                    p.bathrooms != null && `욕실 ${p.bathrooms}`,
                  ].filter(Boolean)
                : []
              const card = (
                <div className="rounded-xl border border-[#EBEBEB] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[16px] font-semibold leading-snug text-[#222222]">
                        {p.name}
                      </p>
                      {details.length > 0 && (
                        <p className="mt-1 text-[13px] text-[#717171]">
                          {details.join(' · ')}
                        </p>
                      )}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </div>

                  <div className="mt-3 h-px w-full bg-[#F1F1F1]" />

                  <p className="mt-3 text-[13px] leading-relaxed text-[#717171]">
                    <MapPinIcon className="mr-1 inline-block size-3.5 align-[-2px] text-[#B0B0B0]" strokeWidth={1.75} />
                    {p.address}
                  </p>

                  <p className="mt-3 text-[12px] text-[#717171]">
                    호스트: {p.hostName || p.hostEmail || '-'}
                  </p>

                  {p.status === 'pending_activation' && (
                    <Link
                      href={`/admin/properties/${p.id}`}
                      className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg bg-[#222222] px-3 text-[14px] font-semibold text-white transition-all active:scale-[0.98]"
                    >
                      등록 진행
                    </Link>
                  )}
                </div>
              )

              return p.status === 'active' ? (
                <Link
                  key={p.id}
                  href={`/admin/properties/${p.id}`}
                  className="block transition-transform active:scale-[0.99]"
                >
                  {card}
                </Link>
              ) : (
                <div key={p.id}>{card}</div>
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
                  <TableHead>상태</TableHead>
                  <TableHead>주소</TableHead>
                  <TableHead>면적</TableHead>
                  <TableHead>방/욕실</TableHead>
                  <TableHead>호스트</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.status === 'active' ? (
                        <Link href={`/admin/properties/${p.id}`} className="hover:underline underline-offset-2">
                          {p.name}
                        </Link>
                      ) : (
                        p.name
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[p.status]}`}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-[#717171]">{p.address}</TableCell>
                    <TableCell>{p.status === 'active' && p.pyeong ? `${p.pyeong}평` : '-'}</TableCell>
                    <TableCell>
                      {p.status === 'active'
                        ? [p.bedrooms != null && `방 ${p.bedrooms}`, p.bathrooms != null && `욕실 ${p.bathrooms}`].filter(Boolean).join(' · ') || '-'
                        : '-'}
                    </TableCell>
                    <TableCell>{p.hostName || p.hostEmail || '-'}</TableCell>
                    <TableCell className="text-right">
                      {p.status === 'pending_activation' ? (
                        <Link
                          href={`/admin/properties/${p.id}`}
                          className="inline-flex h-8 items-center justify-center rounded-lg bg-[#222222] px-3 text-[12px] font-semibold text-white transition-all active:scale-[0.98]"
                        >
                          등록 진행
                        </Link>
                      ) : (
                        <Link
                          href={`/admin/properties/${p.id}`}
                          className="text-[12px] text-[#717171] underline underline-offset-2"
                        >
                          상세보기
                        </Link>
                      )}
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
