import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/**
 * Loading skeleton. Marked aria-hidden: the live region announcing "Loading"
 * lives on the container, so screen readers hear one message, not fifty bars.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-[var(--radius-control)] bg-surface-3', className)}
      {...props}
    />
  )
}

/** Table body skeleton matching the real row height. */
export function SkeletonRows({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-hairline">
          {Array.from({ length: columns }, (_, colIndex) => (
            <td key={colIndex} className="row-h px-3">
              <Skeleton
                className="h-3"
                style={{ width: `${[70, 45, 60, 35, 50, 40][colIndex % 6]}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
