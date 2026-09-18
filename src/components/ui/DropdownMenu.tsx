import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check } from 'lucide-react'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuGroup = DropdownMenuPrimitive.Group
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

export const DropdownMenuContent = forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(function DropdownMenuContent({ className, sideOffset = 4, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'anim-content z-50 min-w-44 overflow-hidden rounded-[var(--radius-surface)]',
          'border border-hairline bg-surface p-1 shadow-[var(--shadow-popover)]',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
})

const itemClasses =
  'relative flex cursor-default select-none items-center gap-2 rounded-[var(--radius-control)] ' +
  'px-2 py-1.5 text-13 text-fg outline-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-muted ' +
  'data-[highlighted]:bg-surface-3 data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled'

export const DropdownMenuItem = forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { destructive?: boolean }
>(function DropdownMenuItem({ className, destructive, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(itemClasses, destructive && 'text-danger [&_svg]:text-danger', className)}
      {...props}
    />
  )
})

export const DropdownMenuRadioItem = forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(function DropdownMenuRadioItem({ className, children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.RadioItem ref={ref} className={cn(itemClasses, 'pr-7', className)} {...props}>
      {children}
      <DropdownMenuPrimitive.ItemIndicator className="absolute right-2">
        <Check className="size-3.5 !text-accent" aria-hidden="true" />
      </DropdownMenuPrimitive.ItemIndicator>
    </DropdownMenuPrimitive.RadioItem>
  )
})

export const DropdownMenuLabel = forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(function DropdownMenuLabel({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn('px-2 py-1.5 text-2xs font-semibold uppercase tracking-wide text-fg-muted', className)}
      {...props}
    />
  )
})

export const DropdownMenuSeparator = forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return <DropdownMenuPrimitive.Separator ref={ref} className={cn('my-1 h-px bg-hairline', className)} {...props} />
})
