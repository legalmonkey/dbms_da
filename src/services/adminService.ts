import type { LabStaff, Laboratory, LaboratoryInput, StaffInput, StaffRole } from '@/types'
import { qs, request } from './http'

export const getStaff = (params: { role?: StaffRole } = {}) =>
  request<LabStaff[]>('GET', `/staff${qs({ ...params })}`)

export const createStaff = (staffData: StaffInput) =>
  request<LabStaff>('POST', '/staff', staffData)

export const getLabLocations = () => request<Laboratory[]>('GET', '/laboratories')

export const createLabLocation = (labData: LaboratoryInput) =>
  request<Laboratory>('POST', '/laboratories', labData)

/** Demo-only: rebuild the mock store from its deterministic seed. */
export const resetDemoData = () => request<{ ok: boolean }>('POST', '/demo/reset')

export const updateStaff = (staffId: string, staffData: StaffInput) =>
  request<LabStaff>('PATCH', `/staff/${staffId}`, staffData)

/** Refused with 409 if the member is recorded on samples or reports. */
export const deleteStaff = (staffId: string) =>
  request<{ ok: true }>('DELETE', `/staff/${staffId}`)

export const updateLabLocation = (labId: string, labData: LaboratoryInput) =>
  request<Laboratory>('PATCH', `/laboratories/${labId}`, labData)

/** Refused with 409 if any sample is processed at this laboratory. */
export const deleteLabLocation = (labId: string) =>
  request<{ ok: true }>('DELETE', `/laboratories/${labId}`)
