import { useQuery } from '@tanstack/react-query'
import { CalendarClock, ClipboardCheck, FlaskConical, PackageCheck, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/data/EmptyState'
import { QueryState } from '@/components/data/QueryState'
import { Table, TableWrap, Td, Th, Tr } from '@/components/data/Table'
import { SampleStatusBadge } from '@/components/domain/StatusBadge'
import { Breakdown } from '@/components/workspace/Breakdown'
import { MetricTile } from '@/components/workspace/MetricTile'
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Surface, SurfaceHeader } from '@/components/ui/Surface'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, formatDateTime } from '@/lib/format'
import { getOrders, getSamples, getWorkspaceSummary } from '@/services'
import { SAMPLE_STATUSES } from '@/types'

const SAMPLE_BAR: Record<string, string> = {
  Collected: 'bg-info',
  'In Transit': 'bg-[var(--teal)]',
  Received: 'bg-success',
  Rejected: 'bg-danger',
}

/** Lab technician workspace: what needs collecting, and what has been collected. */
export function TechnicianWorkspacePage() {
  const { session } = useAuth()
  const techId = session?.user.techId

  const summaryQuery = useQuery({ queryKey: ['workspace-summary'], queryFn: getWorkspaceSummary })
  const queueQuery = useQuery({
    queryKey: ['orders', { status: 'Pending', scope: 'collection-queue' }],
    queryFn: () => getOrders({ status: 'Pending', pageSize: 8, sort: 'Order_Date', order: 'asc' }),
  })
  const collectionsQuery = useQuery({
    queryKey: ['samples', { techId, scope: 'workspace' }],
    queryFn: () => getSamples({ techId, pageSize: 6 }),
  })

  const summary = summaryQuery.data
  const sampleTotal = summary ? Object.values(summary.Samples_By_Status).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader
        eyebrow="Lab technician workspace"
        title="Sample collection"
        description="Orders awaiting collection, and the samples you have logged against them."
        meta={
          session ? (
            <>
              <Badge tone="accent">{session.user.name}</Badge>
              {techId ? <Badge className="font-mono">Tech_ID {techId}</Badge> : null}
            </>
          ) : null
        }
        actions={
          <Button variant="primary" asChild>
            <Link to="/samples">
              <FlaskConical />
              Open sample intake
            </Link>
          </Button>
        }
      />

      <section aria-label="Key figures" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Awaiting collection"
          value={summary?.Orders_By_Status.Pending}
          icon={ClipboardCheck}
          tone="warning"
          hint="Orders with no sample yet"
        />
        <MetricTile
          label="Collected, last 7 days"
          value={summary?.Samples_Last_7_Days}
          icon={CalendarClock}
          tone="accent"
        />
        <MetricTile label="In transit" value={summary?.Samples_By_Status['In Transit']} icon={Truck} tone="accent" />
        <MetricTile
          label="Received at lab"
          value={summary?.Samples_By_Status.Received}
          icon={PackageCheck}
          tone="success"
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Surface>
          <SurfaceHeader title="Collection queue" description="Pending orders, oldest first." />
          <QueryState
            query={queueQuery}
            isEmpty={(data) => data.data.length === 0}
            empty={
              <EmptyState
                icon={ClipboardCheck}
                title="No orders awaiting collection"
                description="Every booked order has at least one sample logged."
                compact
              />
            }
          >
            {(data) => (
              <TableWrap>
                <Table caption="Orders awaiting sample collection">
                  <thead>
                    <tr>
                      <Th>Order_ID</Th>
                      <Th>Patient</Th>
                      <Th>Order_Date</Th>
                      <Th numeric>Tests</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((order) => (
                      <Tr key={order.Order_ID}>
                        <Td className="font-mono text-xs">{order.Order_ID}</Td>
                        <Td>
                          <span className="font-medium text-fg">{order.Patient_Name}</span>
                          <span className="ml-2 font-mono text-2xs text-fg-muted">{order.Patient_ID}</span>
                        </Td>
                        <Td>{formatDate(order.Order_Date)}</Td>
                        <Td numeric>{order.Tests.length}</Td>
                        <Td className="text-right">
                          <Button size="sm" variant="primary" asChild>
                            <Link to={`/samples?orderId=${order.Order_ID}`}>Record collection</Link>
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </QueryState>
        </Surface>

        <Surface className="self-start">
          <SurfaceHeader title="Samples by status" description="Across all laboratories." />
          <QueryState query={summaryQuery}>
            {(data) => (
              <Breakdown
                total={sampleTotal}
                rows={SAMPLE_STATUSES.map((status) => ({
                  key: status,
                  label: <SampleStatusBadge status={status} />,
                  value: data.Samples_By_Status[status],
                  barClassName: SAMPLE_BAR[status] ?? 'bg-accent',
                }))}
              />
            )}
          </QueryState>
        </Surface>
      </div>

      <Surface>
        <SurfaceHeader
          title={techId ? 'My recent collections' : 'Recent collections'}
          actions={
            <Button size="sm" variant="ghost" asChild>
              <Link to="/samples">View sample log</Link>
            </Button>
          }
        />
        <QueryState
          query={collectionsQuery}
          isEmpty={(data) => data.data.length === 0}
          empty={<EmptyState icon={FlaskConical} title="No samples logged yet" compact />}
        >
          {(data) => (
            <TableWrap>
              <Table caption="Recently collected samples">
                <thead>
                  <tr>
                    <Th>Sample_No</Th>
                    <Th>Order_ID</Th>
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
                      <Td>{sample.Sample_Type}</Td>
                      <Td className="whitespace-nowrap">{formatDateTime(sample.Collection_DateTime)}</Td>
                      <Td className="text-fg-secondary">{sample.Lab_Name}</Td>
                      <Td>
                        <SampleStatusBadge status={sample.Status} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </QueryState>
      </Surface>
    </div>
  )
}
