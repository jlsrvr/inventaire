import type { HTMLAttributes } from 'react'

/** White rounded card with the soft pink shadow. */
export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col rounded-card bg-surface shadow-card ${className}`} {...rest} />
}
