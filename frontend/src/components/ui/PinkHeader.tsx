import type { ReactNode } from 'react'

/**
 * Pink header with rounded bottom corners. `app` is Inventaire's (title left,
 * actions right); `login` is Connexion's taller, stacked one.
 */
export function PinkHeader({ variant = 'app', children }: { variant?: 'app' | 'login'; children: ReactNode }) {
  const layout =
    variant === 'app'
      ? 'flex items-start justify-between gap-3 rounded-b-sheet px-5 pt-7 pb-10'
      : 'flex flex-col gap-[18px] rounded-b-[32px] px-6 py-[72px]'
  return <header className={`bg-primary text-on-primary ${layout}`}>{children}</header>
}

/** « Le Jadis » eyebrow, big title, optional line under it. */
export function HeaderTitle({
  title,
  subtitle,
  size = 'app',
}: {
  title: string
  subtitle?: ReactNode
  size?: 'app' | 'login'
}) {
  const app = size === 'app'
  return (
    <div className={`flex flex-col ${app ? 'gap-1' : 'gap-1.5'}`}>
      <span className={`font-semibold text-on-primary-muted ${app ? 'text-[15px]' : 'text-base'}`}>
        Le Jadis
      </span>
      <h1
        className={`m-0 leading-none font-extrabold tracking-[-0.03em] ${app ? 'text-[38px]' : 'text-[40px]'}`}
      >
        {title}
      </h1>
      {subtitle}
    </div>
  )
}
