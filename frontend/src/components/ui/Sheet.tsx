import { useId, type ReactNode } from 'react'
import { Dialog } from '../Dialog'
import { strings } from '../../strings'
import { CloseIcon } from './icons'

/**
 * Slide-up sheet (Modifier, Nouvel article, Synchronisation, Aide). Built on
 * Dialog, so it keeps the focus trap, Escape and backdrop tap to close. The
 * content scrolls once it is taller than the screen (small phones, keyboard).
 */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const titleId = useId()
  return (
    <Dialog labelledBy={titleId} onClose={onClose}>
      <section className="flex max-h-[92dvh] w-full max-w-[640px] flex-col gap-3.5 overflow-y-auto rounded-t-sheet bg-surface px-5 pt-2.5 pb-[calc(28px+env(safe-area-inset-bottom))] shadow-sheet">
        <div aria-hidden="true" className="h-[5px] w-10 shrink-0 self-center rounded-full bg-handle" />
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="m-0 text-2xl leading-[1.1] font-extrabold tracking-[-0.02em]">
            {title}
          </h2>
          <button
            type="button"
            aria-label={strings.close}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-tint text-primary-dark"
            onClick={onClose}
          >
            <CloseIcon size={20} />
          </button>
        </div>
        {children}
      </section>
    </Dialog>
  )
}
