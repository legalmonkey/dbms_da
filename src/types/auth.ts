import { z } from 'zod'

/**
 * Demo session and permissions.
 *
 * NOTE ON NAMING: authentication is not part of the database schema, so these
 * types keep camelCase. Everything that maps to a real table (Patient, Test,
 * Sample, Report …) uses the schema's exact column names instead.
 *
 * Roles mirror the five project modules: the patient books and views, the
 * technician collects samples, the pathologist enters and verifies results,
 * and the administrator manages the catalogue, staff and labs.
 */

export const roleSchema = z.enum(['admin', 'patient', 'technician', 'pathologist'])
export type Role = z.infer<typeof roleSchema>

export const ROLES: Role[] = ['admin', 'patient', 'technician', 'pathologist']

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  patient: 'Patient',
  technician: 'Lab Technician',
  pathologist: 'Pathologist',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Manage the test catalogue, staff directory and laboratory locations.',
  patient: 'Register, book test orders, track status and read your reports.',
  technician: 'Look up orders, record sample collection and assign them to a lab.',
  pathologist: 'Work the pending queue, enter observed values and issue reports.',
}

/**
 * Permissions, not roles, gate the UI. Components ask can('order:create') so
 * that when the backend ships real access control the strings map across.
 */
export const PERMISSIONS = [
  'patient:read',
  'patient:write',
  'catalogue:read',
  'catalogue:write',
  'order:read',
  'order:create',
  'sample:read',
  'sample:write',
  'report:read',
  'report:write',
  'staff:manage',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: PERMISSIONS,
  // No patient:read. A patient sees their own record through the patient
  // workspace, never the register of other patients.
  patient: ['catalogue:read', 'order:read', 'order:create', 'report:read'],
  technician: ['patient:read', 'catalogue:read', 'order:read', 'sample:read', 'sample:write'],
  pathologist: [
    'patient:read',
    'catalogue:read',
    'order:read',
    'sample:read',
    'report:read',
    'report:write',
  ],
}

export const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: roleSchema,
  /** Set for the patient role: scopes the app to one Patient_ID. */
  patientId: z.string().optional(),
  /** Set for pathologists: printed in the report signature block. */
  pathologistId: z.string().optional(),
  /** Set for technicians: stamped on collected samples. */
  techId: z.string().optional(),
  designation: z.string().optional(),
})
export type SessionUser = z.infer<typeof sessionUserSchema>

export interface Session {
  user: SessionUser
  permissions: readonly Permission[]
  issuedAt: string
}
