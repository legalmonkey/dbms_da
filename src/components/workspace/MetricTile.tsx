import type { ComponentType, ReactNode } from 'react'
import CountUp from '@/components/reactbits/CountUp'
import SpotlightCard from '@/components/reactbits/SpotlightCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

const ICON_TONE: Record<Tone, string> = {
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-fg-muted',
}

/**
 * One operational figure. The label always states what the number means, so
 * the tone colour on the icon is reinforcement, never the message itself.
 */
export function MetricTile({
  label,
  value,
  prefix,
  hint,
  icon: Icon,
  tone = 'neutral',
  loading,
}: {
  label: string
  value: number | undefined
  prefix?: string
  hint?: ReactNode
  icon: ComponentType<{ className?: string }>
  tone?: Tone
  loading?: boolean
}) {
  return (
    <SpotlightCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-13 text-fg-muted">{label}</p>
        <Icon className={cn('size-4 shrink-0', ICON_TONE[tone])} aria-hidden="true" />
      </div>
      {loading || value === undefined ? (
        <Skeleton className="mt-3 h-7 w-20" />
      ) : (
        <p className="mt-2 text-xl font-semibold tabular-nums text-fg">
          <CountUp to={value} prefix={prefix} duration={0.9} />
        </p>
      )}
      {hint ? <p className="mt-1.5 text-xs text-fg-muted">{hint}</p> : null}
    </SpotlightCard>
  )
}
