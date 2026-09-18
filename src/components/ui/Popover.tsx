import * as PopoverPrimitive from '@radix-ui/react-popover'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverAnchor = PopoverPrimitive.Anchor
export const PopoverClose = PopoverPrimitive.Close

export const PopoverContent = forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(function PopoverContent({ className, align = 'start', sideOffset = 4, ...props }, ref) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'anim-content z-50 w-64 rounded-[var(--radius-surface)] border border-hairline',
          'bg-surface p-3 shadow-[var(--shadow-popover)]',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
})
