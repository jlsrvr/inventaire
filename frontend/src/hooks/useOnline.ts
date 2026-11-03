import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

/** navigator.onLine, re-rendering whenever it changes. */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine)
}
