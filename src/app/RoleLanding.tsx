import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_HOME } from './navigation'

/** Sends each role to the screen it actually starts its day on. */
export function RoleLanding() {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  return <Navigate to={ROLE_HOME[session.user.role] ?? '/dashboard'} replace />
}
