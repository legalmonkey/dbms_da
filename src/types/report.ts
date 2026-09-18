import { z } from 'zod'
import type { Gender } from './patient'
import type { TestCategory } from './catalogue'

/**
 * Report + HasResult.
 *
 * Remark is entered by the pathologist, not computed. The earlier speculative
 * model derived high/low flags from sex- and age-specific reference ranges;
 * the database schema has no such table, so the clinical judgement lives in
 * this one field.
 */

export const remarkSchema = z.enum(['Normal', 'Elevated', 'Critical'])
export type Remark = z.infer<typeof remarkSchema>

export const REMARKS: Remark[] = ['Normal', 'Elevated', 'Critical']

export const REMARK_DESCRIPTIONS: Record<Remark, string> = {
  Normal: 'Within the expected range.',
  Elevated: 'Outside the expected range, not immediately dangerous.',
  Critical: 'Requires the referring doctor’s immediate attention.',
}

/** HasResult: one observed value for one test on one report. */
export interface HasResult {
  Report_ID: string
  Test_ID: string
  Test_Name: string
  Test_Category: TestCategory
  Observed_Value: string
  Unit: string | null
  Remark: Remark
}

export interface Report {
  Report_ID: string
  Order_ID: string
  /** Null while the report is a draft awaiting result entry. */
  Report_Date: string | null

  Patient_ID: string
  First_Name: string
  Last_Name: string
  DOB: string
  Gender: Gender

  Doctor_ID: string | null
  Doctor_Name: string | null
  Specialization: string | null

  Pathologist_ID: string
  Pathologist_Name: string
  Qualification: string
  License_No: string

  Order_Date: string
  Results: HasResult[]
}

/** One row of the pathologist's result entry table. */
export const resultRowInputSchema = z.object({
  Test_ID: z.string(),
  Observed_Value: z.string().trim().min(1, 'Enter the observed value'),
  Unit: z.string().trim().max(16).nullable().optional(),
  Remark: remarkSchema,
})
export type ResultRowInput = z.infer<typeof resultRowInputSchema>

/** Payload accepted by saveReportResults(reportId, results[]). */
export const reportResultsInputSchema = z.object({
  Report_ID: z.string(),
  Results: z.array(resultRowInputSchema).min(1, 'A report needs at least one result'),
})
export type ReportResultsInput = z.infer<typeof reportResultsInputSchema>

/** The pathologist's queue: orders whose samples are in, awaiting results. */
export interface PendingResultItem {
  Report_ID: string
  Order_ID: string
  Order_Date: string
  Patient_ID: string
  Patient_Name: string
  Test_Count: number
  Sample_Count: number
  Last_Collection_DateTime: string | null
}

export const reportPatientName = (report: Pick<Report, 'First_Name' | 'Last_Name'>) =>
  `${report.First_Name} ${report.Last_Name}`.trim()

export const countByRemark = (results: HasResult[], remark: Remark) =>
  results.filter((result) => result.Remark === remark).length

/**
 * A report is issued once its results have been entered. The schema has no
 * status column, so the presence of results plus a Report_Date is the signal.
 */
export const isReportIssued = (report: Pick<Report, 'Results' | 'Report_Date'>) =>
  report.Results.length > 0 && report.Report_Date !== null
