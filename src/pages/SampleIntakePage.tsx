import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FlaskConical, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '@/components/data/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { Pagination } from '@/components/data/Pagination'
import { QueryState } from '@/components/data/QueryState'
import { Table, TableWrap, Td, Th, Tr } from '@/components/data/Table'
import { OrderStatusBadge, SampleStatusBadge } from '@/components/domain/StatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { Surface, SurfaceHeader } from '@/components/ui/Surface'
import { useToast } from '@/components/ui/Toast'
import { formatDateTime } from '@/lib/format'
import {
  createSample,
  getLabLocations,
  getOrderById,
  getSamples,
  getStaff,
} from '@/services'
import {
  SAMPLE_STATUSES,
  SAMPLE_TYPES,
  type SampleStatus,
  type SampleType,
  isTechnician,
  labOptionLabel,
  nextSampleNo,
  technicianOptionLabel,
} from '@/types'

const PAGE_SIZE = 10

/** Local datetime string for the collection picker, e.g. 2026-09-15T10:42. */
const nowLocal = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 16)
}

/** Module 2: sample collection and intake. */
export function SampleIntakePage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { session } = useAuth()
  const [searchParams] = useSearchParams()

  // Arriving from the technician workspace queue pre-selects the order, and a
  // technician session pre-selects itself as the collecting technician.
  const presetOrderId = (searchParams.get('orderId') ?? '').toUpperCase()

  const [lookup, setLookup] = useState(presetOrderId)
  const [orderId, setOrderId] = useState(presetOrderId)
  const [sampleNo, setSampleNo] = useState('S1')
  const [sampleType, setSampleType] = useState<SampleType>('Whole Blood')
  const [collectedAt, setCollectedAt] = useState(nowLocal)
  const [labId, setLabId] = useState('')
  const [techId, setTechId] = useState(session?.user.techId ?? '')
  const [status, setStatus] = useState<SampleStatus>('Collected')
  const [submitted, setSubmitted] = useState(false)
  const [page, setPage] = useState(1)

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId),
    enabled: Boolean(orderId),
    retry: false,
  })

  const orderSamplesQuery = useQuery({
    queryKey: ['samples', { orderId }],
    queryFn: () => getSamples({ orderId, pageSize: 50 }),
    enabled: Boolean(orderId),
  })

  const labsQuery = useQuery({ queryKey: ['laboratories'], queryFn: getLabLocations })
  const staffQuery = useQuery({ queryKey: ['staff', 'Technician'], queryFn: () => getStaff({ role: 'Technician' }) })
  const logQuery = useQuery({
    queryKey: ['samples', 'log', page],
    queryFn: () => getSamples({ page, pageSize: PAGE_SIZE }),
  })

  // Suggest the next sequence number once the order's samples are known.
  useEffect(() => {
    if (orderSamplesQuery.data) setSampleNo(nextSampleNo(orderSamplesQuery.data.data))
  }, [orderSamplesQuery.data])

  const technicians = (staffQuery.data ?? []).filter(isTechnician)

  const mutation = useMutation({
    mutationFn: () =>
      createSample({
        Order_ID: orderId,
        Sample_No: sampleNo,
        Sample_Type: sampleType,
        Collection_DateTime: new Date(collectedAt).toISOString(),
        Lab_ID: labId,
        Tech_ID: techId,
        Status: status,
      }),
    onSuccess: (sample) => {
      void queryClient.invalidateQueries({ queryKey: ['samples'] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      void queryClient.invalidateQueries({ queryKey: ['pending-results'] })
      toast({
        tone: 'success',
        title: `Sample ${sample.Sample_No} logged`,
        description: `${sample.Sample_Type} for order ${sample.Order_ID}`,
      })
      setSubmitted(false)
    },
    onError: (error) =>
      toast({ tone: 'error', title: 'Could not record the sample', description: String(error) }),
  })

  const order = orderQuery.data
  const errors = {
    order: submitted && !order ? 'Look up a valid order first' : undefined,
    lab: submitted && !labId ? 'Select the processing laboratory' : undefined,
    tech: submitted && !techId ? 'Select the collecting technician' : undefined,
  }

  const submit = () => {
    setSubmitted(true)
    if (!order || !labId || !techId) return
    mutation.mutate()
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Sample intake"
        description="Record collection against an order and assign it to a laboratory and technician."
      />

      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* --- Collection form ------------------------------------------ */}
        <div className="flex flex-col gap-4">
          <Surface>
            <SurfaceHeader title="Order lookup" description="Find the order the sample belongs to." />
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-end gap-2">
                <Field className="flex-1" label="Order_ID" error={errors.order}>
                  <Input
                    placeholder="e.g. O0012"
                    leading={<Search />}
                    value={lookup}
                    onChange={(event) => setLookup(event.target.value.toUpperCase())}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        setOrderId(lookup.trim())
                      }
                    }}
                  />
                </Field>
                <Button className="mb-0.5" onClick={() => setOrderId(lookup.trim())}>
                  Look up
                </Button>
              </div>

              {orderId && orderQuery.isError ? (
                <p role="alert" className="text-13 text-danger">
                  No order found with ID {orderId}.
                </p>
              ) : null}

              {order ? (
                <div className="rounded-[var(--radius-surface)] border border-hairline bg-surface-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-13 font-medium text-fg">{order.Patient_Name}</span>
                    <OrderStatusBadge status={order.Status} />
                  </div>
                  <p className="mt-1 font-mono text-2xs text-fg-muted">
                    {order.Patient_ID} · {order.Order_ID}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1">
                    {order.Tests.map((test) => (
                      <li key={test.Test_ID}>
                        <Badge tone="neutral">{test.Test_Name}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Surface>

          <Surface>
            <SurfaceHeader title="Sample details" />
            <div className="flex flex-col gap-4 p-4">
              <Field label="Sample_No" hint="Sequence within the order: S1, S2, S3.">
                <Input value={sampleNo} onChange={(event) => setSampleNo(event.target.value)} />
              </Field>

              <Field label="Sample_Type">
                <Select value={sampleType} onValueChange={(value) => setSampleType(value as SampleType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SAMPLE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Collection date and time">
                <Input
                  type="datetime-local"
                  value={collectedAt}
                  max={nowLocal()}
                  onChange={(event) => setCollectedAt(event.target.value)}
                />
              </Field>

              <Field label="Lab_ID" required error={errors.lab}>
                <Select value={labId} onValueChange={setLabId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a laboratory" />
                  </SelectTrigger>
                  <SelectContent>
                    {(labsQuery.data ?? []).map((lab) => (
                      <SelectItem key={lab.Lab_ID} value={lab.Lab_ID}>
                        {labOptionLabel(lab)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Tech_ID" required error={errors.tech}>
                <Select value={techId} onValueChange={setTechId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a technician" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map((tech) => (
                      <SelectItem key={tech.Tech_ID} value={tech.Tech_ID}>
                        {technicianOptionLabel(tech)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Status" hint="Where the tube is right now.">
                <Select value={status} onValueChange={(value) => setStatus(value as SampleStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SAMPLE_STATUSES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Button variant="primary" size="lg" onClick={submit} loading={mutation.isPending}>
                Record collection
              </Button>
            </div>
          </Surface>
        </div>

        {/* --- Sample log ------------------------------------------------ */}
        <Surface className="self-start">
          <SurfaceHeader title="Sample log" description="Every collected sample and where it is being processed." />
          <QueryState
            query={logQuery}
            isEmpty={(data) => data.data.length === 0}
            empty={<EmptyState icon={FlaskConical} title="No samples recorded yet" compact />}
            skeleton={
              <TableWrap>
                <Table>
                  <tbody>
                    <SkeletonRows rows={8} columns={6} />
                  </tbody>
                </Table>
              </TableWrap>
            }
          >
            {(data) => (
              <>
                <TableWrap>
                  <Table caption="Collected samples">
                    <thead>
                      <tr>
                        <Th>Sample_No</Th>
                        <Th>Order_ID</Th>
                        <Th>Patient</Th>
                        <Th>Sample_Type</Th>
                        <Th>Collected</Th>
                        <Th>Laboratory</Th>
                        <Th>Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.data.map((sample) => (
                        <Tr key={`${sample.Order_ID}-${sample.Sample_No}`}>
                          <Td className="font-mono text-xs">{sample.Sample_No}</Td>
                          <Td className="font-mono text-xs">{sample.Order_ID}</Td>
                          <Td>{sample.Patient_Name}</Td>
                          <Td>{sample.Sample_Type}</Td>
                          <Td className="whitespace-nowrap">
                            {formatDateTime(sample.Collection_DateTime)}
                          </Td>
                          <Td className="text-fg-secondary">{sample.Lab_Name}</Td>
                          <Td>
                            <SampleStatusBadge status={sample.Status} />
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
                <Pagination
                  page={data.page}
                  pageSize={data.pageSize}
                  total={data.total}
                  onPageChange={setPage}
                  label="samples"
                />
              </>
            )}
          </QueryState>
        </Surface>
      </div>
    </div>
  )
}
