import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from './Dialog'
import { ItemList } from './ItemList'
import { strings } from '../strings'
import type { LocalItem } from '../db'

const item: LocalItem = {
  id: '1',
  name: 'Farine',
  search_name: 'farine',
  category: 'alimentation',
  quantity: 1.5,
  unit: 'kg',
  updated_at: '2026-11-03T10:00:00.000Z',
  updated_by: 'John',
  seq: 1,
  dirty: 0,
}

describe('Dialog', () => {
  it('is an accessible modal that closes on Escape', () => {
    const onClose = vi.fn()
    render(
      <Dialog labelledBy="t" onClose={onClose}>
        <h2 id="t">Titre</h2>
        <button>Ok</button>
      </Dialog>,
    )
    expect(screen.getByRole('dialog', { name: 'Titre' })).toHaveAttribute('aria-modal', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})

describe('ItemList', () => {
  it('names the stepper buttons after the item and formats decimals in French', () => {
    const onAdjust = vi.fn()
    render(<ItemList items={[item]} onAdjust={onAdjust} onEdit={vi.fn()} />)
    expect(screen.getByText('1,5')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: strings.decrease('Farine') }))
    expect(onAdjust).toHaveBeenCalledWith('1', -1)
  })
})
