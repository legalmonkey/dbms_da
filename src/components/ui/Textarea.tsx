import { type TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'
import { inputBase } from './Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 3, ...props }, ref) {
    return (
      <textarea ref={ref} rows={rows} className={cn(inputBase, 'resize-y px-2.5 py-2', className)} {...props} />
    )
  },
)
