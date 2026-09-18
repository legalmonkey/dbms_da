import { z } from 'zod'

/**
 * LabStaff, with its two specialisations (an ISA hierarchy).
 *
 * ASSUMPTION worth confirming with the database team: Tech_ID and
 * Pathologist_ID are modelled as the subtype's own key, sharing the value of
 * the parent Staff_ID. If Ritvik's schema gives the subtypes independent
 * identifiers instead, only the mock seed changes: these types already carry
 * both fields.
 */

export const shiftSchema = z.enum(['Morning', 'Evening', 'Night', 'General'])
export type Shift = z.infer<typeof shiftSchema>
export const SHIFTS: Shift[] = ['Morning', 'Evening', 'Night', 'General']

export const staffRoleSchema = z.enum(['Technician', 'Pathologist'])
export type StaffRole = z.infer<typeof staffRoleSchema>
export const STAFF_ROLES: StaffRole[] = ['Technician', 'Pathologist']

interface LabStaffBase {
  Staff_ID: string
  Staff_Name: string
  Shift: Shift
}

export interface LabTechnician extends LabStaffBase {
  Staff_Role: 'Technician'
  Tech_ID: string
  Certification: string
}

export interface Pathologist extends LabStaffBase {
  Staff_Role: 'Pathologist'
  Pathologist_ID: string
  License_No: string
  Qualification: string
}

export type LabStaff = LabTechnician | Pathologist

export const isTechnician = (staff: LabStaff): staff is LabTechnician =>
  staff.Staff_Role === 'Technician'

export const isPathologist = (staff: LabStaff): staff is Pathologist =>
  staff.Staff_Role === 'Pathologist'

/**
 * Payload accepted by createStaff. The role drives which extra fields are
 * required, matching the form's conditional inputs.
 */
export const staffInputSchema = z
  .object({
    Staff_Name: z.string().trim().min(2, 'Staff name is required').max(60),
    Shift: shiftSchema,
    Staff_Role: staffRoleSchema,
    Certification: z.string().trim().max(60).optional(),
    License_No: z.string().trim().max(30).optional(),
    Qualification: z.string().trim().max(60).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.Staff_Role === 'Technician' && !value.Certification?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['Certification'],
        message: 'Certification is required for a lab technician',
      })
    }
    if (value.Staff_Role === 'Pathologist') {
      if (!value.License_No?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['License_No'],
          message: 'License number is required for a pathologist',
        })
      }
      if (!value.Qualification?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['Qualification'],
          message: 'Qualification is required for a pathologist',
        })
      }
    }
  })
export type StaffInput = z.infer<typeof staffInputSchema>

export const technicianOptionLabel = (tech: LabTechnician) =>
  `${tech.Tech_ID} - ${tech.Staff_Name} (${tech.Shift})`
