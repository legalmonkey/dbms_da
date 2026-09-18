import type { Paginated, Sample, SampleInput } from '@/types'
import { qs, request } from './http'

export interface SampleListParams {
  page?: number
  pageSize?: number
  q?: string
  orderId?: string
  labId?: string
  /** Samples collected by one technician. */
  techId?: string
}

export const getSamples = (params: SampleListParams = {}) =>
  request<Paginated<Sample>>('GET', `/samples${qs({ ...params })}`)

export const createSample = (sampleData: SampleInput) =>
  request<Sample>('POST', '/samples', sampleData)
