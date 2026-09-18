import { ApiError } from '@/types'
import { delay, shouldForceError } from '@/mock/latency'
import { resolveRoute } from '@/mock/handlers'

/**
 * THE SEAM.
 *
 * Every service function in this folder calls request(). Nothing else in the
 * application performs network access. When the backend is ready, set
 * VITE_API_MODE=live in .env and this file starts issuing real fetch calls:
 * no service, hook, page or component changes.
 *
 * Services are written once, against the REST paths in docs/api-contract.md,
 * and are never rewritten.
 */

const MODE = import.meta.env.VITE_API_MODE ?? 'mock'
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Build a query string, dropping empty and undefined values. */
export function qs(params: Record<string, unknown> = {}): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const encoded = search.toString()
  return encoded ? `?${encoded}` : ''
}

async function mockRequest<T>(method: Method, path: string, body?: unknown): Promise<T> {
  await delay()

  if (shouldForceError()) {
    throw new ApiError(500, 'SERVER_ERROR', 'Simulated server error (demo controls)')
  }

  const [pathname = '', search = ''] = path.split('?')
  const resolved = resolveRoute(method, pathname)

  if (!resolved) {
    throw new ApiError(404, 'NOT_FOUND', `No mock handler for ${method} ${pathname}`)
  }

  return resolved.route.handler({
    params: resolved.params,
    query: new URLSearchParams(search),
    body,
  }) as T
}

async function liveRequest<T>(method: Method, path: string, body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your connection.')
  }

  if (response.status === 204) return undefined as T

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const error = (payload ?? {}) as {
      code?: string
      message?: string
      fieldErrors?: Record<string, string>
    }
    throw new ApiError(
      response.status,
      error.code ?? 'UNKNOWN',
      error.message ?? 'Something went wrong',
      error.fieldErrors,
    )
  }

  return payload as T
}

export function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  return MODE === 'live' ? liveRequest<T>(method, path, body) : mockRequest<T>(method, path, body)
}

export const apiMode = MODE

// Dev-only handle so the API can be exercised from the browser console
// without driving the UI. Stripped from production builds by the DEV guard.
if (import.meta.env.DEV) {
  ;(globalThis as unknown as { __limsApi?: typeof request }).__limsApi = request
}
