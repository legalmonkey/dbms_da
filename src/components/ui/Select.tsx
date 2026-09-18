import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value
export const SelectGroup = SelectPrimitive.Group

export const SelectTrigger = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(function SelectTrigger({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex h-8 w-full items-center justify-between gap-2 rounded-[var(--radius-control)]',
        'border border-hairline-strong bg-surface px-2.5 text-13 text-fg',
        'transition-[border-color] duration-150 hover:border-fg-disabled',
        'data-[placeholder]:text-fg-disabled',
        'focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]/30',
        'disabled:bg-surface-3 disabled:text-fg-disabled',
        'aria-[invalid=true]:border-danger',
        className,
      )}
      {...props}
    >
      <span className="truncate text-left">{children}</span>
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})

export const SelectContent = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContent({ className, children, position = 'popper', ...props }, ref) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        sideOffset={4}
        className={cn(
          'relative z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden',
          'rounded-[var(--radius-surface)] border border-hairline bg-surface shadow-[var(--shadow-popover)]',
          'anim-content',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})

export const SelectLabel = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(function SelectLabel({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn('px-2 py-1.5 text-2xs font-semibold uppercase tracking-wide text-fg-muted', className)}
      {...props}
    />
  )
})

export const SelectItem = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center gap-2 rounded-[var(--radius-control)]',
        'py-1.5 pl-2 pr-7 text-13 text-fg outline-none',
        'data-[highlighted]:bg-surface-3 data-[state=checked]:font-medium',
        'data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2 flex items-center">
        <Check className="size-3.5 text-accent" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
})

export const SelectSeparator = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(function SelectSeparator({ className, ...props }, ref) {
  return <SelectPrimitive.Separator ref={ref} className={cn('my-1 h-px bg-hairline', className)} {...props} />
})
