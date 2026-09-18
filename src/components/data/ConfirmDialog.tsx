import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { isApiError } from '@/types'

/**
 * Confirmation before a destructive action.
 *
 * The server can still refuse - a patient with orders on file cannot be
 * deleted - so the dialog stays open and shows why rather than closing on a
 * failure the user never sees.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  loading,
  error,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  onConfirm: () => void
  loading?: boolean
  error?: unknown
}) {
  const message = error
    ? isApiError(error)
      ? error.message
      : 'Could not complete that action.'
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {message ? (
          <DialogBody className="pt-0">
            <p
              role="alert"
              className="flex items-start gap-2 rounded-[var(--radius-control)] border border-danger-border bg-danger-bg px-3 py-2 text-13 text-danger"
            >
              <AlertTriangle className="mt-px size-4 shrink-0" aria-hidden="true" />
              {message}
            </p>
          </DialogBody>
        ) : null}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
