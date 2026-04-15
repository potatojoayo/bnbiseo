'use client'

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

const PAGE_SIZE = 20

export function useTablePagination<T>(data: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE))
  const paged = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  return { paged, totalPages, pageSize: PAGE_SIZE }
}

export function AdminTablePagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-[12px] text-[#B0B0B0]">
        {page} / {totalPages} 페이지
      </p>
      <Pagination className="w-auto mx-0">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              text="이전"
              onClick={(e) => { e.preventDefault(); if (page > 1) onPageChange(page - 1) }}
              className={page <= 1 ? 'pointer-events-none opacity-40' : ''}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === page}
                onClick={(e) => { e.preventDefault(); onPageChange(p) }}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href="#"
              text="다음"
              onClick={(e) => { e.preventDefault(); if (page < totalPages) onPageChange(page + 1) }}
              className={page >= totalPages ? 'pointer-events-none opacity-40' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
