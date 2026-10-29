import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { ServerStyleSheet, ThemeProvider } from 'styled-components'
import { App } from '../../src/App'
import { GlobalStyles } from '../../src/styles/GlobalStyles'
import { theme } from '../../src/styles/theme'

describe('accesibilidad de controles y diálogos', () => {
  it('los controles de nivel son botones semánticos y operables con teclado', async () => {
    const user = userEvent.setup()
    render(<App />)
    const levels = screen.getByRole('group', { name: 'Nivel de dificultad pedagógica' })
    const levelTwo = within(levels).getByRole('button', { name: 'Nivel 2 — Agrupa' })
    expect(levelTwo).toHaveAttribute('aria-pressed', 'false')
    levelTwo.focus()
    await user.keyboard('{Enter}')
    expect(levelTwo).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Agrupación métrica pista A')).toBeInTheDocument()
  })

  it('mantiene nombres accesibles para BPM, compases, volúmenes y toggles', () => {
    render(<App />)
    for (const name of [
      'Ajustar tempo BPM', 'Valor numérico BPM', 'Numerador compás A',
      'Denominador compás A', 'Entrada libre de pulsos', 'Volumen pista A',
      'Modo seguro', 'Reducir movimiento', 'Metrónomo 1',
    ]) {
      expect(screen.getByLabelText(name)).toBeInTheDocument()
    }
  })

  it('abre diálogo modal, atrapa foco, cierra con Escape y restaura el foco', async () => {
    const user = userEvent.setup()
    render(<App />)
    const trigger = screen.getByRole('button', { name: 'Abrir guía de uso' })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: /Bienvenido a Ritmia/ })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(document.activeElement).toHaveAccessibleName('Cerrar modal')
    expect(document.querySelector('header')).toHaveAttribute('inert')

    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(document.activeElement).toHaveTextContent('Siguiente')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(document.querySelector('header')).not.toHaveAttribute('inert')
  })

  it('cierra TestModal con Escape y anuncia feedback sin ocultar el contenido', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Test Nivel →' }))
    const dialog = screen.getByRole('dialog', { name: 'Test de Nivel 1' })
    expect(dialog).toHaveAttribute('aria-describedby', 'test-modal-question')
    const option = within(dialog).getAllByRole('button')[0]
    fireEvent.click(option)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Test Nivel →' })).toHaveFocus()
  })

  it('usa foco visible y elimina transiciones con movimiento reducido', () => {
    render(<App />)
    const levelToggle = screen.getByRole('checkbox', { name: 'Reducir movimiento' })
    expect(levelToggle).toBeChecked()
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
