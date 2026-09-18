import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

export const RadioGroup = forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(function RadioGroup({ className, ...props }, ref) {
  return <RadioGroupPrimitive.Root ref={ref} className={cn('flex gap-4', className)} {...props} />
})

export const RadioGroupItem = forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(function RadioGroupItem({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'size-4 shrink-0 rounded-full border border-hairline-strong bg-surface',
        'transition-colors duration-150 hover:border-fg-disabled',
        'data-[state=checked]:border-accent data-[state=checked]:border-[5px]',
        'disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
})
