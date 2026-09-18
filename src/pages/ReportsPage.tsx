import { useQuery } from '@tanstack/react-query'
import { FileText, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/data/EmptyState'
import { Pagination } from '@/components/data/Pagination'
import { QueryState } from '@/components/data/QueryState'
import { Table, TableWrap, Td, Th, Tr } from '@/components/data/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { Surface } from '@/components/ui/Surface'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, formatDateTime } from '@/lib/format'
import { getReports } from '@/services'
import { countByRemark } from '@/types'

const PAGE_SIZE = 12

/** Module 4: issued reports. */
export function ReportsPage() {
  const { session } = useAuth()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // A patient session only ever sees its own reports.
  const scopedPatientId = session?.user.role === 'patient' ? session.user.patientId : undefined

  const query = useQuery({
    queryKey: ['reports', { search, page, scopedPatientId }],
    queryFn: () =>
      getReports({ q: search, patientId: scopedPatientId, page, pageSize: PAGE_SIZE }),
  })

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Diagnostic reports"
        description="Every issued report, ready to view or print."
      />

      <Surface>
        <div className="border-b border-hairline p-3">
          <label className="sr-only" htmlFor="report-search">
            Search reports
          </label>
          <Input
            id="report-search"
            className="max-w-sm"
            placeholder="Search by Report_ID, Order_ID or patient"
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
              icon={FileText}
              title="No reports yet"
              description="Reports appear here once a pathologist enters results."
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
                <Table caption="Issued reports">
                  <thead>
                    <tr>
                      <Th>Report_ID</Th>
                      <Th>Order_ID</Th>
                      <Th>Patient</Th>
                      <Th>Order_Date</Th>
                      <Th>Report_Date</Th>
                      <Th>Findings</Th>
                      <Th className="text-right">Actions</Th>
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
                              className="text-accent hover:underline underline-offset-2"
                            >
                              {report.Report_ID}
                            </Link>
                          </Td>
                          <Td className="font-mono text-xs">{report.Order_ID}</Td>
                          <Td>
                            <span className="font-medium text-fg">
                              {report.First_Name} {report.Last_Name}
                            </span>
                            <span className="ml-2 font-mono text-2xs text-fg-muted">
                              {report.Patient_ID}
                            </span>
                          </Td>
                          <Td>{formatDate(report.Order_Date)}</Td>
                          <Td className="whitespace-nowrap">
                            {report.Report_Date ? formatDateTime(report.Report_Date) : '-'}
                          </Td>
                          <Td>
                            {critical > 0 ? (
                              <Badge tone="danger">{critical} critical</Badge>
                            ) : elevated > 0 ? (
                              <Badge tone="warning">{elevated} elevated</Badge>
                            ) : (
                              <Badge tone="success">All normal</Badge>
                            )}
                          </Td>
                          <Td className="text-right">
                            <Button size="sm" variant="primary" asChild>
                              <Link to={`/reports/${report.Report_ID}`}>
                                <FileText className="size-3.5" />
                                View report
                              </Link>
                            </Button>
                          </Td>
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
                label="reports"
              />
            </>
          )}
        </QueryState>
      </Surface>
    </div>
  )
}
