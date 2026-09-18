import { cn } from '@/lib/cn'

/**
 * Status indicator dot. Inherits currentColor from its badge.
 *
 * `live` adds the expanding ring. It is reserved for states that are actually
 * in motion or need attention - a table of forty completed rows all pulsing at
 * once reads as an alarm, not as information.
 */
export function PulseDot({ live, className }: { live?: boolean; className?: string }) {
  if (!live) {
    return (
      <span
        aria-hidden="true"
        className={cn('inline-flex size-2 flex-none rounded-full bg-current', className)}
      />
    )
  }

  return (
    <span aria-hidden="true" className={cn('pulse-dot', className)}>
      <span />
      <span />
    </span>
  )
}
