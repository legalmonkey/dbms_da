import { useEffect, useRef } from 'react'

/**
 * Aero Shards - an interactive Canvas 2D particle field.
 *
 * Drifting glass prisms that react to the pointer: repelled by default,
 * attracted while the pointer is held down when holdToGather is on.
 *
 * Deliberately dependency-free. The effect is plain Canvas 2D, so there is no
 * WebGL context, no three.js, and nothing extra in the bundle.
 *
 * Three things this does that a naive canvas effect does not:
 *   - scales the backing store by devicePixelRatio, so shard edges stay sharp
 *     on high-DPI screens instead of rendering at half resolution;
 *   - clears to transparent by default so the layer composites over whatever
 *     sits beneath it, rather than painting its own opaque ground;
 *   - honours prefers-reduced-motion by painting one static frame and never
 *     starting the animation loop.
 */

export type ShardInteraction = 'repel' | 'attract'

export interface AeroShardsCanvasProps {
  /** Multiplier on shard radius. */
  shardSize?: number
  /** Gradient start colour. */
  shardColor?: string
  /** Gradient end colour, also used for the glow. */
  accentColor?: string
  /** Pass a colour to paint an opaque ground; omit to composite transparently. */
  backgroundColor?: string
  /** Drift velocity multiplier. */
  speed?: number
  /** Rotation velocity multiplier. */
  spin?: number
  /** Particle count multiplier; 1 is roughly 90 shards. */
  density?: number
  /** Radius of the pointer's influence. */
  spread?: number
  /** Parallax strength. Near shards move and scale more than far ones. */
  depth?: number
  /** How shards respond to the pointer at rest. */
  interaction?: ShardInteraction
  /** Holding the pointer down inverts the force, gathering shards to it. */
  holdToGather?: boolean
  className?: string
}

interface Shard {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  angle: number
  vSpin: number
  sides: number
  opacity: number
  /** 0 = far, 1 = near. Drives parallax, scale and alpha. */
  z: number
}

