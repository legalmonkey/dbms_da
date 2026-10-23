import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Cpu,
  Dna,
  Layers,
  Network,
  Play,
  RefreshCw,
  Share2,
  ShieldAlert,
  Users,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Surface } from '@/components/ui/Surface'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Toast'
import {
  getCoOccurrenceNetwork,
  getGraphNetwork,
  getGraphOverview,
  getHereditaryRisk,
  runCypherQuery,
  seedGraphDatabase,
  traceContamination,
} from '@/services'
import type { GraphNode } from '@/types'

const PRESET_QUERIES = [
  {
    name: '1. Contamination Chain-of-Custody',
    query: `MATCH (eq:Equipment {id: 'EQ-COBAS-01'})<-[:PROCESSED_ON]-(s:Sample)<-[:PROVIDED]-(p:Patient)\nRETURN eq.name AS Analyzer, s.sampleNo AS Sample, p.name AS Patient`,
  },
  {
    name: '2. Multi-Hop Familial Pedigree',
    query: `MATCH (p:Patient {id: 'P-1001'})-[f:FAMILY_MEMBER_OF*1..2]-(relative:Patient)\nRETURN p.name AS IndexPatient, relative.name AS Relative, relative.bloodGroup AS BloodGroup`,
  },
  {
    name: '3. Technician Equipment Shifts',
    query: `MATCH (st:Staff)-[op:OPERATED]->(eq:Equipment)\nRETURN st.name AS Technician, eq.name AS Analyzer, op.shift AS Shift`,
  },
  {
    name: '4. Diagnostic Test Co-Occurrence',
    query: `MATCH (t1:Test)<-[:ANALYZED_FOR]-(:Sample)<-[:PROVIDED]-(p:Patient)-[:PROVIDED]->(:Sample)-[:ANALYZED_FOR]->(t2:Test)\nWHERE id(t1) < id(t2)\nRETURN t1.name AS TestA, t2.name AS TestB, count(p) AS CoOccurrence\nORDER BY CoOccurrence DESC LIMIT 5`,
  },
]

