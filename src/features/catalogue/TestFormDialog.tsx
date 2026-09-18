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
import { createTest, updateTest } from '@/services'
import {
  IMAGING_MODALITIES,
  SPECIMEN_TYPES,
  TEST_CATEGORIES,
  type Test,
  type TestInput,
  isApiError,
  testInputSchema,
} from '@/types'

const EMPTY: TestInput = {
  Test_Name: '',
  Test_Category: 'Pathology',
  Price: 0,
  Specimen_Type: null,
  Imaging_Modality: null,
  Unit: '',
}

/**
 * Create and edit a Test.
 *
 * Test_Category drives which specialisation field is shown: Pathology carries
 * Specimen_Type, Radiology carries Imaging_Modality. The schema enforces the
 * same rule, so the form cannot save a half-specified test.
 */
export function TestFormDialog({
  open,
  onOpenChange,
  test,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  test?: Test | null
}) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const isEdit = Boolean(test)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TestInput>({ resolver: zodResolver(testInputSchema), defaultValues: EMPTY })

  const category = watch('Test_Category')
  const specimen = watch('Specimen_Type')
  const modality = watch('Imaging_Modality')

  useEffect(() => {
    if (!open) return
    reset(
      test
        ? {
            Test_Name: test.Test_Name,
            Test_Category: test.Test_Category,
            Price: test.Price,
            Specimen_Type: test.Specimen_Type,
            Imaging_Modality: test.Imaging_Modality,
            Unit: test.Unit ?? '',
          }
        : EMPTY,
    )
  }, [open, test, reset])

  const mutation = useMutation({
    mutationFn: (values: TestInput) =>
      test ? updateTest(test.Test_ID, values) : createTest(values),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['tests'] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        tone: 'success',
        title: isEdit ? `Updated ${saved.Test_Name}` : `Added ${saved.Test_Name}`,
        description: `Test_ID ${saved.Test_ID}`,
      })
      onOpenChange(false)
    },
    onError: (error) =>
      toast({
        tone: 'error',
        title: 'Could not save the test',
        description: isApiError(error) ? error.message : String(error),
      }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="md">
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? `Edit test ${test?.Test_ID}` : 'Add test'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Existing orders keep the price they were booked at; only the descriptive fields follow the catalogue.'
                : 'Test_ID is assigned by the system once the test is saved.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2" label="Test_Name" required error={errors.Test_Name?.message}>
              <Input {...register('Test_Name')} placeholder="e.g. Serum Creatinine" />
            </Field>

            <Field label="Test_Category" required error={errors.Test_Category?.message}>
              <Select
                value={category}
                onValueChange={(value) => {
                  setValue('Test_Category', value as TestInput['Test_Category'])
                  // Clear the field that no longer applies so a Pathology test
                  // can never carry a stale Imaging_Modality and vice versa.
                  setValue('Specimen_Type', null)
                  setValue('Imaging_Modality', null)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEST_CATEGORIES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Price" required error={errors.Price?.message} hint="Whole rupees.">
              <Input type="number" min={0} step={1} {...register('Price')} />
            </Field>

            {category === 'Pathology' ? (
              <Field label="Specimen_Type" required error={errors.Specimen_Type?.message}>
                <Select
                  value={specimen ?? ''}
                  onValueChange={(value) => setValue('Specimen_Type', value as TestInput['Specimen_Type'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a specimen" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIMEN_TYPES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : (
              <Field label="Imaging_Modality" required error={errors.Imaging_Modality?.message}>
                <Select
                  value={modality ?? ''}
                  onValueChange={(value) =>
                    setValue('Imaging_Modality', value as TestInput['Imaging_Modality'])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a modality" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGING_MODALITIES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            <Field label="Unit" error={errors.Unit?.message} hint="Optional, e.g. g/dL.">
              <Input {...register('Unit')} placeholder="Leave blank for imaging" />
            </Field>
          </DialogBody>

          <DialogFooter>
            <Button type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={mutation.isPending}>
              {isEdit ? 'Save changes' : 'Add test'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
