import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { isApiError } from '@/types'

/** Shown when a query rejects. Always offers a way forward, never a dead end. */
export function ErrorState({
  error,
  onRetry,
  className,
  compact,
}: {
  error: unknown
  onRetry?: () => void
  className?: string
  compact?: boolean
}) {
  const message = isApiError(error)
    ? error.message
    : error instanceof Error
      ? error.message
      : 'Something went wrong while loading this data.'
  const code = isApiError(error) ? error.code : null

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-4 py-10' : 'px-6 py-16',
        className,
      )}
    >
      <div className="flex size-9 items-center justify-center rounded-[var(--radius-surface)] border border-danger-border bg-danger-bg">
        <AlertTriangle className="size-4 text-danger" aria-hidden="true" />
      </div>
      <p className="mt-3 text-13 font-medium text-fg">Could not load this view</p>
      <p className="mt-1 max-w-sm text-13 text-fg-muted">{message}</p>
      {code ? (
        <p className="mt-1 font-mono text-2xs text-fg-disabled">{code}</p>
      ) : null}
      {onRetry ? (
        <Button variant="secondary" size="md" className="mt-4" onClick={onRetry}>
          <RotateCw aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </div>
  )
}
