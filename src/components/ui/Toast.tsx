import * as ToastPrimitive from '@radix-ui/react-toast'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { cn } from '@/lib/cn'

type ToastTone = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: number
  tone: ToastTone
  title: string
  description?: string
}

interface ToastContextValue {
  toast: (input: { tone?: ToastTone; title: string; description?: string }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneConfig: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: 'text-success' },
  error: { icon: XCircle, className: 'text-danger' },
  warning: { icon: AlertTriangle, className: 'text-warning' },
  info: { icon: Info, className: 'text-info' },
}

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback<ToastContextValue['toast']>(({ tone = 'info', title, description }) => {
    setItems((current) => [...current, { id: nextId++, tone, title, description }])
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}
        {items.map((item) => {
          const { icon: Icon, className } = toneConfig[item.tone]
          return (
            <ToastPrimitive.Root
              key={item.id}
              className={cn(
                'anim-toast relative flex items-start gap-2.5 rounded-[var(--radius-surface)]',
                'border border-hairline bg-surface p-3 pr-9 shadow-[var(--shadow-overlay)]',
                'data-[state=closed]:opacity-0 data-[state=closed]:transition-opacity',
              )}
              onOpenChange={(open) => {
                if (!open) setItems((current) => current.filter((entry) => entry.id !== item.id))
              }}
            >
              <Icon className={cn('mt-px size-4 shrink-0', className)} aria-hidden="true" />
              <div className="min-w-0">
                <ToastPrimitive.Title className="text-13 font-medium text-fg">
                  {item.title}
                </ToastPrimitive.Title>
                {item.description ? (
                  <ToastPrimitive.Description className="mt-0.5 text-xs text-fg-muted">
                    {item.description}
                  </ToastPrimitive.Description>
                ) : null}
              </div>
              <ToastPrimitive.Close
                className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-[var(--radius-control)] text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
                aria-label="Dismiss notification"
              >
                <X className="size-3.5" aria-hidden="true" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          )
        })}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-100 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 p-4 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}
