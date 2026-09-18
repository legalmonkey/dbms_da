import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'

/**
 * Edit and delete controls for a table row.
 *
 * Both carry an accessible name naming the specific record, so a screen reader
 * hears "Edit patient P0004" rather than forty identical "Edit" buttons.
 */
export function RowActions({
  label,
  onEdit,
  onDelete,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  disableDelete,
  disableDeleteReason,
}: {
  /** Identifies the record, e.g. "patient P0004". */
  label: string
  onEdit?: () => void
  onDelete?: () => void
  editLabel?: string
  deleteLabel?: string
  disableDelete?: boolean
  disableDeleteReason?: string
}) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      {onEdit ? (
        <Tooltip content={`${editLabel} ${label}`}>
          <Button size="icon-sm" variant="ghost" onClick={onEdit} aria-label={`${editLabel} ${label}`}>
            <Pencil />
          </Button>
        </Tooltip>
      ) : null}

      {onDelete ? (
        <Tooltip content={disableDelete ? disableDeleteReason : `${deleteLabel} ${label}`}>
          <span>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onDelete}
              disabled={disableDelete}
              aria-label={`${deleteLabel} ${label}`}
              className="text-fg-muted hover:bg-danger-bg hover:text-danger"
            >
              <Trash2 />
            </Button>
          </span>
        </Tooltip>
      ) : null}
    </div>
  )
}
