import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from './Dialog'

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
