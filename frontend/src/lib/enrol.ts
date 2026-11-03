import { setMeta } from '../db'
import type { AuthResponse } from '../api/types'
import { API_URL } from './api'

export class WrongPassphrase extends Error {}
export class TooManyAttempts extends Error {}

/**
 * Exchange the shared passphrase for a long-lived token and remember the user's
 * first name. Requires network — enrolment is the one online-only step.
 */
export async function enrol(
  firstName: string,
  passphrase: string,
  baseUrl: string = API_URL,
): Promise<void> {
  const res = await fetch(`${baseUrl}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passphrase }),
  })
  if (res.status === 401) throw new WrongPassphrase()
  if (res.status === 429) throw new TooManyAttempts()
  if (!res.ok) throw new Error(`auth failed: ${res.status}`)

  const body: AuthResponse = await res.json()
  await setMeta('token', body.token)
  await setMeta('firstName', firstName.trim())
}
