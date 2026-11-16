import type { SyncError } from '../hooks/useSync'

/** What the sync button and the Synchronisation sheet show, in priority order. */
export type SyncStatus = 'offline' | 'syncing' | 'unauthorized' | 'failed' | 'pending' | 'done'

export function syncStatusOf({
  online,
  syncing,
  error,
  pendingCount,
}: {
  online: boolean
  syncing: boolean
  error: SyncError
  pendingCount: number
}): SyncStatus {
  if (!online) return 'offline'
  if (syncing) return 'syncing'
  if (error === 'unauthorized') return 'unauthorized'
  if (error === 'failed') return 'failed'
  return pendingCount > 0 ? 'pending' : 'done'
}
