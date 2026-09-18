import {
  type ReactNode,
  createContext,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { ROLE_PERMISSIONS, type Permission, type Role, type Session, type SessionUser } from '@/types'
import { DEMO_USERS } from './demoUsers'

const STORAGE_KEY = 'lims.demo.session'

export interface AuthContextValue {
  session: Session | null
  /** True until the stored session has been read: prevents a login flash. */
  initialising: boolean
  loginAs: (role: Role, userOverride?: Partial<SessionUser>) => void
  logout: () => void
  /** Permission check. Components ask this, never `role === 'admin'`. */
  can: (permission: Permission) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

function buildSession(role: Role, userOverride?: Partial<SessionUser>): Session {
  const baseUser = DEMO_USERS[role]
  const user = userOverride ? { ...baseUser, ...userOverride, role } : baseUser
  return {
    user,
    permissions: ROLE_PERMISSIONS[role],
    issuedAt: new Date().toISOString(),
  }
}

function readStored(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { role?: Role; userOverride?: Partial<SessionUser> }
    return parsed.role && parsed.role in DEMO_USERS ? buildSession(parsed.role, parsed.userOverride) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  /**
   * Read synchronously during the first render. Restoring the session in an
   * effect instead made every page load paint a loading spinner for one frame
   * before the stored session arrived.
   *
   * INTEGRATION POINT: a real auth check (validating a token against the
   * server) is asynchronous. When that lands, initialise `session` to null,
   * hold `initialising` true until the check resolves, and RequireAuth's
   * existing loading branch starts doing real work with no other changes.
   */
  const [session, setSession] = useState<Session | null>(readStored)
  const initialising = false

  const loginAs = useCallback((role: Role, userOverride?: Partial<SessionUser>) => {
    const next = buildSession(role, userOverride)
    setSession(next)
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ role, userOverride }))
    } catch {
      /* Private browsing can refuse storage; the in-memory session still works. */
    }
  }, [])

  const logout = useCallback(() => {
    setSession(null)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const can = useCallback(
    (permission: Permission) => session?.permissions.includes(permission) ?? false,
    [session],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ session, initialising, loginAs, logout, can }),
    [session, initialising, loginAs, logout, can],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
