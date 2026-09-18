import { z } from 'zod'

/**
 * Patient + Patient_Contact.
 *
 * Field names mirror the database schema exactly (Patient_ID, First_Name …)
 * so that a row coming off the API maps onto these types with no translation
 * layer in between.
 */

export const genderSchema = z.enum(['M', 'F', 'O'])
export type Gender = z.infer<typeof genderSchema>

export const GENDERS: Gender[] = ['M', 'F', 'O']

export const GENDER_LABELS: Record<Gender, string> = {
  M: 'Male',
  F: 'Female',
  O: 'Other',
}

/** Patient_Contact: a patient may have many contact numbers. */
export interface PatientContact {
  Patient_ID: string
  Contact_No: string
}

export const contactNoSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')

/** Payload accepted by createPatient(patientData, contacts[]). */
export const patientInputSchema = z.object({
  First_Name: z.string().trim().min(1, 'First name is required').max(40),
  Last_Name: z.string().trim().min(1, 'Last name is required').max(40),
  DOB: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((value) => new Date(value) <= new Date(), 'Date of birth cannot be in the future'),
  Gender: genderSchema,
  /** At least one number is required; the form adds and removes rows. */
  Contacts: z.array(z.object({ Contact_No: contactNoSchema })).min(1, 'Add at least one contact number'),
})
export type PatientInput = z.infer<typeof patientInputSchema>

export interface Patient {
  Patient_ID: string
  First_Name: string
  Last_Name: string
  DOB: string
  Gender: Gender
  Contacts: PatientContact[]
}

/** Row shape for the patient list: adds counters the table column needs. */
export interface PatientListItem extends Patient {
  Order_Count: number
  Last_Order_Date: string | null
}

export const patientFullName = (patient: Pick<Patient, 'First_Name' | 'Last_Name'>) =>
  `${patient.First_Name} ${patient.Last_Name}`.trim()

/** Primary number is the first one on file. */
export const primaryContact = (patient: Pick<Patient, 'Contacts'>) =>
  patient.Contacts[0]?.Contact_No ?? null
