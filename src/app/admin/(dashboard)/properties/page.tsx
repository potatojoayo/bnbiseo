'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { useAdminProperties } from '@/lib/hooks/use-admin'
import { MapPinIcon } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTablePagination, AdminTablePagination } from '@/components/admin-table-pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const STATUS_STYLES = {
  pending_activation: 'border border-outline-dim bg-surface-subtle text-ink-muted',
  active: 'bg-success-soft text-success',
} as const

const STATUS_LABELS = {
  pending_activation: '등록 대기',
  active: '등록 완료',
} as const

type PropertyFilter = 'all' | 'pending_activation' | 'active'

export default function AdminPropertiesPage() {
  const { data: properties = [], isLoading } = useAdminProperties()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<PropertyFilter>('all')
  const [mobileVisibleCount, setMobileVisibleCount] = useState(10)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const pendingCount = properties.filter((property) => property.status === 'pending_activation').length
  const activeCount = properties.filter((property) => property.status === 'active').length
  const filteredProperties = properties.filter((property) =>
    filter === 'all' ? true : property.status === filter,
  )
  const mobileProperties = filteredProperties.slice(0, mobileVisibleCount)
  const { paged, totalPages } = useTablePagination(filteredProperties, page)

  useEffect(() => {
    const target = loadMoreRef.current

    if (!target || mobileVisibleCount >= filteredProperties.length) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        setMobileVisibleCount((current) => Math.min(current + 10, filteredProperties.length))
      },
      { rootMargin: '120px 0px' },
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [filteredProperties.length, mobileVisibleCount])

  return (
    <>
      {!isLoading && <SiteHeader title="숙소 관리" />}
      {isLoading ? (
        <div className="flex min-h-[100dvh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
        </div>
      ) : (
      <div className="flex flex-1 flex-col gap-4 p-6 max-w-[960px] mx-auto w-full max-md:gap-3 max-md:animate-fade-up-fast">
        <div className="flex flex-col gap-3">
          <Tabs
            value={filter}
            onValueChange={(value) => {
              setFilter(value as PropertyFilter)
              setPage(1)
              setMobileVisibleCount(10)
            }}
            className="w-full"
          >
            <TabsList className="!h-10 w-full justify-start overflow-x-auto rounded-xl bg-surface-subtle p-1">
              <TabsTrigger
                value="all"
                className="h-8 shrink-0 rounded-lg px-3 text-[13px] font-medium data-active:bg-background data-active:text-ink"
              >
                전체({properties.length})
              </TabsTrigger>
              <TabsTrigger
                value="pending_activation"
                className="h-8 shrink-0 rounded-lg px-3 text-[13px] font-medium data-active:bg-background data-active:text-ink"
              >
                등록 대기({pendingCount})
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="h-8 shrink-0 rounded-lg px-3 text-[13px] font-medium data-active:bg-background data-active:text-ink"
              >
                등록 완료({activeCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filteredProperties.length === 0 ? (
          <p className="text-center text-[14px] text-ink-muted py-20">등록된 숙소가 없어요</p>
        ) : (
          <>
          <div className="flex flex-col gap-3 md:hidden">
            {mobileProperties.map((p) => {
              const details = p.status === 'active'
                ? [
                    p.pyeong && `${p.pyeong}평`,
                    p.livingRooms != null && `거실 ${p.livingRooms}`,
                    p.bedrooms != null && `침실 ${p.bedrooms}`,
                    p.bathrooms != null && `욕실 ${p.bathrooms}`,
                  ].filter(Boolean)
                : []
              const card = (
                <div className="rounded-xl border border-outline-dim px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[16px] font-semibold leading-snug text-ink">
                        {p.name}
                      </p>
                      {details.length > 0 && (
                        <p className="mt-1 text-[13px] text-ink-muted">
                          {details.join(' · ')}
                        </p>
                      )}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </div>

                  <div className="mt-3 h-px w-full bg-outline-dim" />

                  <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
                    <MapPinIcon className="mr-1 inline-block size-3.5 align-[-2px] text-ink-faint" strokeWidth={1.75} />
                    {p.address}
                  </p>

                  <p className="mt-3 text-[12px] text-ink-muted">
                    호스트: {p.hostName || p.hostEmail || '-'}
                  </p>
                </div>
              )

              return (
                <Link
                  key={p.id}
                  href={`/admin/properties/${p.id}`}
                  className="block transition-transform active:scale-[0.99]"
                >
                  {card}
                </Link>
              )
            })}
            {mobileVisibleCount < filteredProperties.length && (
              <div ref={loadMoreRef} className="flex items-center justify-center py-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
              </div>
            )}
          </div>
          <div className="rounded-xl border border-outline-dim overflow-hidden max-md:hidden">
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
                    <TableCell className="text-ink-muted">{p.address}</TableCell>
                    <TableCell>{p.status === 'active' && p.pyeong ? `${p.pyeong}평` : '-'}</TableCell>
                    <TableCell>
                      {p.status === 'active'
                        ? [p.livingRooms != null && `거실 ${p.livingRooms}`, p.bedrooms != null && `침실 ${p.bedrooms}`, p.bathrooms != null && `욕실 ${p.bathrooms}`].filter(Boolean).join(' · ') || '-'
                        : '-'}
                    </TableCell>
                    <TableCell>{p.hostName || p.hostEmail || '-'}</TableCell>
                    <TableCell className="text-right">
                      {p.status === 'pending_activation' ? (
                        <Link
                          href={`/admin/properties/${p.id}`}
                          className="inline-flex h-8 items-center justify-center rounded-lg bg-ink px-3 text-[12px] font-semibold text-white transition-all active:scale-[0.98]"
                        >
                          등록 진행
                        </Link>
                      ) : (
                        <Link
                          href={`/admin/properties/${p.id}`}
                          className="text-[12px] text-ink-muted underline underline-offset-2"
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
          <div className="max-md:hidden">
            <AdminTablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
          </>
        )}
      </div>
      )}
    </>
  )
}
