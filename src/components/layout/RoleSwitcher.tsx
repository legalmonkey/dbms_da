import { Check, ChevronsUpDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROLE_HOME } from '@/app/navigation'
import { ROLE_ICONS } from '@/components/domain/RolePill'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'
import { ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, type Role } from '@/types'

/**
 * Workspace switcher: moves between the four role workspaces without signing
 * out, landing on the chosen role's workspace home.
 */
export function RoleSwitcher() {
  const { session, loginAs } = useAuth()
  const navigate = useNavigate()

  if (!session) return null
  const currentRole = session.user.role
  const CurrentIcon = ROLE_ICONS[currentRole]

  const handleSelect = (role: Role) => {
    loginAs(role)
    navigate(ROLE_HOME[role] ?? '/dashboard', { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="md" className="gap-2">
          <CurrentIcon className="text-fg-muted" />
          <span className="hidden max-w-32 truncate sm:inline">{ROLE_LABELS[currentRole]}</span>
          <ChevronsUpDown className="text-fg-muted" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ROLES.map((role) => {
          const Icon = ROLE_ICONS[role]
          const isCurrent = role === currentRole
          return (
            <DropdownMenuItem
              key={role}
              onSelect={() => handleSelect(role)}
              className="items-start gap-2.5 py-2"
            >
              <Icon className={cn('mt-0.5', isCurrent && '!text-accent')} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={cn('text-13', isCurrent && 'font-semibold text-accent')}>
                    {ROLE_LABELS[role]}
                  </span>
                  {isCurrent ? <Check className="!size-3 !text-accent" aria-hidden="true" /> : null}
                </div>
                <p className="mt-0.5 text-xs leading-snug text-fg-muted">
                  {ROLE_DESCRIPTIONS[role]}
                </p>
                <p className="mt-0.5 text-2xs text-fg-disabled">
                  {isCurrent ? `Signed in as ${session.user.name}` : `Switch to ${ROLE_LABELS[role]}`}
                </p>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
