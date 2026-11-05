import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SyncSheet } from './SyncSheet'
import { strings } from '../strings'
import type { LocalItem } from '../db'

const cafe: LocalItem = {
  id: 'c',
  name: 'Café',
  search_name: 'cafe',
  category: 'alimentation',
  quantity: 0,
  unit: 'paquets',
  updated_at: new Date().toISOString(),
  updated_by: 'Jules',
  seq: 4,
  dirty: 1,
  synced_quantity: 2,
}

function renderSheet(props: Partial<Parameters<typeof SyncSheet>[0]> = {}) {
  const handlers = { onRetry: vi.fn(), onReenrol: vi.fn(), onClose: vi.fn() }
  render(
    <SyncSheet status="offline" pending={[cafe]} lastSyncedAt={undefined} {...handlers} {...props} />,
  )
  return handlers
}

describe('SyncSheet', () => {
  it('explains the offline wait, lists what is unsent, and can retry', () => {
    const { onRetry } = renderSheet()
    expect(screen.getByRole('dialog', { name: strings.syncTitle })).toBeInTheDocument()
    const card = screen.getByRole('status')
    expect(card).toHaveTextContent(strings.syncOfflineTitle)
    expect(card).toHaveTextContent(strings.syncOfflineBody(1))
    expect(card).toHaveTextContent(strings.neverSent)

    const list = screen.getByRole('region', { name: strings.pending })
    expect(within(list).getByText('Café')).toBeInTheDocument()
    expect(within(list).getByText(/^2 → 0 paquets · \d\d:\d\d$/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: strings.retry }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('says everything is up to date, with nothing to retry or list', () => {
    renderSheet({ status: 'done', pending: [], lastSyncedAt: new Date().toISOString() })
    expect(screen.getByRole('status')).toHaveTextContent(strings.syncDoneTitle)
    expect(screen.getByRole('status')).toHaveTextContent(/Dernier envoi : aujourd’hui à/)
    expect(screen.queryByRole('button', { name: strings.retry })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: strings.pending })).not.toBeInTheDocument()
  })

  it('asks for the password again when the token was refused', () => {
    const { onReenrol } = renderSheet({ status: 'unauthorized' })
    fireEvent.click(screen.getByRole('button', { name: strings.reenrolAction }))
    expect(onReenrol).toHaveBeenCalled()
  })
})
