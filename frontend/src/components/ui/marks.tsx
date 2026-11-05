import { strings } from '../../strings'
import { CloudUpIcon } from './icons'

/** Pink circle with a cloud-up arrow: this article has changes not sent yet. */
export function PendingIcon() {
  return (
    <span
      role="img"
      aria-label={strings.pending}
      title={strings.pending}
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
