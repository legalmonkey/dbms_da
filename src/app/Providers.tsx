import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import { TooltipProvider } from '@/components/ui/Tooltip'
import { AppErrorBoundary } from './AppErrorBoundary'
import { AuthProvider } from './AuthProvider'
import { ThemeProvider } from './ThemeProvider'
import { queryClient } from './queryClient'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider delayDuration={300} skipDelayDuration={0}>
              <ToastProvider>{children}</ToastProvider>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  )
}
