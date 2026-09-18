import { ChevronLeft, ChevronRight } from 'lucide-react'
import { type ComponentType, useEffect, useRef, useState } from 'react'

export interface CarouselItem {
  id: string
  title: string
  icon: ComponentType<{ className?: string }>
  tags: string[]
  shortDesc: string
  method: string
  statTime: string
  specimen: string
  analyzer: string
  clinicalUtility: string
  qcStandard: string
}

interface SemiCircleCarouselProps {
  items: CarouselItem[]
  activeIndex: number
  onChangeIndex: (index: number) => void
}

export function SemiCircleCarousel({
  items,
  activeIndex,
  onChangeIndex,
}: SemiCircleCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  const count = items.length

  const handlePrev = () => {
    const next = (activeIndex - 1 + count) % count
    onChangeIndex(next)
  }

  const handleNext = () => {
    const next = (activeIndex + 1) % count
    onChangeIndex(next)
  }

  // Keyboard navigation when focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, count])

  // Touch swipe support
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0]
    if (touch) setTouchStart(touch.clientX)
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const touch = e.changedTouches[0]
    if (!touch) return
    const touchEnd = touch.clientX
    const diff = touchStart - touchEnd
    if (diff > 40) {
      handleNext()
    } else if (diff < -40) {
      handlePrev()
    }
    setTouchStart(null)
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      aria-label="Clinical Disciplines Semi-Circle Carousel"
      className="relative mx-auto w-full max-w-5xl select-none py-4 outline-none focus-visible:ring-1 focus-visible:ring-rose-500/50"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* 3D Curved Arc Stage */}
      <div
        className="relative mx-auto flex h-[410px] sm:h-[430px] w-full items-center justify-center overflow-hidden"
        style={{ perspective: '1100px', perspectiveOrigin: '50% 65%' }}
      >
        {items.map((item, index) => {
          const Icon = item.icon

          // Compute signed offset from active index
          let offset = index - activeIndex
          if (offset > count / 2) offset -= count
          if (offset < -count / 2) offset += count

          const isCenter = offset === 0

          // Semi-circle curved geometric parameters:
          // X spreads horizontally along arc, Y curves downward into the arc arch,
          // rotateZ tilts tangent to the semi-circle, rotateY turns inward facing center focus
          let translateX = 0
          let translateY = 0
          let translateZ = 0
          let rotateZ = 0
          let rotateY = 0
          let scale = 1
          let opacity = 1
          let zIndex = 30

          if (isCenter) {
            translateX = 0
            translateY = 0
            translateZ = 70
            rotateZ = 0
            rotateY = 0
            scale = 1.05
            opacity = 1
            zIndex = 40
          } else if (offset === -1) {
            translateX = -290
            translateY = 32
            translateZ = -40
            rotateZ = -6
            rotateY = 18
            scale = 0.88
            opacity = 0.75
            zIndex = 25
          } else if (offset === 1) {
            translateX = 290
            translateY = 32
            translateZ = -40
            rotateZ = 6
            rotateY = -18
            scale = 0.88
            opacity = 0.75
            zIndex = 25
          } else if (offset <= -2) {
            translateX = -490
            translateY = 90
            translateZ = -150
            rotateZ = -14
            rotateY = 32
            scale = 0.72
            opacity = 0.35
            zIndex = 10
          } else if (offset >= 2) {
            translateX = 490
            translateY = 90
            translateZ = -150
            rotateZ = 14
            rotateY = -32
            scale = 0.72
            opacity = 0.35
            zIndex = 10
          }

          return (
            <div
              key={item.id}
              onClick={() => onChangeIndex(index)}
              style={{
                transform: `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                zIndex,
                opacity,
                transition: 'transform 480ms cubic-bezier(0.18, 0.9, 0.28, 1), opacity 480ms ease, box-shadow 480ms ease',
              }}
              className={`absolute top-4 w-[280px] sm:w-[310px] cursor-pointer rounded-2xl p-6 text-left backdrop-blur-xl transition-all ${
                isCenter
                  ? 'glass-surface border-rose-500/80 bg-rose-950/45 ring-2 ring-rose-500/50 shadow-[0_15px_45px_rgba(225,29,72,0.35)]'
                  : 'border border-white/10 bg-[#120a10]/85 hover:border-rose-500/40 hover:opacity-90'
              }`}
            >
              {/* Top Header & Status Badge */}
              <div className="flex items-center justify-between">
                <div
                  className={`flex size-12 items-center justify-center rounded-xl border transition-all ${
                    isCenter
                      ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-900/60'
                      : 'bg-rose-500/15 border-rose-500/25 text-rose-400'
                  }`}
                >
                  <Icon className="size-5" />
                </div>

                {isCenter ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/25 border border-rose-400/40 px-2.5 py-0.5 text-[10px] font-bold text-rose-300">
                    <span className="size-1.5 rounded-full bg-rose-400 animate-pulse" />
                    ACTIVE
                  </span>
                ) : (
                  <span className="text-[11px] font-mono font-medium text-white/40">
                    #{index + 1}
                  </span>
                )}
              </div>

              {/* Title */}
              <h4 className="mt-4 text-base font-bold tracking-tight text-white line-clamp-1">
                {item.title}
              </h4>

              {/* Biomarker Tags */}
              <div className="mt-2.5 flex flex-wrap gap-1.5 min-h-[46px]">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-rose-950/60 border border-rose-500/20 px-1.5 py-0.5 text-[10px] font-mono text-rose-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Short Clinical Description */}
              <p className="mt-2.5 text-xs leading-relaxed text-[var(--landing-ink-muted)] line-clamp-3">
                {item.shortDesc}
              </p>

              {/* Footer specs */}
              <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between text-[11px] text-rose-300/80 font-medium">
                <span className="truncate max-w-[150px]">{item.method}</span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-white/60 flex-shrink-0">
                  {item.statTime}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation Controls & Carousel Indicators */}
      <div className="mt-2 flex items-center justify-center gap-4">
        {/* Prev button */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous discipline"
          className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-md transition-all hover:bg-rose-950/60 hover:border-rose-500/40 hover:scale-110 active:scale-95 shadow-lg shadow-black/40 cursor-pointer"
        >
          <ChevronLeft className="size-5 text-rose-300" />
        </button>

        {/* Semi-circle dots indicator */}
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3.5 py-1.5 backdrop-blur-md">
          {items.map((item, idx) => {
            const isCurrent = idx === activeIndex
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeIndex(idx)}
                aria-label={`Go to ${item.title}`}
                className={`transition-all rounded-full cursor-pointer ${
                  isCurrent
                    ? 'w-7 h-2 bg-gradient-to-r from-rose-500 to-red-500 shadow-sm shadow-rose-500/50'
                    : 'size-2 bg-white/25 hover:bg-white/50'
                }`}
              />
            )
          })}
        </div>

        {/* Next button */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next discipline"
          className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur-md transition-all hover:bg-rose-950/60 hover:border-rose-500/40 hover:scale-110 active:scale-95 shadow-lg shadow-black/40 cursor-pointer"
        >
          <ChevronRight className="size-5 text-rose-300" />
        </button>
      </div>
    </div>
  )
}
