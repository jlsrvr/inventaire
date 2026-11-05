import type { ButtonHTMLAttributes } from 'react'

/** The big pink call-to-action: « Entrer », « Enregistrer », « Ajouter un article »… */
export function PrimaryButton({ className = '', type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`flex h-[58px] w-full items-center justify-center gap-2 rounded-card bg-primary text-lg font-extrabold text-on-primary shadow-button disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${className}`}
      {...rest}
    />
  )
}
