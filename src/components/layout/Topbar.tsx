import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, UserRound } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Input } from '@/components/ui/Input'
import { Kbd } from '@/components/ui/Kbd'
import { useAuth } from '@/hooks/useAuth'
import { initials } from '@/lib/format'
import { ROLE_LABELS } from '@/types'
import { RoleSwitcher } from './RoleSwitcher'
import { ThemeToggle } from './ThemeToggle'

export function Topbar({
  onOpenMobileNav,
  onToggleCollapse,
  collapsed,
}: {
  onOpenMobileNav: () => void
  onToggleCollapse: () => void
  collapsed: boolean
}) {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const searchRef = useRef<HTMLInputElement>(null)

  // "/" focuses search, the convention in dense operational tools.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (target?.isContentEditable) return
      event.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header
      data-print="hide"
      className="flex h-14 shrink-0 items-center gap-2 border-b border-hairline bg-surface px-3 sm:px-4"
    >
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
      >
        <Menu className="text-fg-muted" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <PanelLeftOpen className="text-fg-muted" />
        ) : (
          <PanelLeftClose className="text-fg-muted" />
        )}
      </Button>

      <div className="relative ml-1 hidden min-w-0 flex-1 sm:block sm:max-w-md">
        <label htmlFor="global-search" className="sr-only">
          Search patients, orders and samples
        </label>
        <Input
          id="global-search"
          ref={searchRef}
          type="search"
          placeholder="Search patients, orders, samples"
          leading={<Search />}
          className="pr-10"
        />
        <Kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">/</Kbd>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <RoleSwitcher />
        <ThemeToggle />

        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Account menu">
                <span className="flex size-6 items-center justify-center rounded-[var(--radius-control)] bg-accent-subtle text-2xs font-semibold text-accent">
                  {initials(session.user.name)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="normal-case tracking-normal">
                <span className="block text-13 font-medium text-fg">{session.user.name}</span>
                <span className="block text-xs font-normal text-fg-muted">
                  {session.user.designation ?? ROLE_LABELS[session.user.role]}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {session.user.role === 'patient' ? (
                <DropdownMenuItem onSelect={() => navigate('/patient')}>
                  <UserRound /> My health record
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem destructive onSelect={handleLogout}>
                <LogOut /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  )
}
