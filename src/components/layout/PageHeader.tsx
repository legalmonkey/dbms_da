import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

export interface Crumb {
  label: string
  to?: string
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  meta,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  breadcrumbs?: Crumb[]
  /** Badges or counters shown inline beside the title. */
  meta?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {breadcrumbs?.length ? (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-fg-muted">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1
              return (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {crumb.to && !isLast ? (
                    <Link
                      to={crumb.to}
                      className="rounded-[3px] hover:text-fg hover:underline underline-offset-2"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current={isLast ? 'page' : undefined} className={cn(isLast && 'text-fg-secondary')}>
                      {crumb.label}
                    </span>
                  )}
                  {!isLast ? (
                    <ChevronRight className="size-3 text-fg-disabled" aria-hidden="true" />
                  ) : null}
                </li>
              )
            })}
          </ol>
        </nav>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-fg">{title}</h1>
            {meta}
          </div>
          {description ? (
            <p className="mt-1 max-w-2xl text-13 text-fg-muted">{description}</p>
          ) : null}
        </div>

        {actions ? (
          <div data-print="hide" className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  )
}
