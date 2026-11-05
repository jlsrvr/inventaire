import type { ReactNode } from 'react'
import { MinusIcon, PlusIcon } from './icons'

/**
 * − / value / + control. `row` is the 44px one in the inventory list, `sheet`
 * the 48px one in the Modifier / Nouvel article quantity row. `value` is a
 * node so the sheets can render a typeable number (decimals, D2).
 */
export function Stepper({
  value,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
  decreaseDisabled = false,
  size = 'row',
  valueClassName = 'text-text',
}: {
  value: ReactNode
  onDecrease: () => void
  onIncrease: () => void
  decreaseLabel: string
  increaseLabel: string
  decreaseDisabled?: boolean
  size?: 'row' | 'sheet'
  valueClassName?: string
}) {
  const row = size === 'row'
  const button = `flex shrink-0 items-center justify-center rounded-full ${row ? 'size-11' : 'size-12'}`
  const iconSize = row ? 20 : 22
  return (
    <div className={`flex shrink-0 items-center ${row ? 'gap-1' : 'gap-1.5'}`}>
      <button
        type="button"
        aria-label={decreaseLabel}
        className={`${button} bg-surface text-primary inset-ring inset-ring-outline disabled:cursor-not-allowed disabled:opacity-40`}
        onClick={onDecrease}
        disabled={decreaseDisabled}
      >
        <MinusIcon size={iconSize} />
      </button>
      <span
        className={`text-center font-extrabold tabular-nums ${row ? 'min-w-9 text-[22px]' : 'min-w-11 text-[30px] tracking-[-0.02em]'} ${valueClassName}`}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={increaseLabel}
        className={`${button} bg-primary text-on-primary`}
        onClick={onIncrease}
      >
        <PlusIcon size={iconSize} />
      </button>
    </div>
  )
}
