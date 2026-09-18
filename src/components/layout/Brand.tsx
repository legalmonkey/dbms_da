import { cn } from '@/lib/cn'

/** Geometric mark: a specimen tube reduced to two strokes and a fill. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('size-5', className)}
      role="img"
      aria-label="Meridian Diagnostics"
      fill="none"
    >
      <path
        d="M8.5 3h7M10 3v12.5a2.5 2.5 0 0 0 5 0V3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="square"
      />
      <path d="M10 11h5v4.5a2.5 2.5 0 0 1-5 0V11Z" fill="currentColor" />
      <circle cx="18.5" cy="6.5" r="1.5" fill="currentColor" opacity="0.45" />
    </svg>
  )
}

export function Brand({ collapsed }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <span className="font-bold text-sm tracking-wider text-accent font-mono">M</span>
    )
  }
  return (
    <div className="flex items-center overflow-hidden">
      <div className="min-w-0 leading-tight">
        <p className="truncate text-13 font-semibold tracking-tight text-fg">Meridian Diagnostics</p>
        <p className="truncate text-2xs text-fg-muted">Laboratory Information System</p>
      </div>
    </div>
  )
}
