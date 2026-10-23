export type GraphNodeType =
  | 'patient'
  | 'sample'
  | 'test'
  | 'staff'
  | 'equipment'
  | 'doctor'
  | 'laboratory'

export interface GraphNode {
  id: string
  label: string
  type: string
  group?: string
  gender?: string
  bloodGroup?: string
  status?: string
  role?: string
  specialization?: string
  category?: string
  code?: string
  [key: string]: unknown
}

export interface GraphLink {
  source: string
  target: string
  label: string
  type: string
  relation?: string
  batchId?: string
  [key: string]: unknown
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export interface GraphOverview {
  connected: boolean
  address?: string
  version?: string
  source: string
  summary: {
    totalNodes: number
    totalRelationships: number
    nodeLabels: Record<string, number>
    relationshipTypes: Record<string, number>
  }
}

export interface ContaminationTrace {
  incidentEquipment: {
    id: string
    name: string
    status: string
    labId: string
  }
  affectedSamplesCount: number
  affectedPatientsCount: number
  exposedSamples: Array<{
    sampleNo: string
    type: string
    patientId: string
    patientName: string
    testAffected?: string
  }>
  involvedStaff: Array<{
    id: string
    name: string
    role: string
    shift?: string
  }>
  cypherQuery: string
  executionTimeMs: number
  justification: string
}

export interface HereditaryRelative {
  id: string
  name: string
  relation: string
  bloodGroup: string
  inheritedRiskLevel: string
  recommendedScreenings: string[]
}

export interface HereditaryRiskAnalysis {
  indexPatient: {
    id: string
    name: string
    riskProfile: string
  }
  familyMembersCount: number
  relatives: HereditaryRelative[]
  cypherQuery: string
  executionTimeMs: number
}

export interface CoOccurrenceRecord {
  testA: string
  testB: string
  frequency: number
  category: string
}

export interface CypherQueryResult {
  success: boolean
  source: string
  cypher: string
  executionTimeMs: number
  recordsCount?: number
  records?: Array<Record<string, unknown>>
  error?: string
}
