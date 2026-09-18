import { type CSSProperties, type HTMLAttributes, type MouseEvent, useRef } from 'react'
import './SpotlightCard.css'

/**
 * React Bits SpotlightCard, adapted. See SpotlightCard.css for the changes.
 *
 * The pointer position is written to CSS custom properties rather than React
 * state, so tracking the mouse never re-renders the card's contents.
 */
export interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string
}

export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'color-mix(in oklab, var(--accent) 14%, transparent)',
  style,
  onMouseMove,
  ...rest
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const node = divRef.current
    if (node) {
      const rect = node.getBoundingClientRect()
      node.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`)
      node.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`)
    }
    onMouseMove?.(event)
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={`card-spotlight ${className}`}
      // Set up front as well, so keyboard focus shows the right colour before
      // the pointer has ever moved over the card.
      style={{ ['--spotlight-color' as string]: spotlightColor, ...style } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  )
}
