import { AlertTriangle, ArrowUp, Minus } from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from '@/lib/cn'
import { PulseDot } from '@/components/domain/PulseDot'
import { REMARK_DESCRIPTIONS, type Remark } from '@/types'

/**
 * Renders a HasResult.Remark.
 *
 * Every state carries a glyph AND a word AND a colour. Colour alone never
 * conveys the finding: a red cell means nothing to a colour-blind reader or
 * on a monochrome printout of the report.
 */

interface RemarkVisual {
  icon: ComponentType<{ className?: string }>
  className: string
  iconClassName: string
}

const VISUALS: Record<Remark, RemarkVisual> = {
  Normal: {
    icon: Minus,
    className: 'text-fg-secondary',
    iconClassName: 'text-fg-disabled',
  },
  Elevated: {
    icon: ArrowUp,
    className: 'text-[var(--flag-high)] font-medium',
    iconClassName: 'text-[var(--flag-high)]',
  },
  Critical: {
    icon: AlertTriangle,
    className: 'text-[var(--flag-critical)] font-semibold',
    iconClassName: 'text-[var(--flag-critical)]',
  },
}

export function RemarkIndicator({ remark, className }: { remark: Remark; className?: string }) {
  const visual = VISUALS[remark]
  const Icon = visual.icon
  return (
    <span
      className={cn('inline-flex items-center gap-1 whitespace-nowrap text-13', visual.className, className)}
      title={REMARK_DESCRIPTIONS[remark]}
    >
      <Icon className={cn('size-3.5 shrink-0', visual.iconClassName)} aria-hidden="true" />
      {remark === 'Critical' ? <PulseDot live /> : null}
      {remark}
    </span>
  )
}

/** Compact form for dense result tables: the word still ships to the reader. */
export function RemarkCell({ remark }: { remark: Remark }) {
  return (
    <span className="inline-flex items-center gap-1">
      <RemarkIndicator remark={remark} />
      <span className="sr-only">{REMARK_DESCRIPTIONS[remark]}</span>
    </span>
  )
}
