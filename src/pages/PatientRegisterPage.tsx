import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import Stepper, { Step } from '@/components/reactbits/Stepper'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { formatAge, formatDate } from '@/lib/format'
import { createPatient } from '@/services'
import { GENDERS, GENDER_LABELS, type PatientInput, isApiError, patientInputSchema } from '@/types'

const STEP_LABELS = ['Patient details', 'Contact numbers', 'Review and register']

/**
 * Module 1: patient registration as a three-step flow.
 *
 * Each step is validated before the next one opens, and the final step only
 * completes once the record is saved. Contact numbers live in Patient_Contact,
 * a separate table, so step two adds and removes rows rather than offering one
 * fixed phone field.
 */
export function PatientRegisterPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [saveError, setSaveError] = useState<string | null>(null)

  const {
    register,
    control,
    setValue,
    watch,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<PatientInput>({
    resolver: zodResolver(patientInputSchema),
    mode: 'onTouched',
    defaultValues: {
      First_Name: '',
      Last_Name: '',
      DOB: '',
      Gender: 'M',
      Contacts: [{ Contact_No: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'Contacts' })
  const values = watch()

  const mutation = useMutation({
    mutationFn: (input: PatientInput) => {
      const { Contacts, ...patientData } = input
      return createPatient(patientData, Contacts)
    },
    onSuccess: (patient) => {
      void queryClient.invalidateQueries({ queryKey: ['patients'] })
      void queryClient.invalidateQueries({ queryKey: ['workspace-summary'] })
      toast({
        tone: 'success',
        title: `Registered ${patient.First_Name} ${patient.Last_Name}`,
        description: `Assigned Patient_ID ${patient.Patient_ID}`,
      })
      navigate(`/patients/${patient.Patient_ID}`)
    },
  })

  /** Validates the step being left. The last step also performs the save. */
  const canAdvance = async (step: number) => {
    if (step === 1) return trigger(['First_Name', 'Last_Name', 'DOB', 'Gender'])
    if (step === 2) return trigger('Contacts')

    setSaveError(null)
    if (!(await trigger())) {
      setSaveError('Some details are incomplete. Go back and correct the highlighted fields.')
      return false
    }
    try {
      await mutation.mutateAsync(getValues())
      return true
    } catch (error) {
      setSaveError(isApiError(error) ? error.message : 'The record could not be saved. Try again.')
      return false
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Register patient"
        description="Patient_ID is assigned by the system once the record is saved."
        breadcrumbs={[{ label: 'Patients', to: '/patients' }, { label: 'Register' }]}
      />

      <div className="max-w-2xl">
        <Stepper
          stepLabels={STEP_LABELS}
          canAdvance={canAdvance}
          backButtonText="Back"
          nextButtonText="Continue"
          completeButtonText="Register patient"
        >
          <Step>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First_Name" required error={errors.First_Name?.message}>
                <Input {...register('First_Name')} autoComplete="given-name" />
              </Field>
              <Field label="Last_Name" required error={errors.Last_Name?.message}>
                <Input {...register('Last_Name')} autoComplete="family-name" />
              </Field>
              <Field label="DOB" required error={errors.DOB?.message} hint="Age is computed from this date.">
                <Input type="date" {...register('DOB')} max={new Date().toISOString().slice(0, 10)} />
              </Field>
              <Field label="Gender" required error={errors.Gender?.message}>
                <Select
                  value={values.Gender}
                  onValueChange={(value) =>
                    setValue('Gender', value as PatientInput['Gender'], { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}: {GENDER_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Step>

          <Step>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-13 text-fg-muted">
                  Stored in Patient_Contact. The first number is treated as primary.
                </p>
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
          </Step>

          <Step>
            <div className="flex flex-col gap-4">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-[var(--radius-surface)] border border-hairline bg-surface-2 p-4 text-13">
                <dt className="text-fg-muted">Name</dt>
                <dd className="font-medium text-fg">
                  {values.First_Name} {values.Last_Name}
                </dd>
                <dt className="text-fg-muted">DOB</dt>
                <dd>
                  {values.DOB ? `${formatDate(values.DOB)}, ${formatAge(values.DOB)}` : 'Not entered'}
                </dd>
                <dt className="text-fg-muted">Gender</dt>
                <dd>{GENDER_LABELS[values.Gender]}</dd>
                <dt className="text-fg-muted">Contact_No</dt>
                <dd className="flex flex-col gap-0.5 font-mono">
                  {values.Contacts.map((contact, index) => (
                    <span key={`${contact.Contact_No}-${index}`}>
                      {contact.Contact_No || 'Not entered'}
                      {index === 0 ? <span className="ml-2 font-sans text-xs text-fg-muted">Primary</span> : null}
                    </span>
                  ))}
                </dd>
              </dl>

              {saveError ? (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-[var(--radius-control)] border border-danger-border bg-danger-bg px-3 py-2 text-13 text-danger"
                >
                  <AlertTriangle className="mt-px size-4 shrink-0" aria-hidden="true" />
                  {saveError}
                </p>
              ) : (
                <p className="text-13 text-fg-muted">
                  Confirm the details above. Patient_ID is assigned when the record is saved.
                </p>
              )}
            </div>
          </Step>
        </Stepper>
      </div>
    </div>
  )
}
