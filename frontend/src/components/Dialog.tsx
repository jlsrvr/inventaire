import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Bottom-sheet modal: announced as a dialog, closes on Escape, keeps Tab
 * focus inside, and gives focus back to whatever opened it.
 */
export function Dialog({
  labelledBy,
  onClose,
  children,
}: {
  labelledBy: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  // Captured on first render, before a child's autoFocus moves focus inside.
  const [opener] = useState(() => document.activeElement as HTMLElement | null)
  const onCloseRef = useRef(onClose)
  useLayoutEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const node = ref.current
    // Children may autoFocus a field; only grab focus if nothing inside has it.
    if (node && !node.contains(document.activeElement)) {
      node.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !node) return
      const focusable = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      opener?.focus?.()
    }
  }, [opener])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className="fixed inset-0 flex items-end justify-center bg-black/40"
    >
      {children}
    </div>
  )
}
