import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  ClipboardList,
  FileText,
  IndianRupee,
  Microscope,
  Plus,
  TestTubes,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { QueryState } from '@/components/data/QueryState'
import { Table, TableWrap, Td, Th, Tr } from '@/components/data/Table'
import { RemarkIndicator } from '@/components/domain/RemarkIndicator'
import { OrderStatusBadge } from '@/components/domain/StatusBadge'
import { Breakdown } from '@/components/workspace/Breakdown'
import { MetricTile } from '@/components/workspace/MetricTile'
import { ModuleCard } from '@/components/workspace/ModuleCard'
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Surface, SurfaceHeader } from '@/components/ui/Surface'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { getOrders, getWorkspaceSummary } from '@/services'
import { ORDER_STATUSES, REMARKS } from '@/types'

const ORDER_BAR: Record<string, string> = {
  Pending: 'bg-fg-disabled',
  Processing: 'bg-warning',
  Completed: 'bg-success',
  Cancelled: 'bg-danger',
}

const REMARK_BAR: Record<string, string> = {
  Normal: 'bg-fg-disabled',
  Elevated: 'bg-warning',
  Critical: 'bg-danger',
}

/** Administrator workspace: the whole laboratory at a glance. */
export function AdminWorkspacePage() {
  const { session } = useAuth()
  const summaryQuery = useQuery({ queryKey: ['workspace-summary'], queryFn: getWorkspaceSummary })
  const recentQuery = useQuery({
    queryKey: ['orders', 'recent'],
    queryFn: () => getOrders({ pageSize: 6 }),
  })

  const summary = summaryQuery.data
  const orderTotal = summary ? Object.values(summary.Orders_By_Status).reduce((a, b) => a + b, 0) : 0
  const findingTotal = summary
    ? Object.values(summary.Findings_By_Remark).reduce((a, b) => a + b, 0)
    : 0

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader
        eyebrow="Administrator workspace"
        title="Laboratory administration"
        description="Registrations, order flow, reporting, staffing and the test catalogue across every facility."
        meta={
          session ? (
            <>
              <Badge tone="accent">{session.user.name}</Badge>
              {session.user.designation ? <Badge>{session.user.designation}</Badge> : null}
            </>
          ) : null
        }
        actions={
          <>
            <Button asChild>
              <Link to="/patients/new">
                <UserPlus />
                Register patient
              </Link>
            </Button>
            <Button variant="primary" asChild>
              <Link to="/orders/new">
                <Plus />
                Create order
              </Link>
            </Button>
          </>
        }
      />

      <section aria-label="Key figures" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricTile label="Registered patients" value={summary?.Patient_Count} icon={Users} tone="accent" />
        <MetricTile
          label="Orders, last 7 days"
          value={summary?.Orders_Last_7_Days}
          icon={ClipboardList}
          tone="accent"
        />
        <MetricTile
          label="Awaiting results"
          value={summary?.Pending_Results}
          icon={Microscope}
          tone="warning"
          hint="Samples received, values not yet entered"
        />
        <MetricTile label="Reports issued" value={summary?.Reports_Issued} icon={FileText} tone="success" />
        <MetricTile
          label="Revenue booked"
          value={summary?.Revenue_Booked}
          prefix="₹"
          icon={IndianRupee}
          tone="accent"
          hint="Excludes cancelled orders"
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Surface>
          <SurfaceHeader title="Order pipeline" description="Every TestOrder by current status." />
          <QueryState query={summaryQuery}>
            {(data) => (
              <Breakdown
                total={orderTotal}
                rows={ORDER_STATUSES.map((status) => ({
                  key: status,
                  label: <OrderStatusBadge status={status} />,
                  value: data.Orders_By_Status[status],
                  barClassName: ORDER_BAR[status] ?? 'bg-accent',
                }))}
              />
            )}
          </QueryState>
        </Surface>

        <Surface>
          <SurfaceHeader title="Findings on issued reports" description="HasResult rows by Remark." />
          <QueryState query={summaryQuery}>
            {(data) => (
              <Breakdown
                total={findingTotal}
                rows={REMARKS.map((remark) => ({
                  key: remark,
                  label: <RemarkIndicator remark={remark} />,
                  value: data.Findings_By_Remark[remark],
                  barClassName: REMARK_BAR[remark] ?? 'bg-accent',
                }))}
              />
            )}
          </QueryState>
        </Surface>
      </div>

      <section aria-labelledby="modules-heading" className="flex flex-col gap-3">
        <h2 id="modules-heading" className="text-sm font-semibold text-fg">
          Modules
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ModuleCard
            to="/patients"
            title="Patients"
            icon={Users}
            description="Register patients, maintain contact numbers and review order history."
            stat={summary ? `${formatNumber(summary.Patient_Count)} registered` : undefined}
          />
          <ModuleCard
            to="/orders"
            title="Test orders"
            icon={ClipboardList}
            description="Book, track, cancel and remove orders across every status."
            stat={summary ? `${formatNumber(orderTotal)} on file` : undefined}
          />
          <ModuleCard
            to="/catalogue"
            title="Test catalogue"
            icon={TestTubes}
            description="Pathology specimens and radiology modalities, with pricing."
            stat={summary ? `${formatNumber(summary.Test_Count)} tests` : undefined}
          />
          <ModuleCard
            to="/admin/staff"
            title="Staff directory"
            icon={UsersRound}
            description="Technician certifications and pathologist licence numbers."
            stat={summary ? `${formatNumber(summary.Staff_Count)} staff` : undefined}
          />
          <ModuleCard
            to="/admin/labs"
            title="Laboratories"
            icon={Building2}
            description="Processing facilities that samples are assigned to at intake."
            stat={summary ? `${formatNumber(summary.Laboratory_Count)} facilities` : undefined}
          />
          <ModuleCard
            to="/reports"
            title="Diagnostic reports"
            icon={FileText}
            description="Issued reports with pathologist authorisation, ready to print."
            stat={summary ? `${formatNumber(summary.Reports_Issued)} issued` : undefined}
          />
        </div>
      </section>

      <Surface>
        <SurfaceHeader
          title="Recent orders"
          actions={
            <Button size="sm" variant="ghost" asChild>
              <Link to="/orders">View all orders</Link>
            </Button>
          }
        />
        <QueryState query={recentQuery}>
          {(data) => (
            <TableWrap>
              <Table caption="Most recent test orders">
                <thead>
                  <tr>
                    <Th>Order_ID</Th>
                    <Th>Order_Date</Th>
                    <Th>Patient</Th>
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
                          className="text-accent underline-offset-2 hover:underline"
                        >
                          {order.Order_ID}
                        </Link>
                      </Td>
                      <Td>{formatDate(order.Order_Date)}</Td>
                      <Td className="font-medium text-fg">{order.Patient_Name}</Td>
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
  )
}
