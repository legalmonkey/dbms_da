import type { ReactNode } from 'react'
import DecryptedText from '@/components/reactbits/DecryptedText'

/**
 * Header for a role workspace.
 *
 * The title resolves once when it scrolls into view, using only its own
 * letters so it never flashes symbols. It is the only animated text in the
 * workspace; identifiers and values below it are always rendered plainly.
 */
export function WorkspaceHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
}: {
  eyebrow: string
  title: string
  description?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-hairline pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-accent">{eyebrow}</p>
        <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-fg">
          <DecryptedText
            text={title}
            animateOn="view"
            sequential
            revealDirection="start"
            useOriginalCharsOnly
            speed={26}
            encryptedClassName="text-fg-disabled"
          />
        </h1>
        {description ? <p className="mt-1.5 max-w-2xl text-13 text-fg-muted">{description}</p> : null}
        {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
