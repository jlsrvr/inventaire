import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { strings } from '../strings'

const enrolMock = vi.fn()
vi.mock('../lib/enrol', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/enrol')>()),
  enrol: (...args: unknown[]) => enrolMock(...args),
}))

import { Enrol } from './Enrol'
import { WrongPassphrase } from '../lib/enrol'

beforeEach(() => {
  enrolMock.mockReset()
})

function fill(firstName: string, passphrase: string) {
  fireEvent.change(screen.getByLabelText(strings.firstName), { target: { value: firstName } })
  fireEvent.change(screen.getByLabelText(strings.passphrase), { target: { value: passphrase } })
}

describe('Enrol (Connexion)', () => {
  it('shows or hides the password on demand', () => {
    render(<Enrol onEnrolled={vi.fn()} />)
    const input = screen.getByLabelText(strings.passphrase)
    expect(input).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: strings.showPassword }))
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: strings.hidePassword })).toHaveAttribute('aria-pressed', 'true')
  })

  it('only lets you enter once both fields are filled', () => {
    render(<Enrol onEnrolled={vi.fn()} />)
    const enter = screen.getByRole('button', { name: strings.enrolSubmit })
    expect(enter).toBeDisabled()
    fill('Jules', 'chalet')
    expect(enter).toBeEnabled()
  })

  it('explains a wrong password under the field', async () => {
    enrolMock.mockImplementation(async () => {
      throw new WrongPassphrase()
    })
    const onEnrolled = vi.fn()
    render(<Enrol onEnrolled={onEnrolled} />)
    fill('Jules', 'mauvais')
    fireEvent.click(screen.getByRole('button', { name: strings.enrolSubmit }))

    expect(await screen.findByRole('alert')).toHaveTextContent(strings.enrolWrongPassphrase)
    expect(screen.getByLabelText(strings.passphrase)).toHaveAccessibleDescription(
      strings.enrolWrongPassphrase,
    )
    expect(onEnrolled).not.toHaveBeenCalled()
  })

  it('enrols with the first name and password', async () => {
    enrolMock.mockResolvedValue(undefined)
    const onEnrolled = vi.fn()
    render(<Enrol onEnrolled={onEnrolled} />)
    fill('Jules', 'chalet')
    fireEvent.click(screen.getByRole('button', { name: strings.enrolSubmit }))

    await waitFor(() => expect(onEnrolled).toHaveBeenCalled())
    expect(enrolMock).toHaveBeenCalledWith('Jules', 'chalet')
  })
})