export function AeroShardsCanvas({
  shardSize = 1.1,
  shardColor = '#896ABD',
  accentColor = '#A855F7',
  backgroundColor,
  speed = 1,
  spin = 1,
  density = 1.5,
  spread = 1,
  depth = 1,
  interaction = 'repel',
  holdToGather = true,
  className,
}: AeroShardsCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    container.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      canvas.remove()
      return
    }

    let width = container.clientWidth
    let height = container.clientHeight
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    /** Size the backing store to the device pixel ratio, then draw in CSS px. */
    const resize = () => {
      width = container.clientWidth
      height = container.clientHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(container)

    const count = Math.max(1, Math.floor(90 * density))
    const shards: Shard[] = Array.from({ length: count }, () => {
      const z = Math.random()
      const t = Math.random()
      const cx = (1 - t) * width
      const cy = t * height
      const normalOffset = (Math.random() - 0.5) * Math.min(width, height) * 0.9 * spread
      const x = spread < 0.9 ? cx - normalOffset * 0.6 : Math.random() * width
      const y = spread < 0.9 ? cy + normalOffset * 0.6 : Math.random() * height
      return {
        x,
        y,
        vx: (-0.55 + (Math.random() - 0.5) * 0.4) * speed * 0.7 * (0.4 + z),
        vy: (-0.35 + (Math.random() - 0.5) * 0.3) * speed * 0.7 * (0.4 + z),
        size: (Math.random() * 14 + 6) * shardSize * (0.55 + z * 0.75),
        angle: Math.random() * Math.PI * 2,
        vSpin: (Math.random() - 0.5) * 0.02 * spin,
        sides: Math.floor(Math.random() * 3) + 3,
        opacity: (Math.random() * 0.35 + 0.22) * (0.5 + z * 0.6),
        z,
      }
    })

    const pointer = { x: width / 2, y: height / 2, active: false, held: false }

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      pointer.active = true
    }
    const onPointerDown = () => {
      if (holdToGather) pointer.held = true
    }
    const onPointerUp = () => {
      pointer.held = false
    }
    const onPointerLeave = () => {
      pointer.active = false
      pointer.held = false
    }

    // Listened for on the window rather than the container: the layer itself
    // is pointer-events:none so it can never intercept a click on the cards
    // above it, but the field should still react to the pointer anywhere.
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    window.addEventListener('pointercancel', onPointerUp, { passive: true })
    document.addEventListener('pointerleave', onPointerLeave)

    const drawShard = (shard: Shard) => {
      ctx.save()
      ctx.translate(shard.x, shard.y)
      ctx.rotate(shard.angle)

      const rx = shard.size * 1.15
      const ry = shard.size * 0.85 // Perspective tilt

      // 1. Outer biconcave disc body
      ctx.beginPath()
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
      ctx.closePath()

      // Radial gradient representing hemoglobin density (dimpled center, thick rim)
      const grad = ctx.createRadialGradient(
        -rx * 0.12, -ry * 0.15, rx * 0.05,
        0, 0, rx
      )
      grad.addColorStop(0, '#580812')     // Concave center depression
      grad.addColorStop(0.32, '#7C0D1B')   // Inner slope
      grad.addColorStop(0.68, shardColor)  // Plump toroidal rim
      grad.addColorStop(0.88, accentColor) // Illuminated rim ridge
      grad.addColorStop(1, '#8A0F1D')      // Soft outer edge

      ctx.fillStyle = grad
      ctx.globalAlpha = shard.opacity
      ctx.shadowColor = accentColor
      ctx.shadowBlur = 6 + shard.z * 12
      ctx.fill()

      // 2. Central dimple shading for 3D depth
      ctx.beginPath()
      ctx.ellipse(0, 0, rx * 0.38, ry * 0.38, 0, 0, Math.PI * 2)
      ctx.closePath()
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(25, 2, 5, 0.35)'
      ctx.fill()

      // 3. Specular highlight on the upper rim
      ctx.beginPath()
      ctx.ellipse(-rx * 0.15, -ry * 0.22, rx * 0.55, ry * 0.3, -0.25, 0, Math.PI)
      ctx.strokeStyle = 'rgba(255, 220, 230, 0.32)'
      ctx.lineWidth = Math.max(1, shard.size * 0.08)
      ctx.stroke()

      ctx.restore()
    }

    const clear = () => {
      if (backgroundColor) {
        ctx.globalAlpha = 1
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, width, height)
      } else {
        ctx.clearRect(0, 0, width, height)
      }
    }

    const step = () => {
      clear()

      const maxDist = 180 * spread
      // Held pointer inverts the resting behaviour: repel becomes gather.
      const sign =
        (interaction === 'repel' ? 1 : -1) * (pointer.held && holdToGather ? -1 : 1)

      for (const shard of shards) {
        shard.x += shard.vx
        shard.y += shard.vy
        shard.angle += shard.vSpin

        const margin = shard.size + 50
        if (shard.x < -margin) {
          shard.x = width + margin
          if (spread < 0.9) shard.y = Math.random() * height * 0.7
        }
        if (shard.x > width + margin) {
          shard.x = -margin
          if (spread < 0.9) shard.y = (0.3 + Math.random() * 0.7) * height
        }
        if (shard.y < -margin) {
          shard.y = height + margin
          if (spread < 0.9) shard.x = (0.3 + Math.random() * 0.7) * width
        }
        if (shard.y > height + margin) {
          shard.y = -margin
          if (spread < 0.9) shard.x = Math.random() * width * 0.7
        }

        if (pointer.active) {
          const dx = pointer.x - shard.x
          const dy = pointer.y - shard.y
          const dist = Math.hypot(dx, dy)
          if (dist < maxDist && dist > 0.5) {
            // Near shards react harder than far ones, so the field has depth.
            const falloff = 1 - dist / maxDist
            const force = falloff * 2.2 * sign * (0.35 + shard.z * depth)
            shard.x -= (dx / dist) * force
            shard.y -= (dy / dist) * force
          }
        }

        drawShard(shard)
      }

      frame = requestAnimationFrame(step)
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0

    const start = () => {
      cancelAnimationFrame(frame)
      if (reducedMotion.matches) {
        // One static frame: the composition still reads, nothing moves.
        clear()
        for (const shard of shards) drawShard(shard)
        return
      }
      frame = requestAnimationFrame(step)
    }

    start()
    reducedMotion.addEventListener('change', start)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      reducedMotion.removeEventListener('change', start)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      document.removeEventListener('pointerleave', onPointerLeave)
      canvas.remove()
    }
  }, [
    shardSize,
    shardColor,
    accentColor,
    backgroundColor,
    speed,
    spin,
    density,
    spread,
    depth,
    interaction,
    holdToGather,
  ])

  return <div ref={containerRef} aria-hidden="true" className={`aero-shards-container ${className ?? ''}`} />
}
