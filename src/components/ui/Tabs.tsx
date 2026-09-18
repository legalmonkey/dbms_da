import * as TabsPrimitive from '@radix-ui/react-tabs'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

export const Tabs = TabsPrimitive.Root

export const TabsList = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn('flex items-center gap-1 border-b border-hairline', className)}
      {...props}
    />
  )
})

export const TabsTrigger = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'relative -mb-px inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2',
        'border-b-2 border-transparent text-13 font-medium text-fg-muted',
        'transition-colors duration-150 hover:text-fg',
        'data-[state=active]:border-accent data-[state=active]:text-fg',
        'disabled:pointer-events-none disabled:text-fg-disabled',
        className,
      )}
      {...props}
    />
  )
})

export const TabsContent = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return <TabsPrimitive.Content ref={ref} className={cn('pt-4 focus:outline-none', className)} {...props} />
})
