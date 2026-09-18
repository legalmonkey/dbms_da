import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Search, ShoppingCart, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { EmptyState } from '@/components/data/EmptyState'
import { QueryState } from '@/components/data/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Surface, SurfaceHeader } from '@/components/ui/Surface'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import SpotlightCard from '@/components/reactbits/SpotlightCard'
import { cn } from '@/lib/cn'
import { formatCurrency } from '@/lib/format'
import { createOrder, getDoctors, getPatients, getTests } from '@/services'
import { doctorOptionLabel, getTestDescription, patientFullName, type Test, type TestCategory } from '@/types'

/**
 * Module 1: interactive test ordering.
 *
 * The catalogue grid toggles selection, and the checkout panel recalculates on
 * every change. Prices shown here are the catalogue's; the server recomputes
 * the total on submit and never trusts what the client sends.
 */
export function OrderBookingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const { session } = useAuth()

  // A patient books for themselves only. They never see a picker of other
  // patients, and the query that would populate one is never issued.
  const ownPatientId = session?.user.role === 'patient' ? (session.user.patientId ?? '') : null
  const isPatientSession = ownPatientId !== null

  const [chosenPatientId, setPatientId] = useState(searchParams.get('patientId') ?? '')
  const patientId = isPatientSession ? ownPatientId : chosenPatientId
  const [doctorId, setDoctorId] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | TestCategory>('ALL')
  const [submitted, setSubmitted] = useState(false)

  const orderDate = new Date().toISOString().slice(0, 10)

  const patientsQuery = useQuery({
    queryKey: ['patients', 'picker'],
    queryFn: () => getPatients({ pageSize: 100, sort: 'First_Name', order: 'asc' }),
    enabled: !isPatientSession,
  })
  const doctorsQuery = useQuery({ queryKey: ['doctors'], queryFn: getDoctors })
  const testsQuery = useQuery({ queryKey: ['tests', { search }], queryFn: () => getTests({ q: search }) })

  const testsById = useMemo(() => {
    const map = new Map<string, Test>()
    for (const test of testsQuery.data ?? []) map.set(test.Test_ID, test)
    return map
  }, [testsQuery.data])

  const lines = useMemo(
    () => [...selected].flatMap((id) => (testsById.has(id) ? [testsById.get(id) as Test] : [])),
    [selected, testsById],
  )
  const total = lines.reduce((sum, test) => sum + test.Price, 0)

  const toggle = (testId: string) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(testId)) next.delete(testId)
      else next.add(testId)
      return next
    })

  const mutation = useMutation({
    mutationFn: () =>
      createOrder({
        Patient_ID: patientId,
        Doctor_ID: doctorId,
        Test_IDs: [...selected],
        Order_Date: orderDate,
      }),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        tone: 'success',
        title: `Order ${order.Order_ID} confirmed`,
        description: `${order.Tests.length} test(s), ${formatCurrency(order.Total_Price)}`,
      })
      navigate(`/orders/${order.Order_ID}`)
    },
    onError: (error) =>
      toast({ tone: 'error', title: 'Could not confirm the order', description: String(error) }),
  })

  const patientError = submitted && !patientId ? 'Select a patient' : undefined
  const doctorError = submitted && !doctorId ? 'Select a referring doctor' : undefined
  const testsError = submitted && selected.size === 0 ? 'Select at least one test' : undefined

  const confirm = () => {
    setSubmitted(true)
    if (!patientId || !doctorId || selected.size === 0) return
    mutation.mutate()
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Book test order"
        description="Select the patient, the referring doctor and the tests to be performed."
        breadcrumbs={[{ label: 'Test orders', to: '/orders' }, { label: 'New order' }]}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* --- Catalogue grid ------------------------------------------- */}
        <Surface className="lg:col-start-1">
          <SurfaceHeader
            title="Test catalogue"
            description="Click a test to add or remove it from the order."
            actions={
              <Input
                className="w-56"
                placeholder="Search tests"
                leading={<Search />}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search tests"
              />
            }
          />

          {testsError ? (
            <p role="alert" className="border-b border-danger-border bg-danger-bg px-4 py-2 text-13 text-danger">
              {testsError}
            </p>
          ) : null}

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-hairline px-4 py-2.5 bg-surface-2/40">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                categoryFilter === 'ALL'
                  ? 'bg-surface text-fg shadow-xs border border-hairline'
                  : 'text-fg-muted hover:text-fg hover:bg-surface/50',
              )}
            >
              All Services ({testsQuery.data?.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('Pathology')}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                categoryFilter === 'Pathology'
                  ? 'bg-surface text-fg shadow-xs border border-hairline'
                  : 'text-fg-muted hover:text-fg hover:bg-surface/50',
              )}
            >
              Pathology ({(testsQuery.data ?? []).filter((t) => t.Test_Category === 'Pathology').length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('Radiology')}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                categoryFilter === 'Radiology'
                  ? 'bg-surface text-fg shadow-xs border border-hairline'
                  : 'text-fg-muted hover:text-fg hover:bg-surface/50',
              )}
            >
              Radiology ({(testsQuery.data ?? []).filter((t) => t.Test_Category === 'Radiology').length})
            </button>
          </div>

          <QueryState
            query={testsQuery}
            isEmpty={(data) => data.length === 0}
            empty={<EmptyState title="No tests match that search" compact />}
          >
            {(tests) => {
              const visibleTests =
                categoryFilter === 'ALL'
                  ? tests
                  : tests.filter((t) => t.Test_Category === categoryFilter)

              return (
                <ul className="grid gap-2.5 p-3 sm:grid-cols-2">
                  {visibleTests.map((test) => {
                    const isSelected = selected.has(test.Test_ID)
                    const description = getTestDescription(test)
                    return (
                      <li key={test.Test_ID}>
                        <SpotlightCard
                          className={cn('h-full', isSelected && 'border-accent! bg-accent-subtle!')}
                        >
                          <button
                            type="button"
                            onClick={() => toggle(test.Test_ID)}
                            aria-pressed={isSelected}
                            className={cn(
                              'flex h-full w-full items-start gap-3 p-3.5 text-left',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]',
                            )}
                          >
                            <span
                              className={cn(
                                'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[3px] border',
                                isSelected ? 'border-accent bg-accent text-fg-on-accent' : 'border-hairline-strong',
                              )}
                              aria-hidden="true"
                            >
                              {isSelected ? <Check className="size-3" strokeWidth={3} /> : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-start justify-between gap-2">
                                <span className="block text-13 font-semibold text-fg leading-tight">
                                  {test.Test_Name}
                                </span>
                                <span className="shrink-0 text-13 font-bold text-fg">
                                  {formatCurrency(test.Price)}
                                </span>
                              </span>
                              <span className="mt-1 flex flex-wrap items-center gap-1.5 text-2xs text-fg-muted">
                                <span className="font-mono">{test.Test_ID}</span>
                                <Badge tone={test.Test_Category === 'Pathology' ? 'info' : 'teal'}>
                                  {test.Test_Category}
                                </Badge>
                                <span className="rounded bg-surface-2 px-1.5 py-0.5 font-medium text-fg-muted">
                                  {test.Test_Category === 'Pathology'
                                    ? `Specimen: ${test.Specimen_Type}`
                                    : `Modality: ${test.Imaging_Modality}`}
                                </span>
                              </span>
                              <p className="mt-2 text-xs leading-relaxed text-fg-muted line-clamp-2">
                                {description}
                              </p>
                            </span>
                          </button>
                        </SpotlightCard>
                      </li>
                    )
                  })}
                </ul>
              )
            }}
          </QueryState>
        </Surface>

        {/* --- Checkout summary ----------------------------------------- */}
        <div className="flex flex-col gap-4 lg:col-start-2">
          <Surface>
            <SurfaceHeader title="Order details" />
            <div className="flex flex-col gap-4 p-4">
              {isPatientSession ? (
                <Field label="Patient">
                  <Input value={`${patientId} - ${session?.user.name ?? ''}`} readOnly />
                </Field>
              ) : (
                <Field label="Patient" required error={patientError}>
                  <Select value={patientId} onValueChange={setPatientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {(patientsQuery.data?.data ?? []).map((patient) => (
                        <SelectItem key={patient.Patient_ID} value={patient.Patient_ID}>
                          {patient.Patient_ID} - {patientFullName(patient)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <Field label="Referring doctor" required error={doctorError}>
                <Select value={doctorId} onValueChange={setDoctorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {(doctorsQuery.data ?? []).map((doctor) => (
                      <SelectItem key={doctor.Doctor_ID} value={doctor.Doctor_ID}>
                        {doctorOptionLabel(doctor)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Order_Date">
                <Input type="date" value={orderDate} readOnly />
              </Field>
            </div>
          </Surface>

          <Surface>
            <SurfaceHeader
              title="Summary"
              description={`${lines.length} test(s) selected`}
              actions={
                lines.length > 0 ? (
                  <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                    Clear
                  </Button>
                ) : null
              }
            />

            {lines.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="No tests selected"
                description="Pick tests from the catalogue to build the order."
                compact
              />
            ) : (
              <ul className="divide-y divide-hairline">
                {lines.map((test) => (
                  <li key={test.Test_ID} className="flex items-center gap-2 px-4 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-13">{test.Test_Name}</span>
                      <span className="font-mono text-2xs text-fg-muted">{test.Test_ID}</span>
                    </span>
                    <span className="text-13">{formatCurrency(test.Price)}</span>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => toggle(test.Test_ID)}
                      aria-label={`Remove ${test.Test_Name}`}
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-between border-t border-hairline px-4 py-3">
              <span className="text-13 font-medium">Total</span>
              <span className="text-base font-semibold" aria-live="polite">
                {formatCurrency(total)}
              </span>
            </div>

            <div className="border-t border-hairline p-3">
              <Button
                variant="primary"
                className="w-full"
                size="lg"
                onClick={confirm}
                loading={mutation.isPending}
              >
                Confirm order
              </Button>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  )
}
