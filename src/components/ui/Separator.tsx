import * as SeparatorPrimitive from '@radix-ui/react-separator'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

export const Separator = forwardRef<
  React.ComponentRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(function Separator({ className, orientation = 'horizontal', decorative = true, ...props }, ref) {
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      orientation={orientation}
      decorative={decorative}
      className={cn('shrink-0 bg-hairline', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)}
      {...props}
    />
  )
})
