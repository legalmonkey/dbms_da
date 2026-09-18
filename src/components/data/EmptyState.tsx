import { Inbox } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Shown when a query succeeds but returns nothing. Distinct from ErrorState:
 * an empty result is a normal outcome and must not read as a failure.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: ComponentType<{ className?: string }>
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-4 py-10' : 'px-6 py-16',
        className,
      )}
    >
      <div className="flex size-9 items-center justify-center rounded-[var(--radius-surface)] border border-hairline bg-surface-2">
        <Icon className="size-4 text-fg-muted" aria-hidden="true" />
      </div>
      <p className="mt-3 text-13 font-medium text-fg">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-13 text-fg-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
