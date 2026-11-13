import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { ServerStyleSheet, ThemeProvider } from 'styled-components'
import { App } from '../../src/App'
import { GlobalStyles } from '../../src/styles/GlobalStyles'
import { theme } from '../../src/styles/theme'

describe('accesibilidad de controles y diálogos', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/?prototype=lab')
  })

  it('los controles de nivel son botones semánticos y operables con teclado', async () => {
    const user = userEvent.setup()
    render(<App />)
    const levels = screen.getByRole('navigation', { name: 'Niveles musicales' })
    const levelTwo = within(levels).getByRole('button', { name: 'Nivel 2 — Dos ritmos' })
    expect(levelTwo).toHaveAttribute('aria-pressed', 'false')
    levelTwo.focus()
    await user.keyboard('{Enter}')
    expect(levelTwo).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('group', { name: 'Secuenciador pista B' })).toBeInTheDocument()
  })

  it('mantiene nombres accesibles para BPM, compases, volúmenes y toggles', () => {
    render(<App />)
    for (const name of [
      'Ajustar tempo BPM', 'Valor numérico BPM', 'Numerador compás A',
      'Denominador compás A', 'Entrada libre de pulsos', 'Volumen pista A',
      'Marcar inicio de compás',
    ]) {
      expect(screen.getAllByLabelText(name).length).toBeGreaterThan(0)
    }
  })

  it('mantiene un solo selector en el transporte y la marcación antes del secuenciador', () => {
    render(<App />)
    const dock = screen.getByRole('group', { name: 'Controles de reproducción' })
    // El selector de presets es ahora un combobox custom (button role=combobox) + listbox.
    // Verificamos el combobox por aria-label en lugar de por valor de select nativo.
    expect(within(dock).getAllByRole('combobox')).toHaveLength(1)
    expect(within(dock).getByRole('combobox', { name: 'Preset' })).toBeInTheDocument()
    expect(within(dock).getAllByRole('button')).toHaveLength(2)
    expect(within(dock).queryByRole('checkbox')).not.toBeInTheDocument()
    const marker = screen.getByRole('group', { name: 'Marcación del compás' })
    const grid = screen.getByRole('group', { name: 'Secuenciador pista A' })
    expect(marker.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByLabelText('Opciones')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Abrir guía de uso' })).not.toBeInTheDocument()
  })

  it('usa foco visible y elimina transiciones con movimiento reducido', () => {
    render(<App />)
    expect(screen.queryByRole('checkbox', { name: 'Reducir movimiento' })).not.toBeInTheDocument()
    const styleSheet = new ServerStyleSheet()
    renderToString(styleSheet.collectStyles(
      <ThemeProvider theme={theme}><GlobalStyles /></ThemeProvider>,
    ))
    const styles = styleSheet.getStyleTags()
    styleSheet.seal()
    expect(styles).toContain(':focus-visible')
    expect(styles).toContain('3px solid')
    expect(styles).toContain('prefers-reduced-motion: reduce')
  })
})
