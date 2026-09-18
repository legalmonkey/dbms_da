/**
 * Chroma Grid - the animated background plane.
 *
 * Two stacked layers: fixed-opacity grid lines that drift one cell per cycle,
 * and a blurred hue wash beneath them that breathes. Splitting them keeps the
 * lines from strobing as the colour shifts.
 *
 * Purely decorative, so it is hidden from assistive technology and never
 * receives pointer events.
 */
export function ChromaGrid() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="chroma-wash" />
      <div className="chroma-grid" />
    </div>
  )
}
