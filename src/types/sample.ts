import { z } from 'zod'

/** Sample: collected against an order and processed at a Laboratory. */

export const sampleTypeSchema = z.enum([
  'Whole Blood',
  'Serum',
  'Plasma',
  'Urine',
  'Stool',
  'Tissue',
  'Swab',
])
export type SampleType = z.infer<typeof sampleTypeSchema>

export const SAMPLE_TYPES: SampleType[] = [
  'Whole Blood',
  'Serum',
  'Plasma',
  'Urine',
  'Stool',
  'Tissue',
  'Swab',
]

export const sampleStatusSchema = z.enum(['Collected', 'In Transit', 'Received', 'Rejected'])
export type SampleStatus = z.infer<typeof sampleStatusSchema>
export const SAMPLE_STATUSES: SampleStatus[] = ['Collected', 'In Transit', 'Received', 'Rejected']

export interface Sample {
  /** Per-order sequence: S1, S2, S3 … */
  Sample_No: string
  Order_ID: string
  Patient_ID: string
  Patient_Name: string
  Sample_Type: SampleType
  Collection_DateTime: string
  Lab_ID: string
  Lab_Name: string
  Tech_ID: string
  Tech_Name: string
  Status: SampleStatus
}

/** Payload accepted by createSample. */
export const sampleInputSchema = z.object({
  Order_ID: z.string().min(1, 'Select an order'),
  Sample_No: z
    .string()
    .trim()
    .regex(/^S\d+$/, 'Sample number must look like S1, S2, S3'),
  Sample_Type: sampleTypeSchema,
  Collection_DateTime: z
    .string()
    .min(1, 'Collection date and time are required')
    .refine((value) => new Date(value) <= new Date(), 'Collection time cannot be in the future'),
  Lab_ID: z.string().min(1, 'Select the processing laboratory'),
  Tech_ID: z.string().min(1, 'Select the collecting technician'),
  Status: sampleStatusSchema.default('Collected'),
})
export type SampleInput = z.infer<typeof sampleInputSchema>

/** Next sequence number for an order that already has these samples. */
export function nextSampleNo(existing: Array<Pick<Sample, 'Sample_No'>>): string {
  const highest = existing.reduce((max, sample) => {
    const parsed = Number.parseInt(sample.Sample_No.replace(/^S/i, ''), 10)
    return Number.isFinite(parsed) && parsed > max ? parsed : max
  }, 0)
  return `S${highest + 1}`
}
