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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { createStaff, updateStaff } from '@/services'
import {
  SHIFTS,
  STAFF_ROLES,
  type LabStaff,
  type StaffInput,
  isApiError,
  isPathologist,
  isTechnician,
  staffInputSchema,
} from '@/types'

const EMPTY: StaffInput = {
  Staff_Name: '',
  Shift: 'Morning',
  Staff_Role: 'Technician',
  Certification: '',
  License_No: '',
  Qualification: '',
}

/**
 * Create and edit a LabStaff record.
 *
 * Staff_Role swaps the specialisation fields: a technician carries a
 * Certification, a pathologist carries License_No and Qualification. The Zod
 * schema requires whichever set the chosen role implies.
 */
export function StaffFormDialog({
  open,
  onOpenChange,
  staff,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff?: LabStaff | null
}) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const isEdit = Boolean(staff)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StaffInput>({ resolver: zodResolver(staffInputSchema), defaultValues: EMPTY })

  const role = watch('Staff_Role')
  const shift = watch('Shift')

  useEffect(() => {
    if (!open) return
    reset(
      staff
        ? {
            Staff_Name: staff.Staff_Name,
            Shift: staff.Shift,
            Staff_Role: staff.Staff_Role,
            Certification: isTechnician(staff) ? staff.Certification : '',
            License_No: isPathologist(staff) ? staff.License_No : '',
            Qualification: isPathologist(staff) ? staff.Qualification : '',
          }
        : EMPTY,
    )
  }, [open, staff, reset])

  const mutation = useMutation({
    mutationFn: (values: StaffInput) =>
      staff ? updateStaff(staff.Staff_ID, values) : createStaff(values),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] })
      void queryClient.invalidateQueries({ queryKey: ['samples'] })
      void queryClient.invalidateQueries({ queryKey: ['reports'] })
      toast({
        tone: 'success',
        title: isEdit ? `Updated ${saved.Staff_Name}` : `Added ${saved.Staff_Name}`,
        description: `Staff_ID ${saved.Staff_ID}`,
      })
      onOpenChange(false)
    },
    onError: (error) =>
      toast({
        tone: 'error',
        title: 'Could not save the staff record',
        description: isApiError(error) ? error.message : String(error),
      }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="md">
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? `Edit staff ${staff?.Staff_ID}` : 'Add staff'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Name changes follow through to the samples and reports this member is recorded on.'
                : 'Staff_ID is assigned by the system once the record is saved.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2" label="Staff_Name" required error={errors.Staff_Name?.message}>
              <Input {...register('Staff_Name')} placeholder="e.g. Rahul Menon" />
            </Field>

            <Field label="Staff_Role" required error={errors.Staff_Role?.message}>
              <Select
                value={role}
                onValueChange={(value) => setValue('Staff_Role', value as StaffInput['Staff_Role'])}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Shift" required error={errors.Shift?.message}>
              <Select value={shift} onValueChange={(value) => setValue('Shift', value as StaffInput['Shift'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIFTS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {role === 'Technician' ? (
              <Field
                className="sm:col-span-2"
                label="Certification"
                required
                error={errors.Certification?.message}
              >
                <Input {...register('Certification')} placeholder="e.g. DMLT" />
              </Field>
            ) : (
              <>
                <Field label="License_No" required error={errors.License_No?.message}>
                  <Input {...register('License_No')} placeholder="e.g. KA/MC/12345" />
                </Field>
                <Field label="Qualification" required error={errors.Qualification?.message}>
                  <Input {...register('Qualification')} placeholder="e.g. MD (Pathology)" />
                </Field>
              </>
            )}
          </DialogBody>

          <DialogFooter>
            <Button type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={mutation.isPending}>
              {isEdit ? 'Save changes' : 'Add staff'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
