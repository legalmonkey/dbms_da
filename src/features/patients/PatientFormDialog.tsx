import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
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
import { createPatient, updatePatient } from '@/services'
import {
  GENDERS,
  GENDER_LABELS,
  type Patient,
  type PatientInput,
  isApiError,
  patientInputSchema,
} from '@/types'

const EMPTY: PatientInput = {
  First_Name: '',
  Last_Name: '',
  DOB: '',
  Gender: 'M',
  Contacts: [{ Contact_No: '' }],
}

/**
 * Create and edit a Patient plus its Patient_Contact rows.
 *
 * One component serves both modes: the fields and validation are identical,
 * and only the mutation differs.
 */
export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present for edit, absent for create. */
  patient?: Patient | null
}) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const isEdit = Boolean(patient)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<PatientInput>({
    resolver: zodResolver(patientInputSchema),
    defaultValues: EMPTY,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'Contacts' })
  const gender = watch('Gender')

  // Refill whenever the dialog opens so a reopened form never shows stale data.
  useEffect(() => {
    if (!open) return
    reset(
      patient
        ? {
            First_Name: patient.First_Name,
            Last_Name: patient.Last_Name,
            DOB: patient.DOB,
            Gender: patient.Gender,
            Contacts: patient.Contacts.map((contact) => ({ Contact_No: contact.Contact_No })),
          }
        : EMPTY,
    )
  }, [open, patient, reset])

  const mutation = useMutation({
    mutationFn: (values: PatientInput) => {
      const { Contacts, ...patientData } = values
      return patient
        ? updatePatient(patient.Patient_ID, patientData, Contacts)
        : createPatient(patientData, Contacts)
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['patients'] })
      void queryClient.invalidateQueries({ queryKey: ['patient', saved.Patient_ID] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['reports'] })
      toast({
        tone: 'success',
        title: isEdit ? `Updated ${saved.First_Name} ${saved.Last_Name}` : `Registered ${saved.Patient_ID}`,
        description: isEdit ? undefined : `${saved.First_Name} ${saved.Last_Name} added to the register.`,
      })
      onOpenChange(false)
    },
    onError: (error) => {
      if (isApiError(error) && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          setError(field as keyof PatientInput, { message })
        }
      }
      toast({
        tone: 'error',
        title: isEdit ? 'Could not save the changes' : 'Could not register the patient',
        description: isApiError(error) ? error.message : String(error),
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="md">
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? `Edit patient ${patient?.Patient_ID}` : 'Add patient'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Changes propagate to the orders, samples and reports that carry this name.'
                : 'Patient_ID is assigned by the system once the record is saved.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First_Name" required error={errors.First_Name?.message}>
                <Input {...register('First_Name')} autoComplete="given-name" />
              </Field>
              <Field label="Last_Name" required error={errors.Last_Name?.message}>
                <Input {...register('Last_Name')} autoComplete="family-name" />
              </Field>
              <Field label="DOB" required error={errors.DOB?.message}>
                <Input type="date" {...register('DOB')} max={new Date().toISOString().slice(0, 10)} />
              </Field>
              <Field label="Gender" required error={errors.Gender?.message}>
                <Select
                  value={gender}
                  onValueChange={(value) => setValue('Gender', value as PatientInput['Gender'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value} - {GENDER_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-13 font-medium text-fg">Contact numbers</p>
                  <p className="text-xs text-fg-muted">
                    Stored in Patient_Contact. The first is treated as primary.
                  </p>
                </div>
                <Button type="button" size="sm" onClick={() => append({ Contact_No: '' })}>
                  <Plus />
                  Add number
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <Field
                    className="flex-1"
                    label={index === 0 ? 'Primary Contact_No' : `Contact_No ${index + 1}`}
                    required={index === 0}
                    error={errors.Contacts?.[index]?.Contact_No?.message}
                  >
                    <Input
                      inputMode="numeric"
                      placeholder="10-digit mobile number"
                      {...register(`Contacts.${index}.Contact_No` as const)}
                    />
                  </Field>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="mt-6 text-fg-muted hover:text-danger"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label={`Remove contact number ${index + 1}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}

              {errors.Contacts?.message ? (
                <p role="alert" className="text-xs text-danger">
                  {errors.Contacts.message}
                </p>
              ) : null}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={mutation.isPending}>
              {isEdit ? 'Save changes' : 'Add patient'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
