import type { OrderStatus } from './order'
import type { Remark } from './report'
import type { SampleStatus } from './sample'

/**
 * Lab-wide operational counts for the role workspaces.
 *
 * Every figure is computed from stored records. Nothing here is estimated or
 * padded; an empty lab reports zeros.
 */
export interface WorkspaceSummary {
  Patient_Count: number
  Orders_By_Status: Record<OrderStatus, number>
  Orders_Last_7_Days: number
  /** Sum of Total_Price across orders that were not cancelled. */
  Revenue_Booked: number
  Samples_By_Status: Record<SampleStatus, number>
  Samples_Last_7_Days: number
  Pending_Results: number
  Reports_Issued: number
  Findings_By_Remark: Record<Remark, number>
  Test_Count: number
  Staff_Count: number
  Laboratory_Count: number
}
