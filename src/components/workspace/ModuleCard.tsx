import { ArrowRight } from 'lucide-react'
import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import SpotlightCard from '@/components/reactbits/SpotlightCard'

/**
 * A module entry point. The whole card is one link, focus ring drawn inset so
 * the card's clipped overflow cannot hide it.
 */
export function ModuleCard({
  to,
  title,
  description,
  icon: Icon,
  stat,
}: {
  to: string
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  stat?: string
}) {
  return (
    <SpotlightCard className="h-full">
      <Link
        to={to}
        className="group flex h-full flex-col p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-[var(--radius-control)] border border-hairline bg-surface-2">
            <Icon className="size-4 text-accent" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold text-fg">{title}</span>
        </div>
        <p className="mt-2.5 flex-1 text-13 leading-relaxed text-fg-muted">{description}</p>
        <div className="mt-3 flex items-center justify-between gap-2 text-13">
          {stat ? <span className="tabular-nums text-fg-secondary">{stat}</span> : <span />}
          <span className="inline-flex items-center gap-1 font-medium text-accent">
            Open
            <ArrowRight
              className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </Link>
    </SpotlightCard>
  )
}
