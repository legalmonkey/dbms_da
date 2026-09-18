import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/data/ConfirmDialog'
import { EmptyState } from '@/components/data/EmptyState'
import { QueryState } from '@/components/data/QueryState'
import { RowActions } from '@/components/data/RowActions'
import { Table, TableWrap, Td, Th, Tr } from '@/components/data/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { Surface } from '@/components/ui/Surface'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Toast'
import { StaffFormDialog } from '@/features/admin/StaffFormDialog'
import { deleteStaff, getStaff } from '@/services'
import { STAFF_ROLES, type LabStaff, type StaffRole, isPathologist, isTechnician } from '@/types'

type Filter = StaffRole | 'All'

/** Module 5 - LabStaff, with its Technician and Pathologist specialisations. */
export function StaffDirectoryPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [filter, setFilter] = useState<Filter>('All')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<LabStaff | null>(null)
  const [deleting, setDeleting] = useState<LabStaff | null>(null)

  const query = useQuery({
    queryKey: ['staff', filter],
    queryFn: () => getStaff({ role: filter === 'All' ? undefined : filter }),
  })

  const deleteMutation = useMutation({
    mutationFn: (staffId: string) => deleteStaff(staffId),
    onSuccess: (_result, staffId) => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast({ tone: 'success', title: `Deleted staff ${staffId}` })
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
        title="Staff directory"
        description="Technicians carry a Certification; pathologists carry a License_No and Qualification."
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus />
            Add staff
          </Button>
        }
      />

      <Surface>
        <div className="border-b border-hairline p-3">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
            <TabsList className="border-b-0">
              <TabsTrigger value="All">All</TabsTrigger>
              {STAFF_ROLES.map((role) => (
                <TabsTrigger key={role} value={role}>
                  {role}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <QueryState
          query={query}
          isEmpty={(data) => data.length === 0}
          empty={
            <EmptyState
              icon={UsersRound}
              title="No staff on file"
              description="Add the first technician or pathologist."
              action={
                <Button variant="primary" onClick={openCreate}>
                  <Plus />
                  Add staff
                </Button>
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
          {(staff) => (
            <TableWrap>
              <Table caption="Laboratory staff">
                <thead>
                  <tr>
                    <Th>Staff_ID</Th>
                    <Th>Staff_Name</Th>
                    <Th>Role</Th>
                    <Th>Shift</Th>
                    <Th>Certification / License_No</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <Tr key={member.Staff_ID}>
                      <Td className="font-mono text-xs">{member.Staff_ID}</Td>
                      <Td className="font-medium text-fg">{member.Staff_Name}</Td>
                      <Td>
                        <Badge tone={isTechnician(member) ? 'info' : 'teal'}>
                          {member.Staff_Role}
                        </Badge>
                      </Td>
                      <Td>{member.Shift}</Td>
                      <Td className="text-fg-secondary">
                        {isTechnician(member) ? (
                          member.Certification
                        ) : isPathologist(member) ? (
                          <>
                            <span className="font-mono text-xs">{member.License_No}</span>
                            <span className="ml-2 text-fg-muted">{member.Qualification}</span>
                          </>
                        ) : null}
                      </Td>
                      <Td>
                        <RowActions
                          label={`staff ${member.Staff_ID}`}
                          onEdit={() => {
                            setEditing(member)
                            setFormOpen(true)
                          }}
                          onDelete={() => setDeleting(member)}
                        />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </QueryState>
      </Surface>

      <StaffFormDialog open={formOpen} onOpenChange={setFormOpen} staff={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null)
            deleteMutation.reset()
          }
        }}
        title="Delete staff member"
        description={
          deleting
            ? `Are you sure you want to delete ${deleting.Staff_Name} (${deleting.Staff_ID})? Staff recorded on samples or reports cannot be removed.`
            : ''
        }
        confirmLabel="Delete staff"
        loading={deleteMutation.isPending}
        error={deleteMutation.error}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.Staff_ID)}
      />
    </div>
  )
}
