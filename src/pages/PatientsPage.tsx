import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '@/components/data/ConfirmDialog'
import { EmptyState } from '@/components/data/EmptyState'
import { Pagination } from '@/components/data/Pagination'
import { QueryState } from '@/components/data/QueryState'
import { RowActions } from '@/components/data/RowActions'
import { Table, TableWrap, Td, Th, Tr } from '@/components/data/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { Surface } from '@/components/ui/Surface'
import { useToast } from '@/components/ui/Toast'
import { PatientFormDialog } from '@/features/patients/PatientFormDialog'
import { useAuth } from '@/hooks/useAuth'
import { formatAge, formatDate } from '@/lib/format'
import { deletePatient, getPatients } from '@/services'
import { GENDER_LABELS, type PatientListItem, patientFullName, primaryContact } from '@/types'

const PAGE_SIZE = 12

/** Module 1 - the patient register, with full create, edit and delete. */
export function PatientsPage() {
  const { can } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PatientListItem | null>(null)
  const [deleting, setDeleting] = useState<PatientListItem | null>(null)

  const query = useQuery({
    queryKey: ['patients', { search, page }],
    queryFn: () =>
      getPatients({ q: search, page, pageSize: PAGE_SIZE, sort: 'Patient_ID', order: 'asc' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (patientId: string) => deletePatient(patientId),
    onSuccess: (_result, patientId) => {
      void queryClient.invalidateQueries({ queryKey: ['patients'] })
      toast({ tone: 'success', title: `Deleted patient ${patientId}` })
      setDeleting(null)
    },
  })

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (patient: PatientListItem) => {
    setEditing(patient)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Patients"
        description="Every registered patient, with their contact numbers and order history."
        actions={
          can('patient:write') ? (
            <>
              <Button asChild>
                <Link to="/patients/new">Full form</Link>
              </Button>
              <Button variant="primary" onClick={openCreate}>
                <UserPlus />
                Add patient
              </Button>
            </>
          ) : null
        }
      />

      <Surface>
        <div className="border-b border-hairline p-3">
          <label className="sr-only" htmlFor="patient-search">
            Search patients
          </label>
          <Input
            id="patient-search"
            className="max-w-sm"
            placeholder="Search by name, Patient_ID or contact number"
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
              icon={Users}
              title={search ? 'No patients match that search' : 'No patients registered yet'}
              description={
                search
                  ? 'Try a different name, Patient_ID or contact number.'
                  : 'Register the first patient to get started.'
              }
              action={
                can('patient:write') && !search ? (
                  <Button variant="primary" onClick={openCreate}>
                    <UserPlus />
                    Add patient
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
                  <SkeletonRows rows={8} columns={7} />
                </tbody>
              </Table>
            </TableWrap>
          }
        >
          {(data) => (
            <>
              <TableWrap>
                <Table caption="Registered patients">
                  <thead>
                    <tr>
                      <Th>Patient_ID</Th>
                      <Th>Name</Th>
                      <Th>Gender</Th>
                      <Th>DOB / Age</Th>
                      <Th>Contact_No</Th>
                      <Th numeric>Orders</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((patient) => (
                      <Tr key={patient.Patient_ID}>
                        <Td className="font-mono text-xs">
                          <Link
                            to={`/patients/${patient.Patient_ID}`}
                            className="text-accent hover:underline underline-offset-2"
                          >
                            {patient.Patient_ID}
                          </Link>
                        </Td>
                        <Td className="font-medium text-fg">{patientFullName(patient)}</Td>
                        <Td>{GENDER_LABELS[patient.Gender]}</Td>
                        <Td>
                          <span className="text-fg-secondary">{formatDate(patient.DOB)}</span>
                          <span className="ml-2 text-fg-muted">{formatAge(patient.DOB)}</span>
                        </Td>
                        <Td className="font-mono text-xs">
                          {primaryContact(patient) ?? '-'}
                          {patient.Contacts.length > 1 ? (
                            <Badge className="ml-1.5" tone="neutral">
                              +{patient.Contacts.length - 1}
                            </Badge>
                          ) : null}
                        </Td>
                        <Td numeric>{patient.Order_Count}</Td>
                        <Td>
                          {can('patient:write') ? (
                            <RowActions
                              label={`patient ${patient.Patient_ID}`}
                              onEdit={() => openEdit(patient)}
                              onDelete={() => setDeleting(patient)}
                              disableDelete={patient.Order_Count > 0}
                              disableDeleteReason={`${patient.Patient_ID} has ${patient.Order_Count} order(s) on file and cannot be deleted`}
                            />
                          ) : null}
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
                label="patients"
              />
            </>
          )}
        </QueryState>
      </Surface>

      <PatientFormDialog open={formOpen} onOpenChange={setFormOpen} patient={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null)
            deleteMutation.reset()
          }
        }}
        title="Delete patient"
        description={
          deleting
            ? `Are you sure you want to delete patient ${deleting.Patient_ID}, ${patientFullName(deleting)}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete patient"
        loading={deleteMutation.isPending}
        error={deleteMutation.error}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.Patient_ID)}
      />
    </div>
  )
}
