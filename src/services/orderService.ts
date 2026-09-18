import type { OrderInput, OrderStatus, Paginated, TestOrder } from '@/types'
import { qs, request } from './http'

export interface OrderListParams {
  page?: number
  pageSize?: number
  q?: string
  status?: OrderStatus
  patientId?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export const getOrders = (params: OrderListParams = {}) =>
  request<Paginated<TestOrder>>('GET', `/orders${qs({ ...params })}`)

export const getOrderById = (orderId: string) => request<TestOrder>('GET', `/orders/${orderId}`)

export const createOrder = (orderData: OrderInput) =>
  request<TestOrder>('POST', '/orders', orderData)

export const cancelOrder = (orderId: string) =>
  request<TestOrder>('PATCH', `/orders/${orderId}/cancel`)

/** Refused with 409 once a report has been issued; cancel instead. */
export const deleteOrder = (orderId: string) =>
  request<{ ok: true }>('DELETE', `/orders/${orderId}`)
