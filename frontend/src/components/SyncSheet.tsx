import { strings } from '../strings'
import type { LocalItem } from '../db'
import type { SyncStatus } from '../lib/syncStatus'
import { formatRelativeMoment, formatShortMoment } from '../lib/formatDate'
import { describeChange } from '../lib/describeChange'
import { Sheet } from './ui/Sheet'
import { PendingIcon } from './ui/marks'

function statusText(status: SyncStatus, pendingCount: number): { title: string; body?: string } {
  switch (status) {
    case 'offline':
      return { title: strings.syncOfflineTitle, body: strings.syncOfflineBody(pendingCount) }
    case 'syncing':
      return { title: strings.syncingTitle }
    case 'unauthorized':
      return { title: strings.reenrolTitle, body: strings.syncUnauthorized }
    case 'failed':
      return { title: strings.syncError, body: strings.syncFailedBody }
    case 'pending':
      return { title: strings.syncPendingTitle, body: strings.syncPendingBody(pendingCount) }
    case 'done':
      return { title: strings.syncDoneTitle }
  }
}

/** Synchronisation sheet: status card, last send, and what is still waiting. */
export function SyncSheet({
  status,
  pending,
  lastSyncedAt,
  onRetry,
  onReenrol,
  onClose,
}: {
  status: SyncStatus
  /** Unsent rows, newest change first. */
  pending: LocalItem[]
  lastSyncedAt: string | undefined
  onRetry: () => void
  onReenrol: () => void
  onClose: () => void
}) {
  const { title, body } = statusText(status, pending.length)
  const action =
    status === 'unauthorized'
      ? { label: strings.reenrolAction, onClick: onReenrol }
      : status === 'done' || status === 'syncing'
        ? null
        : { label: strings.retry, onClick: onRetry }

  return (
    <Sheet title={strings.syncTitle} onClose={onClose}>
      <div
        role="status"
        className="flex flex-col gap-2 rounded-block bg-primary p-[18px] text-on-primary"
      >
        <span className="text-[19px] font-extrabold">{title}</span>
        {body && <span className="text-[15px] leading-[1.4] font-medium text-tint">{body}</span>}
        <span className="text-sm font-medium text-tint">
          {lastSyncedAt ? strings.lastSent(formatRelativeMoment(lastSyncedAt)) : strings.neverSent}
        </span>
        {action && (
          <button
            type="button"
            className="mt-1 h-12 self-start rounded-control bg-surface px-5 text-base font-extrabold text-primary"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
      </div>

      {pending.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="sync-pending-title">
          <h3 id="sync-pending-title" className="m-0 flex items-center gap-2 text-[17px] font-extrabold">
            <PendingIcon decorative />
            {strings.pending}
          </h3>
          <ul className="m-0 flex list-none flex-col rounded-card p-0 inset-ring inset-ring-divider-strong">
            {pending.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-0.5 border-b border-divider px-4 py-[11px] last:border-b-0"
              >
                <span className="text-[15px] font-bold">{item.name}</span>
                <span className="text-sm font-medium text-text-muted">
                  {describeChange(item)} · {formatShortMoment(item.updated_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Sheet>
  )
}
