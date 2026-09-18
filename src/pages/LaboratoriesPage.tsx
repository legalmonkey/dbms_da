import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/data/ConfirmDialog'
import { EmptyState } from '@/components/data/EmptyState'
import { QueryState } from '@/components/data/QueryState'
import { RowActions } from '@/components/data/RowActions'
import { Table, TableWrap, Td, Th, Tr } from '@/components/data/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { Surface } from '@/components/ui/Surface'
import { useToast } from '@/components/ui/Toast'
import { LabFormDialog } from '@/features/admin/LabFormDialog'
import { deleteLabLocation, getLabLocations } from '@/services'
import type { Laboratory } from '@/types'

/** Module 5 - laboratory locations. */
export function LaboratoriesPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Laboratory | null>(null)
  const [deleting, setDeleting] = useState<Laboratory | null>(null)

  const query = useQuery({ queryKey: ['laboratories'], queryFn: getLabLocations })

  const deleteMutation = useMutation({
    mutationFn: (labId: string) => deleteLabLocation(labId),
    onSuccess: (_result, labId) => {
      void queryClient.invalidateQueries({ queryKey: ['laboratories'] })
      toast({ tone: 'success', title: `Deleted laboratory ${labId}` })
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
        title="Laboratories"
        description="Processing facilities that samples are assigned to at intake."
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus />
            Add laboratory
          </Button>
        }
      />

      <Surface>
        <QueryState
          query={query}
          isEmpty={(data) => data.length === 0}
          empty={
            <EmptyState
              icon={Building2}
              title="No laboratories on file"
              description="Add the first processing facility."
              action={
                <Button variant="primary" onClick={openCreate}>
                  <Plus />
                  Add laboratory
                </Button>
              }
              compact
            />
          }
          skeleton={
            <TableWrap>
              <Table>
                <tbody>
                  <SkeletonRows rows={5} columns={5} />
                </tbody>
              </Table>
            </TableWrap>
          }
        >
          {(labs) => (
            <TableWrap>
              <Table caption="Laboratory locations">
                <thead>
                  <tr>
                    <Th>Lab_ID</Th>
                    <Th>Lab_Name</Th>
                    <Th>Location</Th>
                    <Th>Contact_No</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {labs.map((lab) => (
                    <Tr key={lab.Lab_ID}>
                      <Td className="font-mono text-xs">{lab.Lab_ID}</Td>
                      <Td className="font-medium text-fg">{lab.Lab_Name}</Td>
                      <Td className="text-fg-secondary">{lab.Location}</Td>
                      <Td className="font-mono text-xs">{lab.Contact_No}</Td>
                      <Td>
                        <RowActions
                          label={`laboratory ${lab.Lab_ID}`}
                          onEdit={() => {
                            setEditing(lab)
                            setFormOpen(true)
                          }}
                          onDelete={() => setDeleting(lab)}
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

      <LabFormDialog open={formOpen} onOpenChange={setFormOpen} lab={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null)
            deleteMutation.reset()
          }
        }}
        title="Delete laboratory"
        description={
          deleting
            ? `Are you sure you want to delete ${deleting.Lab_Name} (${deleting.Lab_ID})? Facilities with samples on file cannot be removed.`
            : ''
        }
        confirmLabel="Delete laboratory"
        loading={deleteMutation.isPending}
        error={deleteMutation.error}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.Lab_ID)}
      />
    </div>
  )
}
