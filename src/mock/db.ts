import { type SeedData, buildSeed } from './seed'

/**
 * Mutable in-memory store backing the mock API.
 *
 * State is mirrored to sessionStorage so an order booked mid-demonstration
 * survives a page refresh. Clearing it, or opening a new tab, rebuilds from
 * the deterministic seed.
 *
 * Nothing outside src/mock imports this module. UI code reaches data only
 * through a service, and every service goes through services/http.ts.
 */

const STORAGE_KEY = 'lims.mock.db.v1'

function load(): SeedData {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored) as SeedData
  } catch {
    // Private browsing, disabled storage, or corrupt JSON: fall through to a
    // fresh seed rather than leaving the application without data.
  }
  return buildSeed()
}

let state: SeedData = load()

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage is a convenience here, never a requirement.
  }
}

export const db = {
  get: (): SeedData => state,

  /** Apply a mutation and mirror the result to sessionStorage. */
  update<T>(mutate: (draft: SeedData) => T): T {
    const result = mutate(state)
    persist()
    return result
  },

  /** Discard demo edits and rebuild from the fixed seed. */
  reset() {
    state = buildSeed()
    persist()
  },
}

// Dev-only handle for inspecting the seeded store from the browser console.
// Stripped from production builds by the DEV guard.
if (import.meta.env.DEV) {
  ;(globalThis as unknown as { __limsDb?: typeof db }).__limsDb = db
}

/** Sequential identifier helper, e.g. nextId(existing, 'P', 4) -> 'P0049'. */
export function nextId(existing: string[], prefix: string, width: number): string {
  const highest = existing.reduce((max, id) => {
    const parsed = Number.parseInt(id.slice(prefix.length), 10)
    return Number.isFinite(parsed) && parsed > max ? parsed : max
  }, 0)
  return `${prefix}${String(highest + 1).padStart(width, '0')}`
}
