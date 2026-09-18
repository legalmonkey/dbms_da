import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, ClipboardList, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '@/components/data/ConfirmDialog'
import { EmptyState } from '@/components/data/EmptyState'
import { Pagination } from '@/components/data/Pagination'
import { QueryState } from '@/components/data/QueryState'
import { Table, TableWrap, Td, Th, Tr } from '@/components/data/Table'
import { OrderStatusBadge } from '@/components/domain/StatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { Surface } from '@/components/ui/Surface'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Toast'
import { Tooltip } from '@/components/ui/Tooltip'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate } from '@/lib/format'
import { cancelOrder, deleteOrder, getOrders } from '@/services'
import { ORDER_STATUSES, type OrderStatus, type TestOrder } from '@/types'

const PAGE_SIZE = 12
type Filter = OrderStatus | 'All'
type PendingAction = { order: TestOrder; kind: 'cancel' | 'delete' } | null

/** Module 1 - order tracking dashboard, with cancel and delete. */
export function OrdersPage() {
  const { can, session } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [filter, setFilter] = useState<Filter>('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pending, setPending] = useState<PendingAction>(null)

  // A patient session only ever sees its own orders.
  const scopedPatientId = session?.user.role === 'patient' ? session.user.patientId : undefined
  const canManage = can('order:create')

  const query = useQuery({
    queryKey: ['orders', { filter, search, page, scopedPatientId }],
    queryFn: () =>
      getOrders({
        status: filter === 'All' ? undefined : filter,
        q: search,
        patientId: scopedPatientId,
        page,
        pageSize: PAGE_SIZE,
      }),
  })

  const actionMutation = useMutation<unknown, Error, NonNullable<PendingAction>>({
    mutationFn: ({ order, kind }) =>
      kind === 'cancel' ? cancelOrder(order.Order_ID) : deleteOrder(order.Order_ID),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['samples'] })
      void queryClient.invalidateQueries({ queryKey: ['pending-results'] })
      void queryClient.invalidateQueries({ queryKey: ['reports'] })
      toast({
        tone: 'success',
        title:
          variables.kind === 'cancel'
            ? `Cancelled order ${variables.order.Order_ID}`
            : `Deleted order ${variables.order.Order_ID}`,
      })
      setPending(null)
    },
  })

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Test orders"
        description="Track every TestOrder from booking through to the issued report."
        actions={
          canManage ? (
            <Button variant="primary" asChild>
              <Link to="/orders/new">
                <Plus />
                Create order
              </Link>
            </Button>
          ) : null
        }
      />

      <Surface>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline p-3">
          <Tabs
            value={filter}
            onValueChange={(value) => {
              setFilter(value as Filter)
              setPage(1)
            }}
          >
            <TabsList className="border-b-0">
              <TabsTrigger value="All">All</TabsTrigger>
              {ORDER_STATUSES.map((status) => (
                <TabsTrigger key={status} value={status}>
                  {status}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <label className="sr-only" htmlFor="order-search">
            Search orders
          </label>
          <Input
            id="order-search"
            className="max-w-xs"
            placeholder="Search by Order_ID or patient"
            leading={<Search />}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </div>

        <QueryState
          query={query}
          isEmpty={(data) => data.data.length === 0}
          empty={
            <EmptyState
              icon={ClipboardList}
              title="No orders match this view"
              description="Try a different status filter or search term."
              compact
            />
          }
          skeleton={
            <TableWrap>
              <Table>
                <tbody>
                  <SkeletonRows rows={8} columns={7} />
                </tbody>
              </Table>
            </TableWrap>
          }
        >
          {(data) => (
            <>
              <TableWrap>
                <Table caption="Test orders">
                  <thead>
                    <tr>
                      <Th>Order_ID</Th>
                      <Th>Order_Date</Th>
                      <Th>Patient</Th>
                      <Th>Referred by</Th>
                      <Th>Status</Th>
                      <Th numeric>Total</Th>
                      {canManage ? <Th className="text-right">Actions</Th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((order) => {
                      const cancellable =
                        order.Status !== 'Completed' && order.Status !== 'Cancelled'
                      return (
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
                          <Td>
                            <span className="font-medium text-fg">{order.Patient_Name}</span>
                            <span className="ml-2 font-mono text-2xs text-fg-muted">
                              {order.Patient_ID}
                            </span>
                          </Td>
                          <Td className="text-fg-secondary">{order.Doctor_Name ?? '-'}</Td>
                          <Td>
                            <OrderStatusBadge status={order.Status} />
                          </Td>
                          <Td numeric>{formatCurrency(order.Total_Price)}</Td>
                          {canManage ? (
                            <Td>
                              <div className="flex items-center justify-end gap-0.5">
                                <Tooltip
                                  content={
                                    cancellable
                                      ? `Cancel order ${order.Order_ID}`
                                      : 'Only a pending or processing order can be cancelled'
                                  }
                                >
                                  <span>
                                    <Button
                                      size="icon-sm"
                                      variant="ghost"
                                      disabled={!cancellable}
                                      onClick={() => setPending({ order, kind: 'cancel' })}
                                      aria-label={`Cancel order ${order.Order_ID}`}
                                    >
                                      <Ban />
                                    </Button>
                                  </span>
                                </Tooltip>
                                <Tooltip content={`Delete order ${order.Order_ID}`}>
                                  <span>
                                    <Button
                                      size="icon-sm"
                                      variant="ghost"
                                      onClick={() => setPending({ order, kind: 'delete' })}
                                      aria-label={`Delete order ${order.Order_ID}`}
                                      className="text-fg-muted hover:bg-danger-bg hover:text-danger"
                                    >
                                      <Trash2 />
                                    </Button>
                                  </span>
                                </Tooltip>
                              </div>
                            </Td>
                          ) : null}
                        </Tr>
                      )
                    })}
                  </tbody>
                </Table>
              </TableWrap>
              <Pagination
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                onPageChange={setPage}
                label="orders"
              />
            </>
          )}
        </QueryState>
      </Surface>

      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open) {
            setPending(null)
            actionMutation.reset()
          }
        }}
        title={pending?.kind === 'cancel' ? 'Cancel order' : 'Delete order'}
        description={
          pending
            ? pending.kind === 'cancel'
              ? `Cancel order ${pending.order.Order_ID} for ${pending.order.Patient_Name}? The record stays on file, marked Cancelled.`
              : `Are you sure you want to delete order ${pending.order.Order_ID} for ${pending.order.Patient_Name}? Its samples and any draft report go with it. Orders with an issued report cannot be deleted.`
            : ''
        }
        confirmLabel={pending?.kind === 'cancel' ? 'Cancel order' : 'Delete order'}
        loading={actionMutation.isPending}
        error={actionMutation.error}
        onConfirm={() => pending && actionMutation.mutate(pending)}
      />
    </div>
  )
}
