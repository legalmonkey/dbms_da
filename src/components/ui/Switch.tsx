import * as SwitchPrimitive from '@radix-ui/react-switch'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

export const Switch = forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        'relative inline-flex h-4 w-7 shrink-0 items-center rounded-[var(--radius-control)] border border-transparent',
        'bg-hairline-strong transition-colors duration-150',
        'data-[state=checked]:bg-accent disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block size-3 rounded-[2px] bg-surface shadow-sm',
          'translate-x-0.5 transition-transform duration-150 ease-[var(--ease-out-quick)]',
          'data-[state=checked]:translate-x-3.5',
        )}
      />
    </SwitchPrimitive.Root>
  )
})
