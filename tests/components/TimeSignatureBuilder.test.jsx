import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'styled-components'
import { theme } from '../../src/styles/theme'
import { TimeSignatureBuilder } from '../../src/components/controls/TimeSignatureBuilder'
import { RitmiaProvider } from '../../src/context/RitmiaContext'

function renderWithProviders(ui) {
  return render(
    <ThemeProvider theme={theme}>
      <RitmiaProvider>{ui}</RitmiaProvider>
    </ThemeProvider>
  )
}

describe('TimeSignatureBuilder Component', () => {
  it('renderiza presets y campos de entrada', () => {
    renderWithProviders(<TimeSignatureBuilder />)

    expect(screen.getByText('Compás A — MAX 32 pulsos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '4/4' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '7/8' })).toBeInTheDocument()
    expect(screen.getByLabelText('Numerador compás A')).toBeInTheDocument()
    expect(screen.getByLabelText('Denominador compás A')).toBeInTheDocument()
  })

  it('permite cambiar el compás al hacer clic en un preset', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TimeSignatureBuilder />)

    const preset44 = screen.getByRole('button', { name: '4/4' })
    await user.click(preset44)

    const numInput = screen.getByLabelText('Numerador compás A')
    expect(numInput).toHaveValue(4)

    const denSelect = screen.getByLabelText('Denominador compás A')
    expect(denSelect).toHaveValue('4')
  })

  it('permite cambiar el compás mediante entrada de texto libre', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TimeSignatureBuilder />)

    const freeInput = screen.getByLabelText('Entrada libre de pulsos')
    await user.type(freeInput, '15{enter}')

    const numInput = screen.getByLabelText('Numerador compás A')
    expect(numInput).toHaveValue(15)
  })
})
