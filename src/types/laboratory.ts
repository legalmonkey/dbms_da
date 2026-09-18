import { z } from 'zod'

/** Laboratory: the physical facility a sample is processed at. */
export interface Laboratory {
  Lab_ID: string
  Lab_Name: string
  Location: string
  Contact_No: string
}

export const laboratoryInputSchema = z.object({
  Lab_Name: z.string().trim().min(2, 'Lab name is required').max(60),
  Location: z.string().trim().min(2, 'Location is required').max(80),
  Contact_No: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit contact number'),
})
export type LaboratoryInput = z.infer<typeof laboratoryInputSchema>

export const labOptionLabel = (lab: Laboratory) => `${lab.Lab_ID} - ${lab.Lab_Name}, ${lab.Location}`
