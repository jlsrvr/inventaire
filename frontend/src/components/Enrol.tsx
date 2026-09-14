import { useState } from 'react'
import { strings } from '../strings'
import { enrol, WrongPassphrase } from '../lib/enrol'

export function Enrol({ onEnrolled }: { onEnrolled: () => void }) {
  const [firstName, setFirstName] = useState('')
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
      } else if (!navigator.onLine) {
        setError(strings.enrolOffline)
      } else {
        setError(strings.syncError)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="enrol">
      <h1>{strings.enrolTitle}</h1>
      <p>{strings.enrolIntro}</p>
      <form onSubmit={handleSubmit}>
        <label>
          {strings.firstName}
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label>
          {strings.passphrase}
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting || !firstName || !passphrase}>
          {strings.enrolSubmit}
        </button>
      </form>
    </div>
  )
}
