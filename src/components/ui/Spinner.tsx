import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <>
      <Loader2 className={cn('size-4 animate-spin text-fg-muted', className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </>
  )
}
