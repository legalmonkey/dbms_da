import { z } from 'zod'

/** Sort direction used by every list endpoint. */
export const sortOrderSchema = z.enum(['asc', 'desc'])
export type SortOrder = z.infer<typeof sortOrderSchema>

/** Query shape shared by all paginated list endpoints. */
export const listParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  sort: z.string().optional(),
  order: sortOrderSchema.default('desc'),
})
export type ListParams = z.infer<typeof listParamsSchema>

/** Envelope returned by every list endpoint. */
export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

/** The single error shape every service rejects with. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors?: Record<string, string>

  constructor(status: number, code: string, message: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError

/** ISO 8601 timestamp string. */
export const isoDate = z.string().datetime({ offset: true })
