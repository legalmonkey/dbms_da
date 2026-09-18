import * as LabelPrimitive from '@radix-ui/react-label'
import { AlertCircle } from 'lucide-react'
import { type ReactElement, type ReactNode, cloneElement, isValidElement, useId } from 'react'
import { cn } from '@/lib/cn'

export interface FieldProps {
  label: ReactNode
  /** Single form control. Receives id, aria-describedby and aria-invalid. */
  children: ReactNode
  hint?: ReactNode
  error?: string
  required?: boolean
  /** Hide the label visually but keep it for assistive technology. */
  srOnlyLabel?: boolean
  className?: string
}

/**
 * Wires a control to its label, hint and error message.
 *
 * The error is announced via role="alert" and linked through aria-describedby,
 * so a screen-reader user hears the problem without hunting for red text.
 */
export function Field({
  label,
  children,
  hint,
  error,
  required,
  srOnlyLabel,
  className,
}: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
        'aria-required': required || undefined,
      })
    : children

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <LabelPrimitive.Root
        htmlFor={id}
        className={cn(
          'flex items-center gap-1 text-13 font-medium text-fg-secondary',
          srOnlyLabel && 'sr-only',
        )}
      >
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </LabelPrimitive.Root>

      {control}

      {hint && !error ? (
        <p id={hintId} className="text-xs text-fg-muted">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="flex items-start gap-1 text-xs text-danger">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  )
}
