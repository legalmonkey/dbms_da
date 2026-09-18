import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatNumber } from '@/lib/format'

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  label = 'records',
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  label?: string
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline px-3 py-2">
      <p className="text-xs text-fg-muted">
        {total === 0
          ? `No ${label}`
          : `${formatNumber(from)}-${formatNumber(to)} of ${formatNumber(total)} ${label}`}
      </p>
      <div className="flex items-center gap-1">
        <span className="mr-1 text-xs text-fg-muted">
          Page {page} of {pageCount}
        </span>
        <Button
          size="icon-sm"
          variant="secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>
        <Button
          size="icon-sm"
          variant="secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
