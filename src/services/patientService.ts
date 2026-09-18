import type { Paginated, Patient, PatientInput, PatientListItem } from '@/types'
import { qs, request } from './http'

export interface PatientListParams {
  page?: number
  pageSize?: number
  q?: string
  gender?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export const getPatients = (params: PatientListParams = {}) =>
  request<Paginated<PatientListItem>>('GET', `/patients${qs({ ...params })}`)

export const getPatientById = (patientId: string) =>
  request<Patient>('GET', `/patients/${patientId}`)

/**
 * createPatient(patientData, contacts[]): the schema stores contact numbers
 * in Patient_Contact, so they travel alongside the patient row.
 */
export const createPatient = (
  patientData: Omit<PatientInput, 'Contacts'>,
  contacts: Array<{ Contact_No: string }>,
) => request<Patient>('POST', '/patients', { ...patientData, Contacts: contacts })

/** updatePatient(id, patientData, contacts[]): replaces the contact list. */
export const updatePatient = (
  patientId: string,
  patientData: Omit<PatientInput, 'Contacts'>,
  contacts: Array<{ Contact_No: string }>,
) => request<Patient>('PATCH', `/patients/${patientId}`, { ...patientData, Contacts: contacts })

/** Refused with 409 if the patient has orders on file. */
export const deletePatient = (patientId: string) =>
  request<{ ok: true }>('DELETE', `/patients/${patientId}`)
