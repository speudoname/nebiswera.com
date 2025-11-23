'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const showEllipsisStart = page > 3
    const showEllipsisEnd = page < totalPages - 2

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (showEllipsisStart) pages.push('...')

      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)

      for (let i = start; i <= end; i++) pages.push(i)

      if (showEllipsisEnd) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <nav className="inline-flex items-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="w-10 h-10 rounded-neu bg-neu-base shadow-neu-sm hover:shadow-neu-pressed flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-neu-sm transition-all"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {getPageNumbers().map((pageNum, idx) => (
        pageNum === '...' ? (
          <span
            key={`ellipsis-${idx}`}
            className="w-10 h-10 flex items-center justify-center text-text-muted"
          >
            ...
          </span>
        ) : (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum as number)}
            className={`w-10 h-10 rounded-neu text-sm font-medium transition-all ${
              page === pageNum
                ? 'bg-primary-500 text-white shadow-neu-sm'
                : 'bg-neu-base shadow-neu-sm hover:shadow-neu-pressed text-text-secondary hover:text-text-primary'
            }`}
          >
            {pageNum}
          </button>
        )
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="w-10 h-10 rounded-neu bg-neu-base shadow-neu-sm hover:shadow-neu-pressed flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-neu-sm transition-all"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  )
}
