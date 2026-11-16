import { strings } from '../../strings'
import { CloudUpIcon } from './icons'

/** Pink circle with a cloud-up arrow: this article has changes not sent yet. */
export function PendingIcon({ decorative = false }: { decorative?: boolean }) {
  // Decorative next to text that already says « Pas encore envoyé ».
  const a11y = decorative
    ? ({ 'aria-hidden': true } as const)
    : ({ role: 'img', 'aria-label': strings.pending, title: strings.pending } as const)
  return (
    <span
      {...a11y}
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary"
    >
      <CloudUpIcon size={14} />
    </span>
  )
}

/** « Épuisé » tag, shown when quantity is 0. Always written, never colour alone. */
export function EmptyTag() {
  return (
    <span className="rounded-[6px] bg-empty px-[7px] py-0.5 text-xs font-bold text-on-primary">
      {strings.empty}
    </span>
  )
}
