import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowUp, FileCheck2, Microscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/data/EmptyState'
import { QueryState } from '@/components/data/QueryState'
import { Table, TableWrap, Td, Th, Tr } from '@/components/data/Table'
import { RemarkIndicator } from '@/components/domain/RemarkIndicator'
import { Breakdown } from '@/components/workspace/Breakdown'
import { MetricTile } from '@/components/workspace/MetricTile'
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Surface, SurfaceHeader } from '@/components/ui/Surface'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, formatDateTime } from '@/lib/format'
import { getPendingResults, getReports, getWorkspaceSummary } from '@/services'
import { REMARKS, countByRemark } from '@/types'

const REMARK_BAR: Record<string, string> = {
  Normal: 'bg-fg-disabled',
  Elevated: 'bg-warning',
  Critical: 'bg-danger',
}

/** Pathologist workspace: the result-entry queue and recently authorised reports. */
export function PathologistWorkspacePage() {
  const { session } = useAuth()
  const pathologistId = session?.user.pathologistId

  const summaryQuery = useQuery({ queryKey: ['workspace-summary'], queryFn: getWorkspaceSummary })
  const queueQuery = useQuery({ queryKey: ['pending-results'], queryFn: getPendingResults })
  const myReportsQuery = useQuery({
    queryKey: ['reports', { pathologistId, scope: 'workspace' }],
    queryFn: () => getReports({ pathologistId, pageSize: 6 }),
  })

  const summary = summaryQuery.data
  const findingTotal = summary
    ? Object.values(summary.Findings_By_Remark).reduce((a, b) => a + b, 0)
    : 0

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader
        eyebrow="Pathologist workspace"
        title="Result verification"
        description="Orders ready for reading, and the reports you have authorised."
        meta={
          session ? (
            <>
              <Badge tone="accent">{session.user.name}</Badge>
              {pathologistId ? <Badge className="font-mono">Pathologist_ID {pathologistId}</Badge> : null}
            </>
          ) : null
        }
        actions={
          <Button variant="primary" asChild>
            <Link to="/results">
              <Microscope />
              Open result queue
            </Link>
          </Button>
        }
      />

      <section aria-label="Key figures" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Awaiting results"
          value={summary?.Pending_Results}
          icon={Microscope}
          tone="warning"
          hint="Samples in, values not yet entered"
        />
        <MetricTile
          label="Critical findings"
          value={summary?.Findings_By_Remark.Critical}
          icon={AlertTriangle}
          tone="danger"
          hint="Across all issued reports"
        />
        <MetricTile
          label="Elevated findings"
          value={summary?.Findings_By_Remark.Elevated}
          icon={ArrowUp}
          tone="warning"
        />
        <MetricTile label="Reports issued" value={summary?.Reports_Issued} icon={FileCheck2} tone="success" />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Surface>
          <SurfaceHeader title="Result queue" description="Oldest collection first." />
          <QueryState
            query={queueQuery}
            isEmpty={(data) => data.length === 0}
            empty={
              <EmptyState
                icon={FileCheck2}
                title="Queue is clear"
                description="Every collected sample has an issued report."
                compact
              />
            }
          >
            {(items) => (
              <TableWrap>
                <Table caption="Orders awaiting result entry">
                  <thead>
                    <tr>
                      <Th>Report_ID</Th>
                      <Th>Patient</Th>
                      <Th>Last collection</Th>
                      <Th numeric>Tests</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody>
                    {items.slice(0, 6).map((item) => (
                      <Tr key={item.Report_ID}>
                        <Td className="font-mono text-xs">{item.Report_ID}</Td>
                        <Td>
                          <span className="font-medium text-fg">{item.Patient_Name}</span>
                          <span className="ml-2 font-mono text-2xs text-fg-muted">{item.Order_ID}</span>
                        </Td>
                        <Td className="whitespace-nowrap">
                          {item.Last_Collection_DateTime ? formatDateTime(item.Last_Collection_DateTime) : '-'}
                        </Td>
                        <Td numeric>{item.Test_Count}</Td>
                        <Td className="text-right">
                          <Button size="sm" variant="primary" asChild>
                            <Link to={`/results/${item.Report_ID}`}>Enter results</Link>
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </QueryState>
        </Surface>

        <Surface className="self-start">
          <SurfaceHeader title="Findings by remark" description="All issued reports." />
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

      <Surface>
        <SurfaceHeader
          title={pathologistId ? 'Reports I authorised' : 'Recently issued reports'}
          actions={
            <Button size="sm" variant="ghost" asChild>
              <Link to="/reports">View all reports</Link>
            </Button>
          }
        />
        <QueryState
          query={myReportsQuery}
          isEmpty={(data) => data.data.length === 0}
          empty={<EmptyState icon={FileCheck2} title="No reports authorised yet" compact />}
        >
          {(data) => (
            <TableWrap>
              <Table caption="Recently authorised reports">
                <thead>
                  <tr>
                    <Th>Report_ID</Th>
                    <Th>Patient</Th>
                    <Th>Order_Date</Th>
                    <Th>Report_Date</Th>
                    <Th>Findings</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((report) => {
                    const critical = countByRemark(report.Results, 'Critical')
                    const elevated = countByRemark(report.Results, 'Elevated')
                    return (
                      <Tr key={report.Report_ID}>
                        <Td className="font-mono text-xs">
                          <Link
                            to={`/reports/${report.Report_ID}`}
                            className="text-accent underline-offset-2 hover:underline"
                          >
                            {report.Report_ID}
                          </Link>
                        </Td>
                        <Td className="font-medium text-fg">
                          {report.First_Name} {report.Last_Name}
                        </Td>
                        <Td>{formatDate(report.Order_Date)}</Td>
                        <Td className="whitespace-nowrap">
                          {report.Report_Date ? formatDateTime(report.Report_Date) : '-'}
                        </Td>
                        <Td>
                          {critical > 0 ? (
                            <RemarkIndicator remark="Critical" />
                          ) : elevated > 0 ? (
                            <RemarkIndicator remark="Elevated" />
                          ) : (
                            <RemarkIndicator remark="Normal" />
                          )}
                        </Td>
                      </Tr>
                    )
                  })}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </QueryState>
      </Surface>
    </div>
  )
}
