import { useEffect, useState } from 'react'

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? false)

  useEffect(() => {
    const list = window.matchMedia(query)
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(list.matches)
    list.addEventListener('change', listener)
    return () => list.removeEventListener('change', listener)
  }, [query])

  return matches
}

/** Tailwind's lg breakpoint: the point where the fixed sidebar appears. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
/** Below this the shell switches to the mobile sheet navigation. */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)')
