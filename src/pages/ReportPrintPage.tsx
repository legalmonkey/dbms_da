import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Printer } from 'lucide-react'
import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { QueryState } from '@/components/data/QueryState'
import { ReportDocument } from '@/components/domain/ReportDocument'
import { Button } from '@/components/ui/Button'
import { usePatientScope } from '@/hooks/usePatientScope'
import { getReport } from '@/services'

/**
 * Module 4: the print view.
 *
 * Renders outside the app shell: no sidebar, no top bar. The browser's own
 * print-to-PDF does the export, so no PDF library ships in the bundle.
 */
export function ReportPrintPage() {
  const { reportId = '' } = useParams()
  const { canView } = usePatientScope()

  const query = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => getReport(reportId),
    enabled: Boolean(reportId),
  })

  useEffect(() => {
    if (query.data) document.title = `Report ${query.data.Report_ID}`
    return () => {
      document.title = 'Meridian Diagnostics LIS'
    }
  }, [query.data])

  return (
    <div className="min-h-screen bg-canvas">
      <div
        data-print="hide"
        className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-hairline bg-surface px-4 py-2.5"
      >
        <Button variant="ghost" asChild>
          <Link to={`/reports/${reportId}`}>
            <ArrowLeft />
            Back to report
          </Link>
        </Button>
        <Button variant="primary" onClick={() => window.print()}>
          <Printer />
          Print
        </Button>
      </div>

      <main className="px-4 py-8 print:p-0">
        <QueryState query={query}>
          {(report) =>
            canView(report.Patient_ID) ? <ReportDocument report={report} /> : <Navigate to="/403" replace />
          }
        </QueryState>
      </main>
    </div>
  )
}
