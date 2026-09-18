import { Slot } from '@radix-ui/react-slot'
import { Loader2 } from 'lucide-react'
import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
type Size = 'sm' | 'md' | 'lg' | 'icon-sm' | 'icon'

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-control)] ' +
  'font-medium whitespace-nowrap select-none ' +
  'transition-[background-color,border-color,color] duration-150 ease-[var(--ease-out-quick)] ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  '[&_svg]:shrink-0 [&_svg]:size-4'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-fg-on-accent hover:bg-accent-hover active:bg-accent-active',
  secondary:
    'bg-surface text-fg border border-hairline-strong hover:bg-surface-3 active:bg-surface-3',
  ghost: 'text-fg-secondary hover:bg-surface-3 hover:text-fg',
  danger: 'bg-danger text-fg-on-accent hover:bg-danger-hover dark:text-canvas',
  subtle: 'bg-accent-subtle text-accent border border-accent-border hover:bg-surface-3',
}

const sizes: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-13',
  md: 'h-8 px-3 text-13',
  lg: 'h-10 px-4 text-sm',
  'icon-sm': 'size-7',
  icon: 'size-8',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  /** Render as the child element (e.g. a router Link) while keeping the styling. */
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'md', loading, asChild, children, disabled, ...props },
  ref,
) {
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          {children}
        </>
      ) : (
        children
      )}
    </Component>
  )
})
