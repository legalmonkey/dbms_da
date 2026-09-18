import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Phone, Plus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '@/components/data/EmptyState'
import { QueryState } from '@/components/data/QueryState'
import { Table, TableWrap, Td, Th, Tr } from '@/components/data/Table'
import { OrderStatusBadge } from '@/components/domain/StatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Surface, SurfaceHeader } from '@/components/ui/Surface'
import { useAuth } from '@/hooks/useAuth'
import { formatAge, formatCurrency, formatDate } from '@/lib/format'
import { getOrders, getPatientById } from '@/services'
import { GENDER_LABELS, patientFullName } from '@/types'

/** Module 1: patient profile with the order history timeline. */
export function PatientProfilePage() {
  const { patientId = '' } = useParams()
  const { can } = useAuth()

  const patientQuery = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => getPatientById(patientId),
    enabled: Boolean(patientId),
  })

  const ordersQuery = useQuery({
    queryKey: ['orders', { patientId }],
    queryFn: () => getOrders({ patientId, pageSize: 100 }),
    enabled: Boolean(patientId),
  })

  return (
    <div className="flex flex-col gap-5">
      <QueryState query={patientQuery}>
        {(patient) => (
          <>
            <PageHeader
              title={patientFullName(patient)}
              breadcrumbs={[{ label: 'Patients', to: '/patients' }, { label: patient.Patient_ID }]}
              meta={
                <>
                  <Badge tone="accent" className="font-mono">
                    {patient.Patient_ID}
                  </Badge>
                  <Badge tone="neutral">{formatAge(patient.DOB)}</Badge>
                </>
              }
              description={`${GENDER_LABELS[patient.Gender]} · Born ${formatDate(patient.DOB)}`}
              actions={
                can('order:create') ? (
                  <Button variant="primary" asChild>
                    <Link to={`/orders/new?patientId=${patient.Patient_ID}`}>
                      <Plus />
                      New test order
                    </Link>
                  </Button>
                ) : null
              }
            />

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <Surface className="lg:order-2 lg:col-start-2">
                <SurfaceHeader title="Contact numbers" description="Patient_Contact" />
                <ul className="divide-y divide-hairline">
                  {patient.Contacts.map((contact, index) => (
                    <li
                      key={`${contact.Contact_No}-${index}`}
                      className="flex items-center gap-2 px-4 py-2.5"
                    >
                      <Phone className="size-3.5 shrink-0 text-fg-muted" aria-hidden="true" />
                      <span className="font-mono text-13">{contact.Contact_No}</span>
                      {index === 0 ? (
                        <Badge tone="neutral" className="ml-auto">
                          Primary
                        </Badge>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Surface>

              <Surface className="lg:order-1 lg:col-start-1 lg:row-start-1">
                <SurfaceHeader title="Order history" description="Every TestOrder placed for this patient." />
                <QueryState
                  query={ordersQuery}
                  isEmpty={(data) => data.data.length === 0}
                  empty={
                    <EmptyState
                      icon={ClipboardList}
                      title="No orders yet"
                      description="This patient has not booked any tests."
                      compact
                    />
                  }
                >
                  {(data) => (
                    <TableWrap>
                      <Table caption="Order history">
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
                          {data.data.map((order) => (
                            <Tr key={order.Order_ID}>
                              <Td className="font-mono text-xs">
                                <Link
                                  to={`/orders/${order.Order_ID}`}
                                  className="text-accent hover:underline underline-offset-2"
                                >
                                  {order.Order_ID}
                                </Link>
                              </Td>
                              <Td>{formatDate(order.Order_Date)}</Td>
                              <Td className="max-w-64 truncate text-fg-secondary">
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
            </div>
          </>
        )}
      </QueryState>
    </div>
  )
}
