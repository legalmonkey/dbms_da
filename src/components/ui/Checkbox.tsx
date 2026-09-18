import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

export const Checkbox = forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'peer size-4 shrink-0 rounded-[3px] border border-hairline-strong bg-surface',
        'transition-colors duration-150 hover:border-fg-disabled',
        'data-[state=checked]:border-accent data-[state=checked]:bg-accent',
        'data-[state=indeterminate]:border-accent data-[state=indeterminate]:bg-accent',
        'disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-fg-on-accent">
        {props.checked === 'indeterminate' ? (
          <Minus className="size-3" strokeWidth={3} aria-hidden="true" />
        ) : (
          <Check className="size-3" strokeWidth={3} aria-hidden="true" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
