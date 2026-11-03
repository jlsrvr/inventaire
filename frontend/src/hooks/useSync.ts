import { useCallback, useEffect, useRef, useState } from 'react'
import { sync, Unauthorized } from '../lib/sync'

/** How long after a local edit to push it — batches a burst of +/- taps. */
export const EDIT_SYNC_DELAY_MS = 1500
/** Background sync while the app stays open and online (e.g. at the flat). */
export const PERIODIC_SYNC_MS = 60_000

export type SyncError = 'unauthorized' | 'failed' | null

/**
 * Keeps the local DB in step with the server. Syncs on start, when the
 * connection comes back, when the app returns to the foreground, periodically,
 * and shortly after each local edit (`requestSync`). Overlapping triggers are
 * coalesced by `sync()` itself.
 */
export function useSync(enabled: boolean) {
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<SyncError>(null)
  const mounted = useRef(true)
  const editTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const run = useCallback(async () => {
    if (!enabled || !navigator.onLine) return
    setSyncing(true)
    try {
      await sync()
      if (mounted.current) setError(null)
    } catch (err) {
      if (mounted.current) setError(err instanceof Unauthorized ? 'unauthorized' : 'failed')
    } finally {
      if (mounted.current) setSyncing(false)
    }
  }, [enabled])

  useEffect(() => {
    mounted.current = true
    if (!enabled) return

    const onVisible = () => {
      if (document.visibilityState === 'visible') run()
    }

    // Deferred a tick so the first sync's state updates happen outside the effect.
    const initial = setTimeout(run, 0)
    window.addEventListener('online', run)
    document.addEventListener('visibilitychange', onVisible)
    const interval = setInterval(run, PERIODIC_SYNC_MS)
    return () => {
      mounted.current = false
      window.removeEventListener('online', run)
      document.removeEventListener('visibilitychange', onVisible)
      clearTimeout(initial)
      clearInterval(interval)
      clearTimeout(editTimer.current)
    }
  }, [enabled, run])

  const requestSync = useCallback(() => {
    clearTimeout(editTimer.current)
    editTimer.current = setTimeout(run, EDIT_SYNC_DELAY_MS)
  }, [run])

  return { syncing, error, requestSync, syncNow: run }
}
