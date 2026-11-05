import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ItemForm } from './ItemForm'
import { strings } from '../strings'
import { db, saveItem, type LocalItem } from '../db'

const farine: LocalItem = {
  id: 'f',
  name: 'Farine',
  search_name: 'farine',
  category: 'alimentation',
  quantity: 1.5,
  unit: 'kg',
  updated_at: new Date().toISOString(),
  updated_by: 'Jules',
  seq: 3,
  dirty: 0,
}

describe('ItemForm (Modifier l’article)', () => {
  function renderEdit(onSave = vi.fn()) {
    render(<ItemForm initial={farine} onSave={onSave} onClose={vi.fn()} />)
    return onSave
  }

  const quantityInput = () =>
    screen.getAllByRole('textbox', { name: strings.quantity }).find((el) => el.tagName === 'INPUT')!

  it('opens as a sheet pre-filled with the article and who last edited it', () => {
    renderEdit()
    expect(screen.getByRole('dialog', { name: strings.formEditTitle })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: strings.name })).toHaveValue('Farine')
    expect(screen.getByRole('button', { name: 'Alimentation' })).toHaveAttribute('aria-pressed', 'true')
    expect(quantityInput()).toHaveValue('1,5')
    expect(screen.getByText(/^Modifié aujourd’hui à \d\d:\d\d par Jules$/)).toBeInTheDocument()
  })

  it('steps a decimal quantity by one and saves the edited values', () => {
    const onSave = renderEdit()
    fireEvent.click(screen.getByRole('button', { name: strings.stepUp }))
    expect(quantityInput()).toHaveValue('2,5')

    fireEvent.click(screen.getByRole('button', { name: 'Boissons' }))
    fireEvent.click(screen.getByRole('button', { name: strings.save }))
    expect(onSave).toHaveBeenCalledWith({ name: 'Farine', category: 'boissons', quantity: 2.5, unit: 'kg' })
  })

  it('accepts a typed quantity with a comma', () => {
    const onSave = renderEdit()
    fireEvent.change(quantityInput(), { target: { value: '0,75' } })
    fireEvent.click(screen.getByRole('button', { name: strings.save }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ quantity: 0.75 }))
  })

  it('cannot save without a name or with an invalid quantity', () => {
    renderEdit()
    const save = screen.getByRole('button', { name: strings.save })

    fireEvent.change(quantityInput(), { target: { value: 'beaucoup' } })
    expect(save).toBeDisabled()
    expect(screen.getByRole('button', { name: strings.stepDown })).toBeDisabled()

    fireEvent.change(quantityInput(), { target: { value: '2' } })
    fireEvent.change(screen.getByRole('textbox', { name: strings.name }), { target: { value: '  ' } })
    expect(save).toBeDisabled()
  })
})

describe('ItemForm (Nouvel article)', () => {
  beforeEach(async () => {
    await db.items.clear()
  })

  it('starts empty with no category and only allows adding once name and category are set', () => {
    const onSave = vi.fn()
    render(<ItemForm onSave={onSave} onClose={vi.fn()} />)
    expect(screen.getByRole('dialog', { name: strings.formAddTitle })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(strings.namePlaceholder)).toHaveValue('')
    expect(screen.getByText(strings.addNote)).toBeInTheDocument()
    expect(screen.queryByRole('button', { pressed: true })).not.toBeInTheDocument()

    const add = screen.getByRole('button', { name: strings.addSubmit })
    fireEvent.change(screen.getByRole('textbox', { name: strings.name }), { target: { value: 'Piles' } })
    expect(add).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Outils' }))
    expect(add).toBeEnabled()
    fireEvent.click(add)
    expect(onSave).toHaveBeenCalledWith({ name: 'Piles', category: 'outils', quantity: 1, unit: '' })
  })

  it('warns, without blocking, when the name already exists in that category', async () => {
    await saveItem({ name: 'Café', category: 'alimentation', quantity: 2 }, 'Jules')
    render(<ItemForm onSave={vi.fn()} onClose={vi.fn()} />)

    fireEvent.change(screen.getByRole('textbox', { name: strings.name }), { target: { value: ' CAFE ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Alimentation' }))
    const warning = strings.duplicateWarning('Café', 'Alimentation')
    expect(await screen.findByText(warning)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.addSubmit })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Boissons' }))
    await waitFor(() => expect(screen.queryByText(warning)).not.toBeInTheDocument())
  })
})
