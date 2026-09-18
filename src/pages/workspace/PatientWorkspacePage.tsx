import { useQuery } from '@tanstack/react-query'
import { ClipboardList, FileText, Phone, Plus, Timer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/data/EmptyState'
import { QueryState } from '@/components/data/QueryState'
import { Table, TableWrap, Td, Th, Tr } from '@/components/data/Table'
import { OrderStatusBadge } from '@/components/domain/StatusBadge'
import { MetricTile } from '@/components/workspace/MetricTile'
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Surface, SurfaceHeader } from '@/components/ui/Surface'
import { useAuth } from '@/hooks/useAuth'
import { formatAge, formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { getOrders, getPatientById, getReports } from '@/services'
import { GENDER_LABELS, countByRemark, patientFullName } from '@/types'

/**
 * Patient workspace: one person's own record.
 *
 * Every query here is scoped to the signed-in Patient_ID. The route is also
 * restricted to the patient role, so another role cannot open it and see an
 * empty or borrowed record.
 */
export function PatientWorkspacePage() {
  const { session } = useAuth()
  const patientId = session?.user.patientId ?? ''

  const patientQuery = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => getPatientById(patientId),
    enabled: Boolean(patientId),
  })
  const ordersQuery = useQuery({
    queryKey: ['orders', { patientId, scope: 'workspace' }],
    queryFn: () => getOrders({ patientId, pageSize: 100 }),
    enabled: Boolean(patientId),
  })
  const reportsQuery = useQuery({
    queryKey: ['reports', { patientId, scope: 'workspace' }],
    queryFn: () => getReports({ patientId, pageSize: 100 }),
    enabled: Boolean(patientId),
  })

  const orders = ordersQuery.data?.data ?? []
  const inProgress = orders.filter((o) => o.Status === 'Pending' || o.Status === 'Processing').length

  return (
    <div className="flex flex-col gap-6">
      <QueryState query={patientQuery}>
        {(patient) => (
          <WorkspaceHeader
            eyebrow="Patient workspace"
            title="My health record"
            description={`${patientFullName(patient)}. Orders, sample progress and issued reports in one place.`}
            meta={
              <>
                <Badge tone="accent" className="font-mono">
                  {patient.Patient_ID}
                </Badge>
                <Badge>{formatAge(patient.DOB)}</Badge>
                <Badge>{GENDER_LABELS[patient.Gender]}</Badge>
              </>
            }
            actions={
              <Button variant="primary" asChild>
                <Link to="/orders/new">
                  <Plus />
                  Book tests
                </Link>
              </Button>
            }
          />
        )}
      </QueryState>

      <section aria-label="Key figures" className="grid gap-3 sm:grid-cols-3">
        <MetricTile
          label="Orders placed"
          value={ordersQuery.data?.total}
          icon={ClipboardList}
          tone="accent"
        />
        <MetricTile
          label="In progress"
          value={ordersQuery.data ? inProgress : undefined}
          icon={Timer}
          tone="warning"
          hint="Booked or with samples at the lab"
        />
        <MetricTile
          label="Reports available"
          value={reportsQuery.data?.total}
          icon={FileText}
          tone="success"
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Surface>
            <SurfaceHeader title="My orders" description="Most recent first." />
            <QueryState
              query={ordersQuery}
              isEmpty={(data) => data.data.length === 0}
              empty={
                <EmptyState
                  icon={ClipboardList}
                  title="No orders yet"
                  description="Book a test to start your record."
                  compact
                />
              }
            >
              {(data) => (
                <TableWrap>
                  <Table caption="My test orders">
                    <thead>
                      <tr>
                        <Th>Order_ID</Th>
                        <Th>Order_Date</Th>
                        <Th>Tests</Th>
                        <Th>Status</Th>
                        <Th numeric>Total</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.data.slice(0, 8).map((order) => (
                        <Tr key={order.Order_ID}>
                          <Td className="font-mono text-xs">
                            <Link
                              to={`/orders/${order.Order_ID}`}
                              className="text-accent underline-offset-2 hover:underline"
                            >
                              {order.Order_ID}
                            </Link>
                          </Td>
                          <Td>{formatDate(order.Order_Date)}</Td>
                          <Td className="max-w-56 truncate text-fg-secondary">
                            {order.Tests.map((test) => test.Test_Name).join(', ')}
                          </Td>
                          <Td>
                            <OrderStatusBadge status={order.Status} />
                          </Td>
                          <Td numeric>{formatCurrency(order.Total_Price)}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              )}
            </QueryState>
          </Surface>

          <Surface>
            <SurfaceHeader title="My reports" description="Issued and authorised by a pathologist." />
            <QueryState
              query={reportsQuery}
              isEmpty={(data) => data.data.length === 0}
              empty={
                <EmptyState
                  icon={FileText}
                  title="No reports issued yet"
                  description="Reports appear here once your results are verified."
                  compact
                />
              }
            >
              {(data) => (
                <TableWrap>
                  <Table caption="My diagnostic reports">
                    <thead>
                      <tr>
                        <Th>Report_ID</Th>
                        <Th>Report_Date</Th>
                        <Th>Findings</Th>
                        <Th />
                      </tr>
                    </thead>
                    <tbody>
                      {data.data.map((report) => {
                        const flagged =
                          countByRemark(report.Results, 'Elevated') + countByRemark(report.Results, 'Critical')
                        return (
                          <Tr key={report.Report_ID}>
                            <Td className="font-mono text-xs">{report.Report_ID}</Td>
                            <Td>{report.Report_Date ? formatDateTime(report.Report_Date) : '-'}</Td>
                            <Td>
                              {flagged > 0 ? (
                                <Badge tone="warning">{flagged} outside normal range</Badge>
                              ) : (
                                <Badge tone="success">All within normal range</Badge>
                              )}
                            </Td>
                            <Td className="text-right">
                              <Button size="sm" asChild>
                                <Link to={`/reports/${report.Report_ID}`}>View report</Link>
                              </Button>
                            </Td>
                          </Tr>
                        )
                      })}
                    </tbody>
                  </Table>
                </TableWrap>
              )}
            </QueryState>
          </Surface>
        </div>

        <Surface className="self-start">
          <SurfaceHeader title="Personal details" description="Patient and Patient_Contact" />
          <QueryState query={patientQuery}>
            {(patient) => (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 p-4 text-13">
                <dt className="text-fg-muted">Name</dt>
                <dd className="font-medium text-fg">{patientFullName(patient)}</dd>
                <dt className="text-fg-muted">DOB</dt>
                <dd>{formatDate(patient.DOB)}</dd>
                <dt className="text-fg-muted">Gender</dt>
                <dd>{GENDER_LABELS[patient.Gender]}</dd>
                <dt className="text-fg-muted">Contact</dt>
                <dd className="flex flex-col gap-1">
                  {patient.Contacts.map((contact, index) => (
                    <span key={`${contact.Contact_No}-${index}`} className="inline-flex items-center gap-1.5 font-mono">
                      <Phone className="size-3 text-fg-muted" aria-hidden="true" />
                      {contact.Contact_No}
                    </span>
                  ))}
                </dd>
              </dl>
            )}
          </QueryState>
        </Surface>
      </div>
    </div>
  )
}
