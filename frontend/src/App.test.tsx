import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db, setMeta, saveItem } from './db'
import { strings } from './strings'

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false], updateServiceWorker: vi.fn() }),
}))

const syncMock = vi.fn()
vi.mock('./lib/sync', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./lib/sync')>()),
  sync: (...args: unknown[]) => syncMock(...args),
}))

import App from './App'
import { Unauthorized } from './lib/sync'

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => value })
  window.dispatchEvent(new Event(value ? 'online' : 'offline'))
}

beforeEach(async () => {
  await db.items.clear()
  await db.meta.clear()
  syncMock.mockReset().mockResolvedValue(undefined)
  setOnline(true)
})

afterEach(() => vi.useRealTimers())

async function enrolAs(name: string) {
  await setMeta('token', 't')
  await setMeta('firstName', name)
}

describe('App', () => {
  it('never flashes the enrolment form for an enrolled user', async () => {
    await enrolAs('John')
    await saveItem({ name: 'Café', quantity: 3 }, 'John')

    render(<App />)
    expect(screen.queryByRole('button', { name: strings.enrolSubmit })).not.toBeInTheDocument()
    expect(await screen.findByText('Café')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: strings.enrolSubmit })).not.toBeInTheDocument()
  })

  it('shows enrolment when not enrolled', async () => {
    render(<App />)
    expect(await screen.findByRole('button', { name: strings.enrolSubmit })).toBeInTheDocument()
  })

  it('shows the offline banner with the unsent count only while offline', async () => {
    await enrolAs('John')
    await saveItem({ name: 'Café', quantity: 3 }, 'John')
    render(<App />)
    await screen.findByText('Café')
    expect(screen.queryByText(strings.offlineTitle)).not.toBeInTheDocument()

    act(() => setOnline(false))
    expect(await screen.findByText(strings.offlineTitle)).toBeInTheDocument()
    expect(screen.getByText(strings.offlinePending(1))).toBeInTheDocument()

    act(() => setOnline(true))
    await waitFor(() => expect(screen.queryByText(strings.offlineTitle)).not.toBeInTheDocument())
  })

  it('groups articles by category in fixed order and filters the empty ones', async () => {
    await enrolAs('John')
    await saveItem({ name: 'Eau', category: 'boissons', quantity: 0 }, 'John')
    await saveItem({ name: 'Riz', category: 'alimentation', quantity: 2 }, 'John')
    await saveItem({ name: 'Café', category: 'alimentation', quantity: 0 }, 'John')
    render(<App />)

    const headings = await screen.findAllByRole('heading', { level: 2 })
    expect(headings.map((h) => h.textContent)).toEqual(['Alimentation · 2', 'Boissons · 1'])

    act(() => screen.getByRole('button', { name: strings.showEmpty(2) }).click())
    await waitFor(() => expect(screen.queryByText('Riz')).not.toBeInTheDocument())
    expect(screen.getByText('Café')).toBeInTheDocument()
    expect(screen.getByText('Eau')).toBeInTheDocument()
  })

  it('shows sync failures', async () => {
    syncMock.mockRejectedValue(new Error('boom'))
    await enrolAs('John')
    render(<App />)
    expect(await screen.findByText(strings.syncError)).toBeInTheDocument()
  })

  it('offers to re-enter the passphrase when the token is refused, without locking the app', async () => {
    syncMock.mockRejectedValue(new Unauthorized())
    await enrolAs('John')
    await saveItem({ name: 'Café', quantity: 3 }, 'John')
    render(<App />)

    expect(await screen.findByText(strings.syncUnauthorized)).toBeInTheDocument()
    expect(screen.getByText('Café')).toBeInTheDocument()
    act(() => screen.getByRole('button', { name: strings.reenrolAction }).click())
    expect(await screen.findByRole('dialog', { name: strings.reenrolTitle })).toBeInTheDocument()
  })

  it('pushes a local edit shortly after it is made', async () => {
    await enrolAs('John')
    await saveItem({ name: 'Café', quantity: 3 }, 'John')
    render(<App />)
    await screen.findByText('Café')
    await waitFor(() => expect(syncMock).toHaveBeenCalledTimes(1))

    act(() => screen.getByRole('button', { name: strings.plusOne('Café') }).click())
    await waitFor(() => expect(syncMock).toHaveBeenCalledTimes(2), { timeout: 3000 })
  })
})
