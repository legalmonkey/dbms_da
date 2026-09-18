import { useQuery } from '@tanstack/react-query'
import { FileText, FlaskConical } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { EmptyState } from '@/components/data/EmptyState'
import { usePatientScope } from '@/hooks/usePatientScope'
import { QueryState } from '@/components/data/QueryState'
import { Table, TableWrap, Td, Th, Tr } from '@/components/data/Table'
import { OrderStatusBadge, SampleStatusBadge } from '@/components/domain/StatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Surface, SurfaceHeader } from '@/components/ui/Surface'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { getOrderById, getReports, getSamples } from '@/services'

/** Module 1: a single TestOrder with its lines, samples and report link. */
export function OrderDetailPage() {
  const { orderId = '' } = useParams()
  const { canView } = usePatientScope()

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId),
    enabled: Boolean(orderId),
  })

  const samplesQuery = useQuery({
    queryKey: ['samples', { orderId }],
    queryFn: () => getSamples({ orderId, pageSize: 50 }),
    enabled: Boolean(orderId),
  })

  const reportsQuery = useQuery({
    queryKey: ['reports', { orderId }],
    queryFn: () => getReports({ q: orderId, pageSize: 10 }),
    enabled: Boolean(orderId),
  })

  const report = reportsQuery.data?.data.find((row) => row.Order_ID === orderId)

  return (
    <div className="flex flex-col gap-5">
      <QueryState query={orderQuery}>
        {(order) => !canView(order.Patient_ID) ? <Navigate to="/403" replace /> : (
          <>
            <PageHeader
              title={`Order ${order.Order_ID}`}
              breadcrumbs={[{ label: 'Test orders', to: '/orders' }, { label: order.Order_ID }]}
              meta={<OrderStatusBadge status={order.Status} />}
              description={
                <>
                  Booked {formatDate(order.Order_Date)} for{' '}
                  <Link
                    to={`/patients/${order.Patient_ID}`}
                    className="text-accent hover:underline underline-offset-2"
                  >
                    {order.Patient_Name}
                  </Link>{' '}
                  ({order.Patient_ID})
                  {order.Doctor_Name ? ` · Referred by ${order.Doctor_Name}, ${order.Specialization}` : ''}
                </>
              }
              actions={
                report ? (
                  <Button variant="primary" asChild>
                    <Link to={`/reports/${report.Report_ID}`}>
                      <FileText />
                      View report
                    </Link>
                  </Button>
                ) : null
              }
            />

            <Surface>
              <SurfaceHeader title="Tests ordered" description="OrderIncludesTest" />
              <TableWrap>
                <Table caption="Tests on this order">
                  <thead>
                    <tr>
                      <Th>Test_ID</Th>
                      <Th>Test_Name</Th>
                      <Th>Category</Th>
                      <Th numeric>Price</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.Tests.map((line) => (
                      <Tr key={line.Test_ID}>
                        <Td className="font-mono text-xs">{line.Test_ID}</Td>
                        <Td className="font-medium text-fg">{line.Test_Name}</Td>
                        <Td>
                          <Badge tone={line.Test_Category === 'Pathology' ? 'info' : 'teal'}>
                            {line.Test_Category}
                          </Badge>
                        </Td>
                        <Td numeric>{formatCurrency(line.Price)}</Td>
                      </Tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <Td className="font-medium" />
                      <Td className="font-medium">Total</Td>
                      <Td />
                      <Td numeric className="text-base font-semibold">
                        {formatCurrency(order.Total_Price)}
                      </Td>
                    </tr>
                  </tfoot>
                </Table>
              </TableWrap>
            </Surface>

            <Surface>
              <SurfaceHeader title="Samples" description="Collected against this order." />
              <QueryState
                query={samplesQuery}
                isEmpty={(data) => data.data.length === 0}
                empty={
                  <EmptyState
                    icon={FlaskConical}
                    title="No samples collected yet"
                    description="The lab technician records collection from the Sample intake screen."
                    compact
                  />
                }
              >
                {(data) => (
                  <TableWrap>
                    <Table caption="Samples for this order">
                      <thead>
                        <tr>
                          <Th>Sample_No</Th>
                          <Th>Sample_Type</Th>
                          <Th>Collected</Th>
                          <Th>Laboratory</Th>
                          <Th>Technician</Th>
                          <Th>Status</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.data.map((sample) => (
                          <Tr key={`${sample.Order_ID}-${sample.Sample_No}`}>
                            <Td className="font-mono text-xs">{sample.Sample_No}</Td>
                            <Td>{sample.Sample_Type}</Td>
                            <Td>{formatDateTime(sample.Collection_DateTime)}</Td>
                            <Td className="text-fg-secondary">{sample.Lab_Name}</Td>
                            <Td className="text-fg-secondary">{sample.Tech_Name}</Td>
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
          </>
        )}
      </QueryState>
    </div>
  )
}
