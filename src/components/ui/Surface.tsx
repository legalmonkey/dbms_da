import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * A bordered panel. Structure is carried by a 1px hairline, never a shadow:
 * floating cards are the visual tell this design deliberately avoids.
 */
export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-[var(--radius-surface)] border border-hairline bg-surface', className)}
      {...props}
    />
  )
}

export function SurfaceHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 border-b border-hairline px-4 py-3',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="truncate text-13 font-semibold text-fg">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-fg-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}
