import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { type ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/cn'

export const TooltipProvider = TooltipPrimitive.Provider
export const TooltipRoot = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export const TooltipContent = forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(function TooltipContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'anim-content z-50 max-w-64 rounded-[var(--radius-control)] border border-hairline',
          'bg-surface px-2 py-1 text-xs text-fg-secondary shadow-[var(--shadow-popover)]',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
})

/** Convenience wrapper for the common single-trigger case. */
export function Tooltip({
  content,
  children,
  side = 'top',
}: {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  if (!content) return <>{children}</>
  return (
    <TooltipRoot>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </TooltipRoot>
  )
}
