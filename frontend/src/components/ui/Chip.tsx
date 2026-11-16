import type { ButtonHTMLAttributes } from 'react'

/**
 * Single-choice toggle: the filter chips on Inventaire (`filter`, 40px) and the
 * category grid in the sheets (`category`, 44px). Selected = pink fill.
 */
export function Chip({
  pressed,
  size = 'filter',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  pressed: boolean
  size?: 'filter' | 'category'
}) {
  const sizing =
    size === 'filter' ? 'h-10 shrink-0 px-3.5 text-[15px] whitespace-nowrap' : 'h-11 px-1 text-sm'
  const look = pressed
    ? 'bg-primary text-on-primary'
    : 'bg-surface text-text inset-ring inset-ring-outline'
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`rounded-control font-bold ${sizing} ${look} ${className}`}
      {...rest}
    />
  )
}
