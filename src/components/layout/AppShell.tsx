import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const COLLAPSE_KEY = 'lims.sidebar.collapsed'

/**
 * Workspace grid background.
 *
 * One unbroken string on purpose: Tailwind generates arbitrary-value classes
 * only when it finds the complete class token in source. Split across a string
 * concatenation, the scanner sees two halves and emits nothing.
 *
 * Line strength is capped at 30% of the hairline token. Workspace headers sit
 * on the grid rather than on a surface, and muted text on the plain light
 * canvas is only 4.83:1 to begin with. At 70% a line crossing that text fell
 * under AA.
 */
const WORKSPACE_GRID =
  'bg-[image:linear-gradient(to_right,color-mix(in_oklab,var(--hairline)_30%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--hairline)_30%,transparent)_1px,transparent_1px)] bg-[size:24px_24px] bg-[position:-1px_-1px]'

/**
 * Application chrome.
 *
 * Desktop  ≥1024px  fixed 240px sidebar, collapsible to a 56px icon rail
 * Tablet    768px+  same shell, collapsed by default via the toggle
 * Mobile   <1024px  sidebar moves into a focus-trapped slide-in drawer
 */
export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      return false
    }
  })
  const location = useLocation()

  // Close the drawer on navigation so a link tap does not leave it hanging open.
  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  const toggleCollapse = () => {
    setCollapsed((current) => {
      const next = !current
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="flex min-h-0 flex-1">
        <aside
          data-print="hide"
          className={cn(
            'hidden shrink-0 border-r border-hairline transition-[width] duration-200 ease-[var(--ease-out-quick)] lg:block',
            collapsed ? 'w-14' : 'w-60',
          )}
        >
          <Sidebar collapsed={collapsed} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onToggleCollapse={toggleCollapse}
            collapsed={collapsed}
          />

          {/*
            Workspace ground: a faint 24px grid drawn with Tailwind gradient
            utilities and the hairline token, so it follows light and dark
            themes. Content sits on opaque surfaces, so the grid only shows in
            the gutters and never behind table text. It does not print.
          */}
          <main
            id="main-content"
            tabIndex={-1}
            className={cn('min-h-0 flex-1 overflow-y-auto px-4 py-5 focus:outline-none sm:px-6 sm:py-6', WORKSPACE_GRID)}
          >
            <Outlet />
          </main>
        </div>
      </div>

      <DialogPrimitive.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="anim-overlay fixed inset-0 z-50 bg-[#101828]/40 lg:hidden dark:bg-[#03070d]/70" />
          <DialogPrimitive.Content
            className={cn(
              'anim-content fixed inset-y-0 left-0 z-50 w-64 border-r border-hairline',
              'bg-surface focus:outline-none lg:hidden',
            )}
            aria-label="Navigation"
          >
            <DialogPrimitive.Title className="sr-only">Navigation menu</DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="absolute right-2 top-3.5 flex size-7 items-center justify-center rounded-[var(--radius-control)] text-fg-muted hover:bg-surface-3 hover:text-fg"
              aria-label="Close navigation menu"
            >
              <X className="size-4" aria-hidden="true" />
            </DialogPrimitive.Close>
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  )
}
