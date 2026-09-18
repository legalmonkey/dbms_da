import type { ReactNode } from 'react'
import CountUp from '@/components/reactbits/CountUp'
import { formatPercent } from '@/lib/format'

/**
 * A labelled count with a flat proportion bar. Each row states its label and
 * its share in text, so the bar is a visual aid rather than the only carrier
 * of the value.
 */
export function Breakdown({
  rows,
  total,
}: {
  rows: Array<{ key: string; label: ReactNode; value: number; barClassName: string }>
  total: number
}) {
  return (
    <ul className="divide-y divide-hairline">
      {rows.map((row) => {
        const share = total > 0 ? (row.value / total) * 100 : 0
        return (
          <li key={row.key} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span>{row.label}</span>
              <span className="flex items-baseline gap-2 tabular-nums">
                <span className="text-sm font-semibold text-fg">
                  <CountUp to={row.value} duration={0.8} />
                </span>
                <span className="w-12 text-right text-xs text-fg-muted">{formatPercent(share, 0)}</span>
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-[2px] bg-surface-3" aria-hidden="true">
              <div className={`h-full rounded-[2px] ${row.barClassName}`} style={{ width: `${share}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
