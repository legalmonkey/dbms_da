import { Table, TableWrap, Td, Th } from '@/components/data/Table'
import { RemarkIndicator } from '@/components/domain/RemarkIndicator'
import { formatAge, formatDate, formatDateTime } from '@/lib/format'
import { GENDER_LABELS, type Report, countByRemark } from '@/types'

/**
 * The clinical report itself, shared by the on-screen viewer and the print
 * route so the two can never drift apart.
 *
 * Laid out to an A4 measure. The print stylesheet repeats the table header
 * across pages and keeps the authorisation block whole.
 */
export function ReportDocument({ report }: { report: Report }) {
  const abnormal = countByRemark(report.Results, 'Elevated') + countByRemark(report.Results, 'Critical')
  const critical = countByRemark(report.Results, 'Critical')

  return (
    <article className="mx-auto w-full max-w-[210mm] bg-surface text-fg">
      {/* --- Letterhead ---------------------------------------------- */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-fg pb-4">
        <div>
          <p className="text-base font-semibold tracking-tight">Meridian Diagnostics</p>
          <p className="mt-0.5 text-xs text-fg-muted">
            Residency Road, Bengaluru 560025 &middot; +91 80 4000 1200
          </p>
          <p className="text-xs text-fg-muted">NABL accredited &middot; MC-2026-0118</p>
        </div>
        <div className="text-right">
          <p className="text-13 font-semibold uppercase tracking-wide">Diagnostic Report</p>
          <p className="mt-0.5 font-mono text-xs">{report.Report_ID}</p>
        </div>
      </header>

      {/* --- Patient and referral ------------------------------------ */}
      <section className="grid gap-x-8 gap-y-3 border-b border-hairline py-4 sm:grid-cols-2">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-13">
          <dt className="text-fg-muted">Patient_ID</dt>
          <dd className="font-mono">{report.Patient_ID}</dd>
          <dt className="text-fg-muted">Name</dt>
          <dd className="font-medium">
            {report.First_Name} {report.Last_Name}
          </dd>
          <dt className="text-fg-muted">DOB / Age</dt>
          <dd>
            {formatDate(report.DOB)} &middot; {formatAge(report.DOB)}
          </dd>
          <dt className="text-fg-muted">Gender</dt>
          <dd>{GENDER_LABELS[report.Gender]}</dd>
        </dl>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-13">
          <dt className="text-fg-muted">Referred by</dt>
          <dd>{report.Doctor_Name ?? 'Not referred'}</dd>
          <dt className="text-fg-muted">Specialization</dt>
          <dd>{report.Specialization ?? '-'}</dd>
          <dt className="text-fg-muted">Order_ID</dt>
          <dd className="font-mono">{report.Order_ID}</dd>
          <dt className="text-fg-muted">Order_Date</dt>
          <dd>{formatDate(report.Order_Date)}</dd>
          <dt className="text-fg-muted">Report_Date</dt>
          <dd>{report.Report_Date ? formatDateTime(report.Report_Date) : 'Not issued'}</dd>
        </dl>
      </section>

      {/* --- Summary banner ------------------------------------------ */}
      {report.Results.length > 0 ? (
        <p className="border-b border-hairline py-2.5 text-13">
          {abnormal === 0 ? (
            <span>All {report.Results.length} results are within normal limits.</span>
          ) : (
            <span>
              <strong className="font-semibold">{abnormal}</strong> of {report.Results.length} results
              are outside normal limits
              {critical > 0 ? (
                <>
                  , including{' '}
                  <strong className="font-semibold text-[var(--flag-critical)]">
                    {critical} critical
                  </strong>{' '}
                  finding{critical === 1 ? '' : 's'} requiring immediate attention
                </>
              ) : null}
              .
            </span>
          )}
        </p>
      ) : null}

      {/* --- Results matrix ------------------------------------------ */}
      <section className="py-4">
        <h2 className="mb-2 text-13 font-semibold uppercase tracking-wide">Results</h2>
        <TableWrap>
          <Table caption="Diagnostic results">
            <thead>
              <tr>
                <Th>Test Name</Th>
                <Th>Observed Value</Th>
                <Th>Unit</Th>
                <Th>Reference Remarks</Th>
              </tr>
            </thead>
            <tbody>
              {report.Results.map((result) => (
                <tr key={result.Test_ID} className="avoid-break border-b border-hairline">
                  <Td>
                    <span className="font-medium">{result.Test_Name}</span>
                    <span className="ml-2 font-mono text-2xs text-fg-muted">{result.Test_ID}</span>
                  </Td>
                  <Td className="font-medium">{result.Observed_Value}</Td>
                  <Td className="text-fg-secondary">{result.Unit ?? '-'}</Td>
                  <Td>
                    <RemarkIndicator remark={result.Remark} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </section>

      {/* --- Authorisation ------------------------------------------- */}
      <footer className="report-verification mt-6 flex flex-wrap items-end justify-between gap-6 border-t border-hairline pt-4">
        <p className="max-w-sm text-2xs text-fg-muted">
          Results relate only to the samples received. This report is not valid for medico-legal
          purposes. Please correlate clinically.
        </p>
        <div className="min-w-56 text-right">
          <div className="h-10 border-b border-fg-secondary" aria-hidden="true" />
          <p className="mt-1.5 text-13 font-semibold">{report.Pathologist_Name}</p>
          <p className="text-xs text-fg-secondary">{report.Qualification}</p>
          <p className="font-mono text-2xs text-fg-muted">License_No {report.License_No}</p>
          <p className="font-mono text-2xs text-fg-muted">Pathologist_ID {report.Pathologist_ID}</p>
        </div>
      </footer>
    </article>
  )
}
