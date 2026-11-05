import { useId, useState, type InputHTMLAttributes } from 'react'
import { strings } from '../strings'
import { enrol, TooManyAttempts, WrongPassphrase } from '../lib/enrol'
import { HeaderTitle, PinkHeader } from './ui/PinkHeader'
import { PrimaryButton } from './ui/PrimaryButton'
import { Sheet } from './ui/Sheet'
import { CheckIcon, HouseIcon } from './ui/icons'

const fieldBox =
  'flex h-14 items-center rounded-control bg-surface inset-ring inset-ring-outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-primary'
const fieldInput = 'h-[52px] min-w-0 flex-1 bg-transparent text-lg font-medium text-text outline-none'

function LoginField({ label, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-base font-bold">
        {label}
      </label>
      <div className={`${fieldBox} px-4`}>
        <input id={id} className={fieldInput} {...rest} />
      </div>
    </div>
  )
}

/**
 * First-run enrolment (the Connexion screen), and re-enrolment after the server
 * refuses our token (`reenrol`, a sheet): same fields, first name prefilled.
 * Prénom is kept although the design only shows the password (DESIGN_GAP D3).
 */
export function Enrol({
  onEnrolled,
  onClose,
  initialFirstName = '',
  reenrol = false,
}: {
  onEnrolled: () => void
  onClose?: () => void
  initialFirstName?: string
  reenrol?: boolean
}) {
  const [firstName, setFirstName] = useState(initialFirstName)
  const [passphrase, setPassphrase] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const passphraseId = useId()
  const errorId = useId()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await enrol(firstName, passphrase)
      onEnrolled()
    } catch (err) {
      if (err instanceof WrongPassphrase) {
        setError(strings.enrolWrongPassphrase)
      } else if (err instanceof TooManyAttempts) {
        setError(strings.enrolTooManyAttempts)
      } else if (!navigator.onLine) {
        setError(strings.enrolOffline)
      } else {
        setError(strings.syncError)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const form = (
    <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
      <LoginField
        label={strings.firstName}
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        autoComplete="given-name"
        required
        autoFocus={!reenrol}
      />
      <div className="flex flex-col gap-2">
        <label htmlFor={passphraseId} className="text-base font-bold">
          {strings.passphrase}
        </label>
        <div className={`${fieldBox} pl-4`}>
          <input
            id={passphraseId}
            className={fieldInput}
            type={showPassphrase ? 'text' : 'password'}
            autoComplete="current-password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            aria-invalid={error === strings.enrolWrongPassphrase}
            aria-describedby={error ? errorId : undefined}
            required
            autoFocus={reenrol}
          />
          <button
            type="button"
            aria-pressed={showPassphrase}
            aria-controls={passphraseId}
            className="h-[52px] shrink-0 px-4 text-[15px] font-bold text-primary"
            onClick={() => setShowPassphrase((shown) => !shown)}
          >
            {showPassphrase ? strings.hidePassword : strings.showPassword}
          </button>
        </div>
        {error && (
          <p id={errorId} role="alert" className="m-0 text-sm font-semibold text-error">
            {error}
          </p>
        )}
      </div>
      <PrimaryButton type="submit" disabled={submitting || !firstName.trim() || !passphrase}>
        {strings.enrolSubmit}
      </PrimaryButton>
      <p className="m-0 text-sm leading-[1.4] font-medium text-text-muted">{strings.enrolHelp}</p>
    </form>
  )

  if (reenrol) {
    return (
      <Sheet title={strings.reenrolTitle} onClose={onClose ?? (() => {})}>
        <p className="m-0 -mt-1.5 text-[15px] leading-[1.4] font-medium text-text-muted">
          {strings.reenrolIntro}
        </p>
        {form}
      </Sheet>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[640px] flex-col">
      <PinkHeader variant="login">
        <div className="flex size-16 items-center justify-center rounded-[18px] bg-surface text-primary shadow-logo">
          <HouseIcon size={34} />
        </div>
        <HeaderTitle
          size="login"
          title={strings.appName}
          subtitle={
            <p className="m-0 mt-1.5 text-base leading-[1.4] font-medium text-on-primary-muted">
              {strings.enrolTagline}
            </p>
          }
        />
      </PinkHeader>
      <div className="relative mx-5 -mt-9 rounded-block bg-surface px-5 py-[22px] shadow-card">{form}</div>
      <div className="mx-6 mt-5 flex items-start gap-3">
        <CheckIcon size={22} className="shrink-0 text-primary" />
        <p className="m-0 text-[15px] leading-[1.4] font-medium text-text-muted">{strings.enrolOfflineNote}</p>
      </div>
    </div>
  )
}
