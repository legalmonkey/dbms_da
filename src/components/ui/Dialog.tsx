import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export const DialogContent = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { width?: 'sm' | 'md' | 'lg' }
>(function DialogContent({ className, children, width = 'md', ...props }, ref) {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' }
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="anim-overlay fixed inset-0 z-50 bg-[#101828]/40 dark:bg-[#03070d]/70" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'anim-content fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2',
          'flex max-h-[calc(100vh-4rem)] flex-col overflow-hidden',
          'rounded-[var(--radius-surface)] border border-hairline bg-surface shadow-[var(--shadow-overlay)]',
          widths[width],
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className={cn(
            'absolute right-3 top-3 flex size-7 items-center justify-center',
            'rounded-[var(--radius-control)] text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg',
          )}
        >
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-hairline px-4 py-3 pr-12', className)} {...props} />
}

export const DialogTitle = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return <DialogPrimitive.Title ref={ref} className={cn('text-sm font-semibold text-fg', className)} {...props} />
})

export const DialogDescription = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description ref={ref} className={cn('mt-1 text-13 text-fg-muted', className)} {...props} />
  )
})

export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex-1 overflow-y-auto px-4 py-4', className)} {...props} />
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 border-t border-hairline bg-surface-2 px-4 py-3 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}
