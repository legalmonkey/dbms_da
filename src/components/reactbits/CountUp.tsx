import { animate, useInView, useMotionValue, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef } from 'react'

/**
 * React Bits CountUp, adapted.
 * Upstream: https://reactbits.dev/r/CountUp-TS-CSS.json
 *
 * Changes from upstream:
 *   - FIXED a correctness defect. Upstream drives the number with an overdamped
 *     spring that approaches its target asymptotically and stops at a rest
 *     threshold. Measured here, a revenue tile of Rs 3,27,470 still read
 *     Rs 3,27,464 after 6.5 seconds and never corrected. Small counts hid it
 *     by rounding; currency did not. This version eases over exactly
 *     `duration` seconds and always finishes on the precise value.
 *   - Formats with en-IN grouping to match every other number in the app
 *     (upstream hardcodes en-US, which groups 1,00,000 as 100,000).
 *   - Honours prefers-reduced-motion by rendering the final value directly.
 *   - Accepts a prefix, for currency.
 *   - Re-animates from the current figure when `to` changes after a refetch.
 *
 * Only ever given real values from the data layer. It animates a number the
 * system actually holds; it never invents one.
 */
interface CountUpProps {
  to: number
  from?: number
  direction?: 'up' | 'down'
  delay?: number
  duration?: number
  className?: string
  startWhen?: boolean
  separator?: string
  prefix?: string
  onStart?: () => void
  onEnd?: () => void
}

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 1,
  className = '',
  startWhen = true,
  separator = ',',
  prefix = '',
  onStart,
  onEnd,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const reducedMotion = useReducedMotion()
  const motionValue = useMotionValue(direction === 'down' ? to : from)
  const isInView = useInView(ref, { once: true, margin: '0px' })

  const getDecimalPlaces = (num: number): number => {
    const str = num.toString()
    if (str.includes('.')) {
      const decimals = str.split('.')[1] ?? ''
      if (Number.parseInt(decimals, 10) !== 0) return decimals.length
    }
    return 0
  }

  const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to))

  const formatValue = useCallback(
    (latest: number) => {
      const hasDecimals = maxDecimals > 0
      const formatted = new Intl.NumberFormat('en-IN', {
        useGrouping: Boolean(separator),
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0,
      }).format(latest)
      const grouped = separator && separator !== ',' ? formatted.replace(/,/g, separator) : formatted
      return `${prefix}${grouped}`
    },
    [maxDecimals, separator, prefix],
  )

  const target = direction === 'down' ? from : to

  // Paint a value immediately so the element is never blank.
  useEffect(() => {
    if (ref.current) ref.current.textContent = formatValue(motionValue.get())
  }, [formatValue, motionValue])

  useEffect(() => {
    const unsubscribe = motionValue.on('change', (latest) => {
      if (ref.current) ref.current.textContent = formatValue(latest)
    })
    return () => unsubscribe()
  }, [motionValue, formatValue])

  useEffect(() => {
    if (!isInView || !startWhen) return

    const land = () => {
      motionValue.jump(target)
      if (ref.current) ref.current.textContent = formatValue(target)
    }

    if (reducedMotion) {
      land()
      onEnd?.()
      return
    }

    onStart?.()
    let controls: ReturnType<typeof animate> | undefined
    const startTimer = setTimeout(() => {
      controls = animate(motionValue, target, {
        duration,
        ease: EASE_OUT,
        onComplete: () => {
          land()
          onEnd?.()
        },
      })
    }, delay * 1000)

    return () => {
      clearTimeout(startTimer)
      controls?.stop()
    }
  }, [isInView, startWhen, target, delay, duration, reducedMotion, motionValue, formatValue, onStart, onEnd])

  return <span className={className} ref={ref} />
}
