import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/types'

/**
 * One place decides retry, staleness and refetch policy for every screen, so no
 * component hand-rolls its own loading semantics.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // A 4xx will not become a 2xx by asking again.
        if (isApiError(error) && error.status < 500) return false
        return failureCount < 2
      },
    },
    mutations: { retry: false },
  },
})
