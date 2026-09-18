import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Microscope,
  Save,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QueryState } from '@/components/data/QueryState'
import { RemarkIndicator } from '@/components/domain/RemarkIndicator'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Surface, SurfaceHeader } from '@/components/ui/Surface'
import { useToast } from '@/components/ui/Toast'
import { formatAge, formatDate } from '@/lib/format'
import { getTestParameterConfig } from '@/lib/testParameters'
import { getOrderById, getReport, saveReportResults } from '@/services'
import { GENDER_LABELS, REMARKS, type Remark, type ResultRowInput, type TestCategory } from '@/types'

interface RowState {
  Test_ID: string
  Test_Name: string
  Test_Category: TestCategory
  Specimen_Type?: string | null
  Imaging_Modality?: string | null
  Unit: string
  Observed_Value: string
  Remark: Remark
  manuallyEditedRemark: boolean
}

/**
 * Result Entry Page:
 * Dynamically presents test parameters (units, reference intervals, quantitative vs qualitative
 * vs radiological impression inputs) tailored to each specific test on the order.
 */
export function ResultEntryPage() {
  const { reportId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const reportQuery = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => getReport(reportId),
    enabled: Boolean(reportId),
  })

  const orderId = reportQuery.data?.Order_ID
  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId as string),
    enabled: Boolean(orderId),
  })

  const [rows, setRows] = useState<RowState[]>([])

  // Seed editable rows per ordered test, applying dynamic defaults from test parameter registry
  useEffect(() => {
    if (!orderQuery.data || !reportQuery.data) return
    const saved = new Map(reportQuery.data.Results.map((result) => [result.Test_ID, result]))

    setRows(
      orderQuery.data.Tests.map((test) => {
        const existing = saved.get(test.Test_ID)
        const config = getTestParameterConfig(test.Test_ID, test.Test_Name, test.Test_Category)
        const unit = existing?.Unit !== undefined && existing?.Unit !== null
          ? existing.Unit
          : config.defaultUnit

        return {
          Test_ID: test.Test_ID,
          Test_Name: test.Test_Name,
          Test_Category: test.Test_Category,
          Specimen_Type: test.Specimen_Type,
          Imaging_Modality: test.Imaging_Modality,
          Unit: unit,
          Observed_Value: existing?.Observed_Value ?? '',
          Remark: existing?.Remark ?? 'Normal',
          manuallyEditedRemark: Boolean(existing?.Remark),
        }
      }),
    )
  }, [orderQuery.data, reportQuery.data])

  const update = (testId: string, patch: Partial<RowState>) => {
    setRows((current) =>
      current.map((row) => {
        if (row.Test_ID !== testId) return row

        const updated = { ...row, ...patch }

        // If observed value changed and user hasn't manually overridden the remark, auto-evaluate
        if (patch.Observed_Value !== undefined && !row.manuallyEditedRemark) {
          const config = getTestParameterConfig(row.Test_ID, row.Test_Name, row.Test_Category)
          if (config.evaluate && patch.Observed_Value.trim()) {
            const evalResult = config.evaluate(patch.Observed_Value.trim())
            updated.Remark = evalResult.remark
          }
        }

        return updated
      }),
    )
  }

  const applyQuickOption = (testId: string, val: string, remark: Remark) => {
    setRows((current) =>
      current.map((row) =>
        row.Test_ID === testId
          ? { ...row, Observed_Value: val, Remark: remark, manuallyEditedRemark: true }
          : row
      )
    )
  }

  const mutation = useMutation({
    mutationFn: () => {
      const results: ResultRowInput[] = rows.map((row) => ({
        Test_ID: row.Test_ID,
        Observed_Value: row.Observed_Value.trim().slice(0, 50),
        Unit: row.Unit.trim() ? row.Unit.trim().slice(0, 20) : null,
        Remark: row.Remark,
      }))
      return saveReportResults(reportId, results)
    },
    onSuccess: (report) => {
      void queryClient.invalidateQueries({ queryKey: ['pending-results'] })
      void queryClient.invalidateQueries({ queryKey: ['reports'] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        tone: 'success',
        title: `Report ${report.Report_ID} issued`,
        description: 'Results recorded in Oracle DB and order status moved to Completed.',
      })
      navigate(`/reports/${report.Report_ID}`)
    },
    onError: (error) =>
      toast({ tone: 'error', title: 'Could not save the results', description: String(error) }),
  })

  const incomplete = rows.filter((row) => !row.Observed_Value.trim()).length

  return (
    <div className="flex flex-col gap-5">
      <QueryState query={reportQuery}>
        {(report) => (
          <>
            <PageHeader
              title="Enter results"
              breadcrumbs={[{ label: 'Result entry', to: '/results' }, { label: report.Report_ID }]}
              description={`${report.First_Name} ${report.Last_Name} · ${GENDER_LABELS[report.Gender]} · ${formatAge(report.DOB)}`}
              meta={
                <>
                  <Badge tone="accent" className="font-mono">
                    {report.Report_ID}
                  </Badge>
                  <Badge tone="neutral" className="font-mono">
                    {report.Order_ID}
                  </Badge>
                </>
              }
            />

            {/* Report Metadata */}
            <Surface>
              <SurfaceHeader
                title="Report metadata"
                description={`Order placed ${formatDate(report.Order_Date)}`}
              />
              <dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-3">
                <div>
                  <dt className="text-2xs uppercase tracking-wide text-fg-muted">Patient_ID</dt>
                  <dd className="mt-0.5 font-mono text-13">{report.Patient_ID}</dd>
                </div>
                <div>
                  <dt className="text-2xs uppercase tracking-wide text-fg-muted">Referring doctor</dt>
                  <dd className="mt-0.5 text-13">
                    {report.Doctor_Name ?? '-'}
                    {report.Specialization ? (
                      <span className="text-fg-muted"> · {report.Specialization}</span>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-2xs uppercase tracking-wide text-fg-muted">Authorising Pathologist</dt>
                  <dd className="mt-0.5 text-13">
                    <span className="font-mono">{report.Pathologist_ID}</span>
                    <span className="text-fg-muted"> · {report.Pathologist_Name}</span>
                  </dd>
                </div>
              </dl>
            </Surface>

            {/* Dynamic Test Parameter Entry */}
            <Surface>
              <SurfaceHeader
                title="Dynamic Test Parameters & Observations"
                description="Clinical parameters, biological reference ranges, and input fields adapt dynamically to each diagnostic test."
                actions={
                  incomplete > 0 ? (
                    <Badge tone="warning">{incomplete} value(s) pending entry</Badge>
                  ) : (
                    <Badge tone="success">All values entered</Badge>
                  )
                }
              />

              <QueryState query={orderQuery}>
                {() => (
                  <div className="divide-y divide-hairline">
                    {rows.map((row, index) => {
                      const config = getTestParameterConfig(row.Test_ID, row.Test_Name, row.Test_Category)
                      const isRadiology = row.Test_Category === 'Radiology'
                      const isNumeric = config.inputType === 'numeric'
                      const isQualitative = config.inputType === 'qualitative'

                      const evalResult =
                        isNumeric && row.Observed_Value.trim() && config.evaluate
                          ? config.evaluate(row.Observed_Value.trim())
                          : null

                      return (
                        <div
                          key={row.Test_ID}
                          className="flex flex-col gap-4 p-5 transition-colors hover:bg-neutral-subtle/30"
                        >
                          {/* Test Title and Badges */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
                                {index + 1}
                              </span>
                              <span className="font-semibold text-fg text-base">{row.Test_Name}</span>
                              <span className="font-mono text-2xs text-fg-muted bg-neutral-subtle px-1.5 py-0.5 rounded">
                                {row.Test_ID}
                              </span>

                              <Badge tone={isRadiology ? 'accent' : 'neutral'}>
                                {row.Test_Category}
                              </Badge>

                              {row.Specimen_Type && (
                                <Badge tone="neutral" className="border-border/60">
                                  <Microscope className="h-3 w-3 mr-1 text-accent" />
                                  Specimen: {row.Specimen_Type}
                                </Badge>
                              )}

                              {row.Imaging_Modality && (
                                <Badge tone="neutral" className="border-border/60">
                                  <Activity className="h-3 w-3 mr-1 text-accent" />
                                  Modality: {row.Imaging_Modality}
                                </Badge>
                              )}
                            </div>

                            {/* Reference Display Badge */}
                            <div className="flex items-center gap-1.5 text-xs bg-surface-subtle px-3 py-1 rounded-md border border-hairline">
                              <span className="text-fg-muted font-medium">Ref Interval:</span>
                              <span className="font-mono font-medium text-fg">{config.referenceDisplay}</span>
                            </div>
                          </div>

                          {/* Guidance / Parameter Note */}
                          {config.guidance && (
                            <p className="text-2xs text-fg-muted flex items-center gap-1">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent/70" />
                              {config.guidance}
                            </p>
                          )}

                          {/* Interactive Parameter Controls */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
                            {/* Observed Value Input */}
                            <div className={isRadiology ? 'md:col-span-8' : isQualitative ? 'md:col-span-7' : 'md:col-span-5'}>
                              <label className="block text-2xs font-semibold uppercase tracking-wider text-fg-muted mb-1.5">
                                {isRadiology ? 'Radiological Impression' : 'Observed Value'}
                              </label>
                              <div className="relative flex items-center">
                                <Input
                                  value={row.Observed_Value}
                                  maxLength={50}
                                  onChange={(event) =>
                                    update(row.Test_ID, { Observed_Value: event.target.value })
                                  }
                                  aria-label={`Observed value for ${row.Test_Name}`}
                                  placeholder={config.placeholder}
                                  className="h-10 text-13 pr-14"
                                />
                                <span className="absolute right-2.5 text-2xs text-fg-muted/60 pointer-events-none font-mono">
                                  {row.Observed_Value.length}/50
                                </span>
                              </div>
                            </div>

                            {/* Unit (Dynamic: Visible for quantitative, Disabled/N/A for qualitative & radiology) */}
                            {!isRadiology && !config.unitLocked && (
                              <div className="md:col-span-2">
                                <label className="block text-2xs font-semibold uppercase tracking-wider text-fg-muted mb-1.5">
                                  Unit
                                </label>
                                <Input
                                  value={row.Unit}
                                  maxLength={20}
                                  onChange={(event) => update(row.Test_ID, { Unit: event.target.value })}
                                  aria-label={`Unit for ${row.Test_Name}`}
                                  placeholder="e.g. g/dL"
                                  className="h-10 text-13 font-mono"
                                />
                              </div>
                            )}

                            {/* Evaluation or Reference Status Indicator */}
                            {isNumeric && (
                              <div className="md:col-span-2 flex flex-col justify-end">
                                <span className="block text-2xs font-semibold uppercase tracking-wider text-fg-muted mb-1.5">
                                  Range Status
                                </span>
                                <div className="h-10 flex items-center">
                                  {evalResult ? (
                                    <span
                                      className={`inline-flex items-center gap-1 text-2xs font-medium px-2 py-1 rounded border ${
                                        evalResult.tone === 'success'
                                          ? 'text-emerald-400 bg-emerald-950/30 border-emerald-800/40'
                                          : evalResult.tone === 'warning'
                                          ? 'text-amber-400 bg-amber-950/30 border-amber-800/40'
                                          : 'text-rose-400 bg-rose-950/30 border-rose-800/40'
                                      }`}
                                    >
                                      {evalResult.tone === 'success' ? (
                                        <CheckCircle2 className="h-3 w-3" />
                                      ) : evalResult.tone === 'warning' ? (
                                        <AlertTriangle className="h-3 w-3" />
                                      ) : (
                                        <AlertCircle className="h-3 w-3" />
                                      )}
                                      {evalResult.statusText}
                                    </span>
                                  ) : (
                                    <span className="text-2xs text-fg-muted italic">Awaiting value</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Clinical Remark Selector */}
                            <div className={isRadiology ? 'md:col-span-4' : isQualitative ? 'md:col-span-5' : 'md:col-span-3'}>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                                  Pathologist Remark
                                </label>
                                {row.manuallyEditedRemark && (
                                  <span className="text-3xs text-accent font-medium">Overridden</span>
                                )}
                              </div>
                              <Select
                                value={row.Remark}
                                onValueChange={(value) =>
                                  update(row.Test_ID, {
                                    Remark: value as Remark,
                                    manuallyEditedRemark: true,
                                  })
                                }
                              >
                                <SelectTrigger aria-label={`Remark for ${row.Test_Name}`} className="h-10">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {REMARKS.map((remark) => (
                                    <SelectItem key={remark} value={remark}>
                                      <div className="flex items-center gap-2">
                                        <RemarkIndicator remark={remark} />
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Quick Value / Parameter Options */}
                          {config.quickOptions && config.quickOptions.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-2xs text-fg-muted font-medium flex items-center gap-1 mr-1">
                                <Sparkles className="h-3 w-3 text-accent" />
                                Quick options:
                              </span>
                              {config.quickOptions.map((opt) => (
                                <button
                                  key={opt.label}
                                  type="button"
                                  onClick={() => applyQuickOption(row.Test_ID, opt.value, opt.remark)}
                                  className={`px-2.5 py-1 text-2xs rounded-full border transition-all cursor-pointer ${
                                    row.Observed_Value === opt.value
                                      ? 'bg-accent/20 border-accent text-accent font-semibold'
                                      : 'bg-surface border-hairline text-fg-muted hover:text-fg hover:border-border hover:bg-neutral-subtle'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </QueryState>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline p-4 bg-surface-subtle/40">
                <p className="text-xs text-fg-muted flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-accent" />
                  Stamping findings into HasResult transitions the order status to Completed.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => navigate('/results')}>Cancel</Button>
                  <Button
                    variant="primary"
                    onClick={() => mutation.mutate()}
                    loading={mutation.isPending}
                    disabled={rows.length === 0 || incomplete > 0}
                  >
                    <Save className="h-4 w-4 mr-1.5" />
                    Save and issue report
                  </Button>
                </div>
              </div>
            </Surface>
          </>
        )}
      </QueryState>
    </div>
  )
}