export function GraphIntelligencePage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Tab State
  const [activeTab, setActiveTab] = useState<'contamination' | 'hereditary' | 'knowledge' | 'cypher'>('contamination')

  // Filter & Selection States
  const [selectedEquipment, setSelectedEquipment] = useState('EQ-COBAS-01')
  const [selectedPatient, setSelectedPatient] = useState('P-1001')
  const [nodeTypeFilter, setNodeTypeFilter] = useState<string>('all')
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  // Cypher Console State
  const [customCypher, setCustomCypher] = useState(PRESET_QUERIES[0]?.query || '')
  const [cypherResult, setCypherResult] = useState<{
    success?: boolean
    executionTimeMs?: number
    recordsCount?: number
    records?: Array<Record<string, unknown>>
    error?: string
  } | null>(null)
  const [isRunningCypher, setIsRunningCypher] = useState(false)

  // Data Queries
  const overviewQuery = useQuery({ queryKey: ['graph', 'overview'], queryFn: getGraphOverview })
  const networkQuery = useQuery({ queryKey: ['graph', 'network'], queryFn: () => getGraphNetwork(150) })
  const contaminationQuery = useQuery({
    queryKey: ['graph', 'contamination', selectedEquipment],
    queryFn: () => traceContamination(selectedEquipment),
  })
  const hereditaryQuery = useQuery({
    queryKey: ['graph', 'hereditary', selectedPatient],
    queryFn: () => getHereditaryRisk(selectedPatient),
  })
  const coOccurrenceQuery = useQuery({
    queryKey: ['graph', 'co-occurrence'],
    queryFn: getCoOccurrenceNetwork,
  })

  // Seed Mutation
  const seedMutation = useMutation({
    mutationFn: seedGraphDatabase,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['graph'] })
      toast({ tone: 'success', title: 'Graph Re-Seeded', description: res.message })
    },
    onError: (err: Error) => {
      toast({ tone: 'error', title: 'Seeding Failed', description: err.message })
    },
  })

  // Execute Cypher
  const handleRunCypher = async (queryToRun?: string) => {
    const q = queryToRun || customCypher
    setIsRunningCypher(true)
    try {
      const res = await runCypherQuery(q)
      setCypherResult(res)
      toast({ tone: 'success', title: 'Cypher Query Completed', description: `Execution time: ${res.executionTimeMs}ms` })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setCypherResult({ success: false, error: message })
      toast({ tone: 'error', title: 'Cypher Execution Error', description: message })
    } finally {
      setIsRunningCypher(false)
    }
  }

  // Filtered Nodes for Visualizer
  const networkData = networkQuery.data
  const filteredNodes = useMemo(() => {
    if (!networkData?.nodes) return []
    if (nodeTypeFilter === 'all') return networkData.nodes
    return networkData.nodes.filter((n) => (n.type || '').toLowerCase() === nodeTypeFilter.toLowerCase())
  }, [networkData, nodeTypeFilter])

  // Color mappings for graph nodes
  const getNodeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'patient':
        return { fill: '#3b82f6', stroke: '#1d4ed8', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' }
      case 'sample':
        return { fill: '#f59e0b', stroke: '#b45309', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' }
      case 'equipment':
        return { fill: '#f43f5e', stroke: '#be123c', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' }
      case 'staff':
        return { fill: '#a855f7', stroke: '#7e22ce', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' }
      case 'test':
        return { fill: '#10b981', stroke: '#047857', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
      case 'doctor':
        return { fill: '#06b6d4', stroke: '#0e7490', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' }
      case 'laboratory':
        return { fill: '#6366f1', stroke: '#4338ca', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' }
      default:
        return { fill: '#64748b', stroke: '#475569', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30' }
    }
  }

  // Radial / grid node positioning for visualizer
  const nodePositions = useMemo(() => {
    const pos = new Map<string, { x: number; y: number }>()
    if (!networkData?.nodes) return pos

    const width = 800
    const height = 480
    const centerX = width / 2
    const centerY = height / 2

    const categories = ['laboratory', 'equipment', 'sample', 'patient', 'staff', 'test', 'doctor']
    const radiusByCategory: Record<string, number> = {
      laboratory: 50,
      equipment: 105,
      sample: 165,
      patient: 235,
      staff: 155,
      test: 220,
      doctor: 275,
    }

    const byCategory: Record<string, GraphNode[]> = {}
    categories.forEach((cat) => (byCategory[cat] = []))

    networkData.nodes.forEach((node) => {
      const cat = (node.type || '').toLowerCase()
      if (byCategory[cat]) byCategory[cat].push(node)
      else (byCategory.sample ||= []).push(node)
    })

    categories.forEach((cat) => {
      const group = byCategory[cat] || []
      const radius = radiusByCategory[cat] || 200
      const angleStep = (2 * Math.PI) / Math.max(group.length, 1)

      group.forEach((node, i) => {
        const offset = cat === 'equipment' ? 0 : cat === 'sample' ? Math.PI / 6 : Math.PI / 4
        const angle = i * angleStep + offset
        pos.set(node.id, {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        })
      })
    })

    return pos
  }, [networkData])

  const overview = overviewQuery.data

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Neo4j Graph Intelligence & Chain of Custody"
        description="Index-free graph traversals for biohazard contamination tracing, multi-generational familial pedigrees, and Cypher live execution."
        actions={
          <div className="flex items-center gap-3">
            {overviewQuery.isError || overview?.connected === false ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span>Neo4j AuraDB (Disconnected)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Neo4j AuraDB ({overview?.address || 'Active'})</span>
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${seedMutation.isPending ? 'animate-spin' : ''}`} />
              Re-Seed Graph
            </Button>
          </div>
        }
      />

      {/* Top Architecture Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Surface className="p-4 flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <div className="text-xs font-medium text-fg-muted uppercase tracking-wider">Graph Nodes</div>
            <div className="text-2xl font-bold mt-1 text-fg">
              {overview?.summary?.totalNodes ?? 0}
            </div>
            <div className="text-11 text-fg-muted mt-0.5">Patients, Samples, Analyzers, Tests</div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
            <Layers className="h-5 w-5" />
          </div>
        </Surface>

        <Surface className="p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <div className="text-xs font-medium text-fg-muted uppercase tracking-wider">Graph Relationships</div>
            <div className="text-2xl font-bold mt-1 text-fg">
              {overview?.summary?.totalRelationships ?? 0}
            </div>
            <div className="text-11 text-fg-muted mt-0.5">Zero-Join Index-Free Pointers</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Share2 className="h-5 w-5" />
          </div>
        </Surface>

        <Surface className="p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <div className="text-xs font-medium text-fg-muted uppercase tracking-wider">Traversal Latency</div>
            <div className="text-2xl font-bold mt-1 text-emerald-400 font-mono">
              ~1.4 ms
            </div>
            <div className="text-11 text-fg-muted mt-0.5">O(1) pointer dereference vs SQL join</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Zap className="h-5 w-5" />
          </div>
        </Surface>

        <Surface className="p-4 flex items-center justify-between border-l-4 border-l-purple-500">
          <div>
            <div className="text-xs font-medium text-fg-muted uppercase tracking-wider">Architecture</div>
            <div className="text-15 font-bold mt-1 text-fg">
              Polyglot Persistence
            </div>
            <div className="text-11 text-fg-muted mt-0.5">Oracle (ACID) + Neo4j (Graph)</div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Cpu className="h-5 w-5" />
          </div>
        </Surface>
      </div>

      {/* Main Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="contamination" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>Contamination & Chain-of-Custody</span>
          </TabsTrigger>
          <TabsTrigger value="hereditary" className="flex items-center gap-2">
            <Dna className="h-4 w-4" />
            <span>Hereditary Risk & Pedigrees</span>
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            <span>Diagnostic Co-Occurrence</span>
          </TabsTrigger>
          <TabsTrigger value="cypher" className="flex items-center gap-2">
            <Play className="h-4 w-4 text-emerald-400" />
            <span>Live Cypher Playground</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CONTAMINATION & SPECIMEN CHAIN OF CUSTODY */}
        <TabsContent value="contamination" className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Surface className="p-5 flex flex-col gap-4">
              <div>
                <h3 className="text-15 font-semibold text-fg flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  Biohazard Incident Audit
                </h3>
                <p className="text-xs text-fg-muted mt-1">
                  Select a diagnostic analyzer to trace all exposed biological specimens and patients within arbitrary relationship hops.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-fg-muted mb-1 block">Target Lab Equipment / Analyzer</label>
                <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                  <SelectTrigger className="w-full text-13">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EQ-COBAS-01">EQ-COBAS-01 (Roche Cobas c311 - Contaminated)</SelectItem>
                    <SelectItem value="EQ-XN550-01">EQ-XN550-01 (Sysmex XN-550 Hematology)</SelectItem>
                    <SelectItem value="EQ-PCR-01">EQ-PCR-01 (BioRad Real-Time PCR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {contaminationQuery.data && (
                <div className="flex flex-col gap-3 pt-3 border-t border-hairline">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-fg-muted">Equipment Status:</span>
                    <Badge tone={contaminationQuery.data.incidentEquipment?.status?.includes('ALERT') ? 'danger' : 'success'}>
                      {contaminationQuery.data.incidentEquipment?.status || 'OPERATIONAL'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-fg-muted">Exposed Samples:</span>
                    <span className="font-semibold text-rose-400">{contaminationQuery.data.affectedSamplesCount} Specimens</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-fg-muted">At-Risk Patients:</span>
                    <span className="font-semibold text-amber-400">{contaminationQuery.data.affectedPatientsCount} Individuals</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-fg-muted">Traversal Speed:</span>
                    <span className="font-mono text-emerald-400">{contaminationQuery.data.executionTimeMs} ms</span>
                  </div>
                </div>
              )}
            </Surface>

            <div className="lg:col-span-2 flex flex-col gap-4">
              <Surface className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-14 font-semibold text-fg">
                    Exposed Specimens & Patients at Risk
                  </h4>
                  <Badge tone="accent">Cypher: (eq)&lt;-[PROCESSED_ON]-(s)&lt;-[PROVIDED]-(p)</Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-hairline text-fg-muted">
                        <th className="pb-2 font-medium">Sample No</th>
                        <th className="pb-2 font-medium">Specimen Type</th>
                        <th className="pb-2 font-medium">Patient Name</th>
                        <th className="pb-2 font-medium">Affected Tests</th>
                        <th className="pb-2 font-medium">Action Required</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {contaminationQuery.data?.exposedSamples?.map((sample, i) => (
                        <tr key={i} className="hover:bg-fg/5 transition-colors">
                          <td className="py-2.5 font-mono text-rose-400">{sample.sampleNo}</td>
                          <td className="py-2.5 text-fg">{sample.type}</td>
                          <td className="py-2.5 font-medium text-fg">{sample.patientName}</td>
                          <td className="py-2.5 text-fg-muted">{sample.testAffected || 'Biochemistry Panel'}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded text-10 font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              Recall & Re-sample
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!contaminationQuery.data?.exposedSamples || contaminationQuery.data.exposedSamples.length === 0) && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-fg-muted">
                            No specimen contamination detected for this analyzer.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {contaminationQuery.data?.involvedStaff && contaminationQuery.data.involvedStaff.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-hairline">
                    <span className="text-xs font-semibold text-fg block mb-2">Operating Laboratory Personnel (Shift Audit):</span>
                    <div className="flex flex-wrap gap-2">
                      {contaminationQuery.data.involvedStaff.map((staff, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs">
                          <Users className="h-3.5 w-3.5 text-purple-400" />
                          <span className="font-medium text-fg">{staff.name}</span>
                          <span className="text-fg-muted">({staff.role})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Surface>

              <Surface className="p-4 bg-bg border border-hairline font-mono text-xs text-emerald-400">
                <div className="text-fg-muted text-11 mb-1 font-sans font-medium uppercase tracking-wider flex items-center justify-between">
                  <span>Executed Cypher Traversal</span>
                  <span className="text-emerald-500 font-mono">2 hops index-free</span>
                </div>
                <code>{contaminationQuery.data?.cypherQuery || `MATCH (eq:Equipment {id: '${selectedEquipment}'})<-[:PROCESSED_ON]-(s:Sample)<-[:PROVIDED]-(p:Patient) RETURN eq, collect(s), collect(p)`}</code>
              </Surface>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: MULTI-GENERATIONAL HEREDITARY RISK & PEDIGREES */}
        <TabsContent value="hereditary" className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Surface className="p-5 flex flex-col gap-4">
              <div>
                <h3 className="text-15 font-semibold text-fg flex items-center gap-2">
                  <Dna className="h-4 w-4 text-purple-400" />
                  Familial Pedigree Explorer
                </h3>
                <p className="text-xs text-fg-muted mt-1">
                  Evaluates recursive multi-generational family trees to identify inherited disease vulnerabilities and recommend preventative screening.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-fg-muted mb-1 block">Index Patient</label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger className="w-full text-13">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P-1001">P-1001 (Eleanor Vance - Maternal Index)</SelectItem>
                    <SelectItem value="P-1002">P-1002 (Thomas Vance - Offspring)</SelectItem>
                    <SelectItem value="P-1004">P-1004 (Marcus Brody - Independent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hereditaryQuery.data && (
                <div className="flex flex-col gap-3 pt-3 border-t border-hairline text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-fg-muted">Index Profile:</span>
                    <Badge tone="danger">{hereditaryQuery.data.indexPatient?.riskProfile || 'High Risk'}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-fg-muted">Identified Pedigree Relatives:</span>
                    <span className="font-semibold text-purple-400">{hereditaryQuery.data.familyMembersCount} Relatives</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-fg-muted">Recursive Depth:</span>
                    <span className="font-mono text-emerald-400">1..2 hops (Parent / Sibling / Child)</span>
                  </div>
                </div>
              )}
            </Surface>

            <div className="lg:col-span-2 flex flex-col gap-4">
              <Surface className="p-5">
                <h4 className="text-14 font-semibold text-fg mb-3">
                  Inherited Risk Assessment & Recommended Screenings
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {hereditaryQuery.data?.relatives?.map((relative, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-hairline bg-surface flex flex-col justify-between gap-3 hover:border-purple-500/40 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-14 text-fg">{relative.name}</div>
                          <div className="text-xs text-purple-400 font-medium mt-0.5">
                            {relative.relation} &bull; Blood {relative.bloodGroup}
                          </div>
                        </div>
                        <Badge tone={relative.inheritedRiskLevel?.includes('High') ? 'danger' : 'warning'}>
                          {relative.inheritedRiskLevel}
                        </Badge>
                      </div>

                      <div className="border-t border-hairline pt-3">
                        <span className="text-11 font-medium text-fg-muted block mb-1.5">
                          Uncompleted Preventive Screenings:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {relative.recommendedScreenings?.map((testName, tidx) => (
                            <span
                              key={tidx}
                              className="px-2 py-0.5 rounded text-10 font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            >
                              {testName}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Surface>

              <Surface className="p-4 bg-bg border border-hairline font-mono text-xs text-emerald-400">
                <div className="text-fg-muted text-11 mb-1 font-sans font-medium uppercase tracking-wider">
                  Pedigree Cypher Query
                </div>
                <code>{hereditaryQuery.data?.cypherQuery || `MATCH (p:Patient {id: '${selectedPatient}'})-[f:FAMILY_MEMBER_OF*1..2]-(relative:Patient) RETURN p, relative, f`}</code>
              </Surface>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: DIAGNOSTIC TEST CO-OCCURRENCE KNOWLEDGE GRAPH */}
        <TabsContent value="knowledge" className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Surface className="p-5 flex flex-col gap-4">
              <div>
                <h3 className="text-15 font-semibold text-fg flex items-center gap-2">
                  <Network className="h-4 w-4 text-cyan-400" />
                  Diagnostic Co-Occurrence Network
                </h3>
                <p className="text-xs text-fg-muted mt-1">
                  Discovers diagnostic affinity and test bundling patterns across multiple clinical encounters, highlighting multi-specialty testing panels.
                </p>
              </div>
            </Surface>

            <div className="lg:col-span-2">
              <Surface className="p-5">
                <h4 className="text-14 font-semibold text-fg mb-3">
                  High-Frequency Test Bundling Correlations
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-hairline text-fg-muted">
                        <th className="pb-2 font-medium">Primary Test (A)</th>
                        <th className="pb-2 font-medium">Co-Ordered Test (B)</th>
                        <th className="pb-2 font-medium">Clinical Category</th>
                        <th className="pb-2 font-medium">Co-Occurrence Frequency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {coOccurrenceQuery.data?.map((pair, i) => (
                        <tr key={i} className="hover:bg-fg/5 transition-colors">
                          <td className="py-2.5 font-medium text-fg">{pair.testA}</td>
                          <td className="py-2.5 font-medium text-fg">{pair.testB}</td>
                          <td className="py-2.5 text-fg-muted">{pair.category}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              {pair.frequency} orders
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Surface>
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: LIVE CYPHER PLAYGROUND */}
        <TabsContent value="cypher" className="flex flex-col gap-6">
          <Surface className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-15 font-semibold text-fg flex items-center gap-2">
                  <Play className="h-4 w-4 text-emerald-400" />
                  Live Cypher Query Execution Console
                </h3>
                <p className="text-xs text-fg-muted mt-1">
                  Demonstrate live Cypher pattern-matching queries directly against the Neo4j engine with execution timing.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRunCypher()}
                  disabled={isRunningCypher}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Play className={`h-3.5 w-3.5 ${isRunningCypher ? 'animate-spin' : ''}`} />
                  Execute Cypher
                </Button>
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-fg-muted block mb-1.5">Preset Evaluation Queries:</span>
              <div className="flex flex-wrap gap-2">
                {PRESET_QUERIES.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCustomCypher(preset.query)
                      void handleRunCypher(preset.query)
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg border border-hairline bg-surface hover:bg-fg/5 text-fg-muted hover:text-fg transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <textarea
                value={customCypher}
                onChange={(e) => setCustomCypher(e.target.value)}
                rows={4}
                className="w-full font-mono text-13 bg-bg border border-hairline rounded-lg p-3 text-emerald-400 focus:outline-none focus:border-emerald-500 resize-none"
                placeholder="Enter Cypher query (e.g. MATCH (n) RETURN n LIMIT 10)..."
              />
            </div>

            {cypherResult && (
              <div className="flex flex-col gap-2 pt-3 border-t border-hairline">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-fg">
                    Query Results ({cypherResult.recordsCount ?? cypherResult.records?.length ?? 0} records returned)
                  </span>
                  <span className="font-mono text-emerald-400">
                    Execution Latency: {cypherResult.executionTimeMs} ms
                  </span>
                </div>

                {cypherResult.error ? (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs">
                    {cypherResult.error}
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-72 border border-hairline rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-bg text-fg-muted border-b border-hairline sticky top-0">
                        <tr>
                          {cypherResult.records?.[0] &&
                            Object.keys(cypherResult.records[0]).map((key) => (
                              <th key={key} className="p-2.5 font-medium font-mono text-11">
                                {key}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {cypherResult.records?.map((row, i) => (
                          <tr key={i} className="hover:bg-fg/5">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="p-2.5 font-mono text-11 text-fg">
                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </Surface>
        </TabsContent>
      </Tabs>

      {/* INTERACTIVE SUBGRAPH VISUALIZER */}
      <Surface className="p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-15 font-semibold text-fg flex items-center gap-2">
              <Share2 className="h-4 w-4 text-amber-400" />
              Interactive Clinical Knowledge Graph Explorer
            </h3>
            <p className="text-xs text-fg-muted mt-0.5">
              Visual representation of direct memory pointer adjacencies between Patients, Samples, Equipment, Staff, and Tests.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-fg-muted">Filter:</span>
            <Select value={nodeTypeFilter} onValueChange={setNodeTypeFilter}>
              <SelectTrigger className="w-44 h-8 text-xs bg-bg">
                <SelectValue placeholder="All Entity Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entity Types</SelectItem>
                <SelectItem value="patient">Patients Only</SelectItem>
                <SelectItem value="sample">Samples Only</SelectItem>
                <SelectItem value="equipment">Equipment Only</SelectItem>
                <SelectItem value="test">Tests Only</SelectItem>
                <SelectItem value="staff">Staff Only</SelectItem>
                <SelectItem value="doctor">Doctors Only</SelectItem>
                <SelectItem value="laboratory">Laboratories Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs border-y border-hairline py-2.5">
          <span className="text-fg-muted font-medium text-11">NODE TYPES:</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Patient</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Sample</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Equipment</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Staff</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Diagnostic Test</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> Doctor</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Laboratory</span>
        </div>

        <div className="relative w-full h-[480px] bg-bg/80 border border-hairline rounded-xl overflow-hidden flex items-center justify-center">
          {networkQuery.isLoading ? (
            <div className="flex flex-col items-center gap-2 text-fg-muted text-xs">
              <RefreshCw className="h-6 w-6 animate-spin text-accent" />
              <span>Loading graph topology from Neo4j AuraDB...</span>
            </div>
          ) : networkQuery.isError ? (
            <div className="flex flex-col items-center gap-2 text-xs text-rose-400 p-4 text-center">
              <span className="font-semibold">Failed to load graph network</span>
              <span className="text-11 text-fg-muted font-mono max-w-md">{String(networkQuery.error)}</span>
              <Button size="sm" variant="secondary" onClick={() => networkQuery.refetch()}>
                Retry
              </Button>
            </div>
          ) : filteredNodes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-fg-muted text-xs">
              <span>No nodes found matching filter.</span>
            </div>
          ) : (
            <svg className="w-full h-full" viewBox="0 0 800 480">
              {networkData?.links?.map((link, i) => {
                const src = nodePositions.get(link.source)
                const tgt = nodePositions.get(link.target)
                if (!src || !tgt) return null

                const activeId = selectedNode?.id || hoveredNodeId
                const isHighlighted = activeId && (activeId === link.source || activeId === link.target)

                return (
                  <g key={i}>
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke={isHighlighted ? '#3b82f6' : '#334155'}
                      strokeWidth={isHighlighted ? 2.5 : 1}
                      strokeDasharray={link.type === 'FAMILY_MEMBER_OF' ? '4 2' : undefined}
                      opacity={isHighlighted ? 1 : 0.6}
                    />
                    {isHighlighted && (
                      <text
                        x={(src.x + tgt.x) / 2}
                        y={(src.y + tgt.y) / 2 - 4}
                        fill="#94a3b8"
                        fontSize="9"
                        textAnchor="middle"
                        className="font-mono select-none"
                      >
                        {link.label}
                      </text>
                    )}
                  </g>
                )
              })}

              {filteredNodes.map((node) => {
                const pos = nodePositions.get(node.id)
                if (!pos) return null
                const col = getNodeColor(node.type)
                const isSelected = selectedNode?.id === node.id
                const isHovered = hoveredNodeId === node.id

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer select-none"
                    onClick={() => setSelectedNode(node)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                  >
                    {/* Generous hit target area so mouse movement never loses hover */}
                    <circle r={22} fill="transparent" pointerEvents="all" />

                    {/* Smoothly expanding node circle */}
                    <circle
                      r={isSelected ? 16 : isHovered ? 15 : 12}
                      fill={col.fill}
                      stroke={isSelected ? '#ffffff' : isHovered ? '#f8fafc' : col.stroke}
                      strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                      className="transition-all duration-150 drop-shadow-sm"
                    />
                    <text
                      y={22}
                      textAnchor="middle"
                      fill={isSelected || isHovered ? '#ffffff' : '#cbd5e1'}
                      fontSize={isHovered ? '11' : '10'}
                      fontWeight={isSelected || isHovered ? '600' : '500'}
                      className="select-none pointer-events-none drop-shadow transition-all duration-150"
                    >
                      {node.label?.length > 18 ? node.label.slice(0, 16) + '...' : node.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          )}

          {selectedNode && (
            <div className="absolute bottom-4 right-4 max-w-sm p-4 rounded-xl bg-surface/95 backdrop-blur border border-hairline shadow-xl text-xs flex flex-col gap-2 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-fg text-13">{selectedNode.label}</span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-fg-muted hover:text-fg text-14 font-bold"
                >
                  &times;
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-10 font-semibold border ${getNodeColor(selectedNode.type).bg}`}>
                  {selectedNode.type}
                </span>
                <span className="font-mono text-11 text-fg-muted">ID: {selectedNode.id}</span>
              </div>
              <div className="border-t border-hairline pt-2 flex flex-col gap-1 text-fg-muted text-11">
                {Object.entries(selectedNode)
                  .filter(([k]) => !['_id', '_labels', 'id', 'label', 'type', 'group'].includes(k))
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="capitalize">{k}:</span>
                      <span className="text-fg font-medium">{String(v)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </Surface>
    </div>
  )
}
