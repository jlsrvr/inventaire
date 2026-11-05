import { strings } from '../strings'
import type { SyncStatus } from '../lib/syncStatus'
import { CloudOffIcon, CloudUpIcon } from './ui/icons'

/** White header button that opens Synchronisation, with the unsent count as a badge. */
export function SyncButton({
  status,
  pendingCount,
  onClick,
}: {
  status: SyncStatus
  pendingCount: number
  onClick: () => void
}) {
  const Icon = status === 'offline' ? CloudOffIcon : CloudUpIcon
  return (
    <button
      type="button"
      aria-label={strings.syncButton(strings.syncState[status], pendingCount)}
      className="relative flex size-12 shrink-0 items-center justify-center rounded-control bg-surface text-text shadow-raised"
      onClick={onClick}
    >
      <Icon size={24} />
      {pendingCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-empty px-1.5 text-xs font-extrabold text-on-primary"
        >
          {pendingCount}
        </span>
      )}
    </button>
  )
}
