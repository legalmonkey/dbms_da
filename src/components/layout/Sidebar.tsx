import { NavLink } from 'react-router-dom'
import { NAV_SECTIONS } from '@/app/navigation'
import { Tooltip } from '@/components/ui/Tooltip'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'
import { Brand } from './Brand'

/**
 * Primary navigation.
 *
 * Sections whose items are all forbidden for the current role disappear
 * entirely, so no role ever sees an empty heading.
 */
export function Sidebar({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const { can, session } = useAuth()
  const role = session?.user.role

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => can(item.permission) && (!item.roles || (role !== undefined && item.roles.includes(role))),
    ),
  })).filter((section) => section.items.length > 0)

  return (
    <div className="flex h-full flex-col bg-surface">
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-hairline',
          collapsed ? 'justify-center px-0' : 'px-4',
        )}
      >
        <Brand collapsed={collapsed} />
      </div>

      <nav
        aria-label="Main"
        className={cn(
          'flex-1 overflow-y-auto py-3',
          collapsed ? 'flex flex-col items-center px-1.5' : 'px-2',
        )}
      >
        {sections.map((section, idx) => (
          <div key={section.id} className={cn('w-full', collapsed ? 'mb-1.5 last:mb-0' : 'mb-4 last:mb-0')}>
            {!collapsed ? (
              <h2 className="px-2 pb-1.5 text-2xs font-semibold uppercase tracking-wider text-fg-disabled">
                {section.label}
              </h2>
            ) : idx > 0 ? (
              <div className="mx-auto my-2.5 h-px w-6 bg-hairline/80" role="presentation" />
            ) : null}

            <ul className={cn('flex flex-col', collapsed ? 'items-center gap-2' : 'gap-0.5')}>
              {section.items.map((item) => {
                const Icon = item.icon
                const link = (
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center rounded-lg font-medium transition-all duration-150',
                        collapsed
                          ? 'size-9 justify-center'
                          : 'h-8 px-2 gap-2.5 text-13',
                        isActive
                          ? 'bg-accent-subtle text-accent border border-accent-border/50'
                          : 'text-fg-secondary hover:bg-surface-3 hover:text-fg',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            collapsed ? 'size-[18px]' : 'size-4',
                            'shrink-0 transition-colors',
                            isActive ? 'text-accent' : 'text-fg-muted',
                          )}
                        />
                        {!collapsed ? <span className="truncate">{item.label}</span> : null}
                        {collapsed ? <span className="sr-only">{item.label}</span> : null}
                      </>
                    )}
                  </NavLink>
                )

                return (
                  <li key={item.to} className={collapsed ? 'flex justify-center w-full' : ''}>
                    {collapsed ? (
                      <Tooltip content={item.label} side="right">
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}
