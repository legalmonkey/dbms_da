import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/cn'

export const inputBase =
  'w-full rounded-[var(--radius-control)] border border-hairline-strong bg-surface ' +
  'text-13 text-fg placeholder:text-fg-disabled ' +
  'transition-[border-color,background-color] duration-150 ' +
  'hover:border-fg-disabled ' +
  'focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]/30 ' +
  'disabled:bg-surface-3 disabled:text-fg-disabled disabled:hover:border-hairline-strong ' +
  'aria-[invalid=true]:border-danger aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-[var(--danger)]/20'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Rendered inside the field on the leading edge: a search or currency glyph. */
  leading?: ReactNode
  trailing?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leading, trailing, ...props },
  ref,
) {
  if (!leading && !trailing) {
    return <input ref={ref} className={cn(inputBase, 'h-8 px-2.5', className)} {...props} />
  }
  return (
    <div className="relative flex items-center">
      {leading ? (
        <span
          className="pointer-events-none absolute left-2.5 flex text-fg-muted [&_svg]:size-4"
          aria-hidden="true"
        >
          {leading}
        </span>
      ) : null}
      <input
        ref={ref}
        className={cn(inputBase, 'h-8', leading ? 'pl-8' : 'pl-2.5', trailing ? 'pr-8' : 'pr-2.5', className)}
        {...props}
      />
      {trailing ? (
        <span className="absolute right-2.5 flex text-fg-muted [&_svg]:size-4">{trailing}</span>
      ) : null}
    </div>
  )
})
