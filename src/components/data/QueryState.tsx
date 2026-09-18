import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ErrorState } from './ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

/**
 * One place that renders the four states every data view has: loading, error,
 * empty and loaded. Without this each screen reimplements the same triple and
 * they drift apart.
 */
export function QueryState<T>({
  query,
  isEmpty,
  empty,
  children,
  skeleton,
}: {
  query: UseQueryResult<T>
  isEmpty?: (data: T) => boolean
  empty?: ReactNode
  children: (data: T) => ReactNode
  skeleton?: ReactNode
}) {
  if (query.isPending) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading</span>
        {skeleton ?? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-8" />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} compact />
  }

  if (isEmpty?.(query.data) && empty) return <>{empty}</>

  return <>{children(query.data)}</>
}
