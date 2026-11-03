import { useState } from 'react'
import { strings } from '../strings'
import { enrol, TooManyAttempts, WrongPassphrase } from '../lib/enrol'

export const ENROL_TITLE_ID = 'enrol-title'

/**
 * First-run enrolment, and re-enrolment after the server refuses our token
 * (`reenrol`): same form, with the first name prefilled.
 */
export function Enrol({
  onEnrolled,
  initialFirstName = '',
  reenrol = false,
}: {
  onEnrolled: () => void
  initialFirstName?: string
  reenrol?: boolean
}) {
  const [firstName, setFirstName] = useState(initialFirstName)
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

  const fieldClasses =
    'rounded-md border border-[#e7cba9] bg-white p-2 text-slate-900 focus:outline focus:outline-2 focus:outline-accent focus:outline-offset-1'

  return (
    <div
      className={
        reenrol
          ? 'w-full max-w-[480px] rounded-t-xl border-t-4 border-accent bg-white p-4'
          : 'mx-auto mt-12 max-w-[360px] p-4'
      }
    >
      <h1 id={ENROL_TITLE_ID} className="text-accent-hover">
        {reenrol ? strings.reenrolTitle : strings.enrolTitle}
      </h1>
      <p>{reenrol ? strings.reenrolIntro : strings.enrolIntro}</p>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1">
          {strings.firstName}
          <input
            className={fieldClasses}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            autoFocus={!reenrol}
          />
        </label>
        <label className="flex flex-col gap-1">
          {strings.passphrase}
          <input
            className={fieldClasses}
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            required
            autoFocus={reenrol}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="rounded-md border border-accent bg-accent px-3 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:border-[#e2b78e] disabled:bg-[#e2b78e]"
          disabled={submitting || !firstName || !passphrase}
        >
          {strings.enrolSubmit}
        </button>
      </form>
    </div>
  )
}
