import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-[3px] border border-hairline-strong',
        'bg-surface-2 px-1 font-sans text-2xs font-medium text-fg-muted',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
