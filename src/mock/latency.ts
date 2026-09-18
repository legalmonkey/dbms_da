/**
 * Simulated network latency, plus dev-only switches so that loading and error
 * states can be demonstrated on demand instead of only in theory.
 */

interface DemoControls {
  /** Multiplies the base delay. 1 = normal, 8 = visibly slow. */
  slowFactor: number
  /** When true the next request rejects with a 500. */
  forceError: boolean
}

const controls: DemoControls = { slowFactor: 1, forceError: false }

export const demoControls = {
  get: (): DemoControls => ({ ...controls }),
  setSlow: (slow: boolean) => {
    controls.slowFactor = slow ? 8 : 1
  },
  setForceError: (force: boolean) => {
    controls.forceError = force
  },
}

export const shouldForceError = () => controls.forceError

export function delay(): Promise<void> {
  const base = 180 + Math.random() * 270
  return new Promise((resolve) => setTimeout(resolve, base * controls.slowFactor))
}
