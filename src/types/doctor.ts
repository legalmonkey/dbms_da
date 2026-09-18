import { z } from 'zod'

/** Doctor: referenced by TestOrder as the referring physician. */
export interface Doctor {
  Doctor_ID: string
  Doctor_Name: string
  Specialization: string
}

export const doctorInputSchema = z.object({
  Doctor_Name: z.string().trim().min(2, 'Doctor name is required').max(60),
  Specialization: z.string().trim().min(2, 'Specialization is required').max(60),
})
export type DoctorInput = z.infer<typeof doctorInputSchema>

/** "D003 - Dr. Anita Rao - Endocrinology": the order form's dropdown label. */
export const doctorOptionLabel = (doctor: Doctor) =>
  `${doctor.Doctor_ID} - ${doctor.Doctor_Name} - ${doctor.Specialization}`
