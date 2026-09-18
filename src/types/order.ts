import { z } from 'zod'
import type { Doctor } from './doctor'
import type { TestCategory } from './catalogue'

/** TestOrder + OrderIncludesTest. */

export const orderStatusSchema = z.enum(['Pending', 'Processing', 'Completed', 'Cancelled'])
export type OrderStatus = z.infer<typeof orderStatusSchema>

export const ORDER_STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Completed', 'Cancelled']

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  Pending: 'Booked. Awaiting sample collection.',
  Processing: 'Sample collected. Results being prepared.',
  Completed: 'Results verified and the report is available.',
  Cancelled: 'Withdrawn before completion.',
}

/** OrderIncludesTest: one line of the order. */
export interface OrderIncludesTest {
  Order_ID: string
  Test_ID: string
  Test_Name: string
  Test_Category: TestCategory
  Price: number
  Specimen_Type?: string | null
  Imaging_Modality?: string | null
}

export interface TestOrder {
  Order_ID: string
  Order_Date: string
  Patient_ID: string
  Patient_Name: string
  Doctor_ID: string | null
  Doctor_Name: string | null
  Specialization: string | null
  Status: OrderStatus
  Tests: OrderIncludesTest[]
  Total_Price: number
}

/** Payload accepted by createOrder. */
export const orderInputSchema = z.object({
  Patient_ID: z.string().min(1, 'Select a patient'),
  Doctor_ID: z.string().min(1, 'Select a referring doctor'),
  Test_IDs: z.array(z.string()).min(1, 'Select at least one test'),
  Order_Date: z.string().min(1, 'Order date is required'),
})
export type OrderInput = z.infer<typeof orderInputSchema>

/** Checkout summary computed live as tests are toggled in the catalogue grid. */
export interface OrderSummaryLine {
  Test_ID: string
  Test_Name: string
  Test_Category: TestCategory
  Price: number
}

export const orderTotal = (lines: Array<{ Price: number }>) =>
  lines.reduce((sum, line) => sum + line.Price, 0)

export const doctorLabelFromOrder = (order: TestOrder) =>
  order.Doctor_Name ? `${order.Doctor_Name} (${order.Specialization ?? '-'})` : 'Not referred'

export type { Doctor }
