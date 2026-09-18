/**
 * Deterministic pseudo-random source.
 *
 * A fixed seed means every reload produces byte-identical demo data, so
 * screenshots taken while preparing the viva still match what the examiner
 * sees on screen.
 */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const SEED = 20260915

export function makeRandom(seed: number = SEED) {
  const next = mulberry32(seed)

  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))

  const pick = <T,>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error('pick() called with an empty list')
    return items[int(0, items.length - 1)] as T
  }

  const sample = <T,>(items: readonly T[], count: number): T[] => {
    const pool = [...items]
    const taken: T[] = []
    const limit = Math.min(count, pool.length)
    for (let index = 0; index < limit; index += 1) {
      taken.push(...pool.splice(int(0, pool.length - 1), 1))
    }
    return taken
  }

  const chance = (probability: number) => next() < probability

  /** A date `daysAgo` back from the fixed "today", at a plausible clinic hour. */
  const dateDaysAgo = (daysAgo: number, hour = int(7, 18), minute = int(0, 59)) => {
    const date = new Date(TODAY)
    date.setDate(date.getDate() - daysAgo)
    date.setHours(hour, minute, 0, 0)
    return date
  }

  return { next, int, pick, sample, chance, dateDaysAgo }
}

/** The demo's fixed "today". Keeps relative dates stable across sessions. */
export const TODAY = new Date('2026-09-15T09:00:00+05:30')

/** ISO 8601 with the +05:30 offset the API contract requires. */
export function toIso(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}+05:30`
  )
}

/** Date-only, for DOB and Order_Date. */
export function toIsoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
