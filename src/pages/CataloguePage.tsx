import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, TestTubes } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/data/ConfirmDialog'
import { EmptyState } from '@/components/data/EmptyState'
import { QueryState } from '@/components/data/QueryState'
import { RowActions } from '@/components/data/RowActions'
import { Table, TableWrap, Td, Th, Tr } from '@/components/data/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { Surface } from '@/components/ui/Surface'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Toast'
import { TestFormDialog } from '@/features/catalogue/TestFormDialog'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'
import { formatCurrency } from '@/lib/format'
import { deleteTest, getTests } from '@/services'
import { TEST_CATEGORIES, type Test, type TestCategory } from '@/types'

type Filter = TestCategory | 'All'

/** Module 1 / 5 - the test directory, with catalogue management for admins. */
export function CataloguePage() {
  const { can } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [filter, setFilter] = useState<Filter>('All')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Test | null>(null)
  const [deleting, setDeleting] = useState<Test | null>(null)

  const canManage = can('catalogue:write')

  const query = useQuery({
    queryKey: ['tests', { filter, search }],
    queryFn: () => getTests({ category: filter === 'All' ? undefined : filter, q: search }),
  })

  const deleteMutation = useMutation({
    mutationFn: (testId: string) => deleteTest(testId),
    onSuccess: (_result, testId) => {
      void queryClient.invalidateQueries({ queryKey: ['tests'] })
      toast({ tone: 'success', title: `Deleted test ${testId}` })
      setDeleting(null)
    },
  })

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Test catalogue"
        description="Pathology tests carry a Specimen_Type; radiology tests carry an Imaging_Modality."
        actions={
          canManage ? (
            <Button variant="primary" onClick={openCreate}>
              <Plus />
              Add test
            </Button>
          ) : null
        }
      />

      <Surface className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline px-5 py-3.5 bg-surface-2/40">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
            <TabsList className="border-b-0 gap-1 bg-surface-3/60 p-1 rounded-lg">
              <TabsTrigger value="All" className="px-3.5 py-1.5 text-xs rounded-md font-medium">All</TabsTrigger>
              {TEST_CATEGORIES.map((category) => (
                <TabsTrigger key={category} value={category} className="px-3.5 py-1.5 text-xs rounded-md font-medium">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <label className="sr-only" htmlFor="test-search">
            Search tests
          </label>
          <Input
            id="test-search"
            className="w-64 sm:w-72"
            placeholder="Search by test name or ID..."
            leading={<Search className="size-4 text-fg-muted" />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <QueryState
          query={query}
          isEmpty={(data) => data.length === 0}
          empty={
            <EmptyState
              icon={TestTubes}
              title="No tests match this filter"
              description="Try another category or clear the search."
              action={
                canManage ? (
                  <Button variant="primary" onClick={openCreate}>
                    <Plus />
                    Add test
                  </Button>
                ) : null
              }
              compact
            />
          }
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
          {(tests) => (
            <TableWrap>
              <Table caption="Test catalogue">
                <thead>
                  <tr>
                    <Th className="w-24">Test ID</Th>
                    <Th>Test Name</Th>
                    <Th className="w-36">Category</Th>
                    <Th>Specimen / Modality</Th>
                    <Th numeric className="w-28">Price</Th>
                    {canManage ? <Th className="w-20 text-right">Actions</Th> : null}
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test) => (
                    <Tr key={test.Test_ID}>
                      <Td className="font-mono text-xs font-semibold text-accent">
                        {test.Test_ID}
                      </Td>
                      <Td className="font-medium text-fg">
                        <span className="text-13 font-semibold text-fg">{test.Test_Name}</span>
                        {test.Unit ? (
                          <span className="ml-2 font-mono text-2xs text-fg-muted bg-surface-2 px-1.5 py-0.5 rounded border border-hairline/50">
                            {test.Unit}
                          </span>
                        ) : null}
                      </Td>
                      <Td>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-secondary">
                          <span
                            className={cn(
                              'size-2 rounded-full',
                              test.Test_Category === 'Pathology' ? 'bg-rose-500' : 'bg-amber-400',
                            )}
                          />
                          {test.Test_Category}
                        </span>
                      </Td>
                      <Td className="text-fg-secondary">
                        <span className="inline-flex items-center rounded-md bg-surface-2 px-2.5 py-1 font-mono text-xs text-fg-muted border border-hairline/60">
                          {test.Test_Category === 'Pathology'
                            ? test.Specimen_Type
                            : test.Imaging_Modality}
                        </span>
                      </Td>
                      <Td numeric className="font-mono font-bold text-fg text-sm">
                        {formatCurrency(test.Price)}
                      </Td>
                      {canManage ? (
                        <Td>
                          <RowActions
                            label={`test ${test.Test_ID}`}
                            onEdit={() => {
                              setEditing(test)
                              setFormOpen(true)
                            }}
                            onDelete={() => setDeleting(test)}
                          />
                        </Td>
                      ) : null}
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </QueryState>
      </Surface>

      <TestFormDialog open={formOpen} onOpenChange={setFormOpen} test={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null)
            deleteMutation.reset()
          }
        }}
        title="Delete test"
        description={
          deleting
            ? `Are you sure you want to delete ${deleting.Test_Name} (${deleting.Test_ID})? Tests already booked on an order cannot be removed.`
            : ''
        }
        confirmLabel="Delete test"
        loading={deleteMutation.isPending}
        error={deleteMutation.error}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.Test_ID)}
      />
    </div>
  )
}
