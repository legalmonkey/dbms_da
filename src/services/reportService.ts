import type { Paginated, PendingResultItem, Report, ResultRowInput } from '@/types'
import { qs, request } from './http'

export interface ReportListParams {
  page?: number
  pageSize?: number
  q?: string
  patientId?: string
  /** Reports issued by one pathologist. */
  pathologistId?: string
}

export const getReports = (params: ReportListParams = {}) =>
  request<Paginated<Report>>('GET', `/reports${qs({ ...params })}`)

export const getReport = (reportId: string) => request<Report>('GET', `/reports/${reportId}`)

/** The pathologist's queue: draft reports whose samples have been collected. */
export const getPendingResults = () => request<PendingResultItem[]>('GET', '/pending-results')

export const saveReportResults = (reportId: string, results: ResultRowInput[]) =>
  request<Report>('PUT', `/reports/${reportId}/results`, { Results: results })
