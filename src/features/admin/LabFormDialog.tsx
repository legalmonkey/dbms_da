import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { createLabLocation, updateLabLocation } from '@/services'
import { type Laboratory, type LaboratoryInput, isApiError, laboratoryInputSchema } from '@/types'

const EMPTY: LaboratoryInput = { Lab_Name: '', Location: '', Contact_No: '' }

/** Create and edit a Laboratory. */
export function LabFormDialog({
  open,
  onOpenChange,
  lab,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lab?: Laboratory | null
}) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const isEdit = Boolean(lab)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LaboratoryInput>({ resolver: zodResolver(laboratoryInputSchema), defaultValues: EMPTY })

  useEffect(() => {
    if (!open) return
    reset(
      lab
        ? { Lab_Name: lab.Lab_Name, Location: lab.Location, Contact_No: lab.Contact_No }
        : EMPTY,
    )
  }, [open, lab, reset])

  const mutation = useMutation({
    mutationFn: (values: LaboratoryInput) =>
      lab ? updateLabLocation(lab.Lab_ID, values) : createLabLocation(values),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['laboratories'] })
      void queryClient.invalidateQueries({ queryKey: ['samples'] })
      toast({
        tone: 'success',
        title: isEdit ? `Updated ${saved.Lab_Name}` : `Added ${saved.Lab_Name}`,
        description: `Lab_ID ${saved.Lab_ID}`,
      })
      onOpenChange(false)
    },
    onError: (error) =>
      toast({
        tone: 'error',
        title: 'Could not save the laboratory',
        description: isApiError(error) ? error.message : String(error),
      }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="sm">
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? `Edit laboratory ${lab?.Lab_ID}` : 'Add laboratory'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Renaming updates the samples processed at this facility.'
                : 'Lab_ID is assigned by the system once the record is saved.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-4">
            <Field label="Lab_Name" required error={errors.Lab_Name?.message}>
              <Input {...register('Lab_Name')} placeholder="e.g. Central Processing Lab" />
            </Field>
            <Field label="Location" required error={errors.Location?.message}>
              <Input {...register('Location')} placeholder="e.g. Residency Road, Bengaluru" />
            </Field>
            <Field label="Contact_No" required error={errors.Contact_No?.message}>
              <Input {...register('Contact_No')} inputMode="numeric" placeholder="10-digit number" />
            </Field>
          </DialogBody>

          <DialogFooter>
            <Button type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={mutation.isPending}>
              {isEdit ? 'Save changes' : 'Add laboratory'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
