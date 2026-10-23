import type {
  CoOccurrenceRecord,
  ContaminationTrace,
  CypherQueryResult,
  GraphData,
  GraphOverview,
  HereditaryRiskAnalysis,
} from '@/types'
import { request } from './http'

export const getGraphOverview = () => request<GraphOverview>('GET', '/graph/overview')

export const getGraphNetwork = (limit = 150) =>
  request<GraphData>('GET', `/graph/network?limit=${limit}`)

export const traceContamination = (equipmentId = 'EQ-COBAS-01') =>
  request<ContaminationTrace>('GET', `/graph/contamination?equipmentId=${encodeURIComponent(equipmentId)}`)

export const getHereditaryRisk = (patientId = 'P-1001') =>
  request<HereditaryRiskAnalysis>('GET', `/graph/hereditary?patientId=${encodeURIComponent(patientId)}`)

export const getCoOccurrenceNetwork = () =>
  request<CoOccurrenceRecord[]>('GET', '/graph/co-occurrence')

export const runCypherQuery = (query: string, params: Record<string, unknown> = {}) =>
  request<CypherQueryResult>('POST', '/graph/cypher', { query, params })

export const seedGraphDatabase = () =>
  request<{ ok: boolean; message: string }>('POST', '/graph/seed')
