import type { Role, SessionUser } from '@/types'

/**
 * Fixed identities, one per module role.
 *
 * Presentation-layer scaffolding only. There are no credentials, no tokens and
 * no session security here by design: authentication is the backend team's
 * scope.
 *
 * The IDs below deliberately match rows in the seeded data layer, so signing in
 * as the patient scopes the app to a real Patient_ID with orders and reports.
 */
export const DEMO_USERS: Record<Role, SessionUser> = {
  admin: {
    id: 'usr-admin-01',
    name: 'Anita Raghavan',
    role: 'admin',
    designation: 'Lab Administrator',
  },
  patient: {
    id: 'usr-pat-01',
    name: 'Kavya Nair',
    role: 'patient',
    patientId: 'P0001',
  },
  technician: {
    id: 'usr-tech-01',
    name: 'Rahul Menon',
    role: 'technician',
    techId: 'ST001',
    designation: 'Senior Lab Technician',
  },
  pathologist: {
    id: 'usr-path-01',
    name: 'Dr. Vikram Iyer',
    role: 'pathologist',
    pathologistId: 'ST009',
    designation: 'Consultant Pathologist',
  },
}
