import {
  type ReactNode,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  preference: ThemePreference
  /** The theme actually applied right now, after resolving 'system'. */
  resolved: 'light' | 'dark'
  setPreference: (preference: ThemePreference) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'lims.theme'

function readStored(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
  } catch {
    return 'system'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStored)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }, [])

  const resolved: 'light' | 'dark' =
    preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved)
  }, [resolved])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
