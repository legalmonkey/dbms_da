import type { CSSProperties, PointerEvent, ReactNode } from 'react'
import { useCallback, useRef } from 'react'
import { cn } from '@/lib/cn'

/**
 * Cursor-following highlight.
 *
 * The pointer position is written to CSS custom properties on the element
 * rather than held in React state, so moving the mouse never triggers a
 * re-render.
 */
export function Spotlight({
  children,
  className,
  color,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  /** Overrides the highlight colour, e.g. a themed accent on interior tiles. */
  color?: string
  as?: 'div' | 'article' | 'section'
}) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const node = ref.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    node.style.setProperty('--spot-x', `${event.clientX - rect.left}px`)
    node.style.setProperty('--spot-y', `${event.clientY - rect.top}px`)
  }, [])

  return (
    <Tag
      ref={ref}
      onPointerMove={handleMove}
      className={cn('spotlight', className)}
      style={color ? ({ ['--spot-color' as string]: color } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  )
}

/**
 * Standalone handler for elements that already have the `spotlight` class and
 * do not need the wrapper component - a button in a grid, for instance.
 */
export function spotlightMove(event: PointerEvent<HTMLElement>) {
  const node = event.currentTarget
  const rect = node.getBoundingClientRect()
  node.style.setProperty('--spot-x', String(event.clientX - rect.left) + 'px')
  node.style.setProperty('--spot-y', String(event.clientY - rect.top) + 'px')
}
