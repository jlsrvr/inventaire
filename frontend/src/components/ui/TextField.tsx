import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

/** Labelled 52px text input used in the sheets (Nom, Unité…). */
export function TextField({
  label,
  hint,
  id,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode }) {
  const generated = useId()
  const inputId = id ?? generated
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[15px] font-bold">
        {label}
        {hint && <span className="font-medium text-text-muted"> {hint}</span>}
      </label>
      <input
        id={inputId}
        className={`h-[52px] rounded-control bg-surface px-3.5 text-[17px] font-semibold text-text inset-ring inset-ring-outline focus:outline-2 focus:outline-offset-1 focus:outline-primary ${className}`}
        {...rest}
      />
    </div>
  )
}
