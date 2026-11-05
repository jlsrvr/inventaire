import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { strings } from '../../strings'
import type { LocalItem } from '../../db'
import { Chip } from './Chip'
import { ItemRow } from './ItemRow'
import { OfflineBanner } from './OfflineBanner'
import { Sheet } from './Sheet'
import { Stepper } from './Stepper'

const cafe: LocalItem = {
  id: 'c',
  name: 'Café',
  search_name: 'cafe',
  category: 'alimentation',
  quantity: 0,
  unit: 'paquets',
  updated_at: '2026-11-03T10:00:00.000Z',
  updated_by: 'John',
  seq: 1,
  dirty: 1,
}

describe('Sheet', () => {
  it('is a dialog named by its title, closed by ✕, Escape or the backdrop', () => {
    const onClose = vi.fn()
    render(
      <Sheet title="Aide" onClose={onClose}>
        <p>Contenu</p>
      </Sheet>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Aide' })

    fireEvent.click(screen.getByText('Contenu'))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: strings.close }))
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(dialog) // the backdrop is the dialog element itself
    expect(onClose).toHaveBeenCalledTimes(3)
  })
})

describe('Stepper', () => {
  it('names its buttons and can disable minus', () => {
    const onDecrease = vi.fn()
    const onIncrease = vi.fn()
    render(
      <Stepper
        value="0"
        onDecrease={onDecrease}
        onIncrease={onIncrease}
        decreaseLabel="Moins un"
        increaseLabel="Plus un"
        decreaseDisabled
      />,
    )
    expect(screen.getByRole('button', { name: 'Moins un' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Plus un' }))
    expect(onIncrease).toHaveBeenCalled()
  })
})

describe('ItemRow', () => {
  it('marks an unsent, empty article and steps it by one', () => {
    const onAdjust = vi.fn()
    const onEdit = vi.fn()
    render(
      <ul>
        <ItemRow item={cafe} onAdjust={onAdjust} onEdit={onEdit} />
      </ul>,
    )
    expect(screen.getByRole('img', { name: strings.pending })).toBeInTheDocument()
    expect(screen.getByText(strings.empty)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Café : moins un' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Café : plus un' }))
    expect(onAdjust).toHaveBeenCalledWith('c', 1)

    fireEvent.click(screen.getByText('Café'))
    expect(onEdit).toHaveBeenCalledWith(cafe)
  })

  it('shows neither mark for a sent, stocked article', () => {
    render(
      <ul>
        <ItemRow item={{ ...cafe, quantity: 2, dirty: 0 }} onAdjust={vi.fn()} onEdit={vi.fn()} />
      </ul>,
    )
    expect(screen.queryByRole('img', { name: strings.pending })).not.toBeInTheDocument()
    expect(screen.queryByText(strings.empty)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Café : moins un' })).toBeEnabled()
  })
})

describe('Chip', () => {
  it('exposes its state with aria-pressed', () => {
    render(<Chip pressed>Tout</Chip>)
    expect(screen.getByRole('button', { name: 'Tout' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('OfflineBanner', () => {
  it('counts pending changes, singular and plural, and stays short with none', () => {
    const { rerender } = render(<OfflineBanner pendingCount={3} />)
    expect(screen.getByText(/^3 changements sont gardés/)).toBeInTheDocument()

    rerender(<OfflineBanner pendingCount={1} />)
    expect(screen.getByText(/^1 changement est gardé/)).toBeInTheDocument()

    rerender(<OfflineBanner pendingCount={0} />)
    expect(screen.getByRole('status')).toHaveTextContent(strings.offlineTitle)
    expect(screen.queryByText(/gardés? sur ce téléphone/)).not.toBeInTheDocument()
  })
})
