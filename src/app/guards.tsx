import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'
import type { Permission, Role } from '@/types'

/** Blocks a route until a session exists, remembering the intended URL. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, initialising } = useAuth()
  const location = useLocation()

  if (initialising) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Spinner label="Restoring session" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}

/**
 * Enforces the same permission the navigation uses to decide visibility, so a
 * hand-typed URL cannot reach a screen the role is not entitled to.
 */
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission
  children: ReactNode
}) {
  const { can } = useAuth()
  return can(permission) ? <>{children}</> : <Navigate to="/403" replace />
}

/**
 * For screens scoped to one identity rather than a capability. The patient
 * workspace shows one person's record, so holding a permission is not enough:
 * the session has to belong to a patient.
 */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { session } = useAuth()
  return session && roles.includes(session.user.role) ? (
    <>{children}</>
  ) : (
    <Navigate to="/403" replace />
  )
}
