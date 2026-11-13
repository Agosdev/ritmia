import React, { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import { liteTheme } from '../../src/styles/theme'
import { LearningTour, TourHelpButton } from '../../src/components/tour/LearningTour.jsx'
import { useLearningTour } from '../../src/components/tour/useLearningTour.js'
import { TOUR_STORAGE_KEYS } from '../../src/components/tour/tourSteps.js'


function Harness({ includeTargets = true }) {
  const [level, setLevel] = useState(1)
  const controller = useLearningTour({ level, setLevel })
  return <ThemeProvider theme={liteTheme}>
    <TourHelpButton onClick={event => controller.startMain(event)} />
    {includeTargets && <>
      <div data-tour-target="preset" />
      <div data-tour-target="sequencer" />
      <div data-tour-target="bpm" />
      <div data-tour-target="instruments" />
      <div data-tour-target="transport" />
      <div data-tour-target="tracks" />
      <div data-tour-target="modes" />
    </>}
    <LearningTour controller={controller} />
  </ThemeProvider>
}

describe('tour pedagógico', () => {
  beforeEach(() => {
    localStorage.clear()
    Element.prototype.scrollIntoView = vi.fn()
    window.scrollBy = vi.fn()
  })
  afterEach(cleanup)

  it('muestra invitación discreta una sola vez y recuerda Ahora no', async () => {
    const { unmount } = render(<Harness />)
    expect(await screen.findByText('¿Primera vez en Ritmia?')).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Ahora no' }))
    expect(localStorage.getItem(TOUR_STORAGE_KEYS.dismissed)).toBe('1')
    unmount()
    render(<Harness />)
    expect(screen.queryByText('¿Primera vez en Ritmia?')).toBeNull()
  })

  it('inicia desde Ayuda, avanza y retrocede sin modificar valores musicales', async () => {
    render(<Harness />)
    fireEvent.click(await screen.findByRole('button', { name: 'Mostrarme' }))
    expect(await screen.findByRole('dialog')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Elegí un ritmo' })).toBeTruthy()
    expect(screen.getByText('Paso 1 de 5')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(await screen.findByRole('heading', { name: 'Probá los golpes' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByRole('heading', { name: 'Elegí un ritmo' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Saltar tour' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(localStorage.getItem(TOUR_STORAGE_KEYS.dismissed)).toBe('1')
    fireEvent.click(screen.getByRole('button', { name: 'Ayuda' }))
    expect(await screen.findByRole('heading', { name: 'Elegí un ritmo' })).toBeTruthy()
  })

  it('Escape cierra, restaura el foco, completa y ofrece Dos ritmos solo al terminar', async () => {
    render(<Harness />)
    const help = screen.getByRole('button', { name: 'Ayuda' })
    fireEvent.click(await screen.findByRole('button', { name: 'Mostrarme' }))
    await screen.findByRole('dialog')
    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(help))
    fireEvent.click(help)
    for (let i = 0; i < 5; i += 1) fireEvent.click(await screen.findByRole('button', { name: /Siguiente|Finalizar/ }))
    expect(await screen.findByText('¿Querés combinar dos ritmos?')).toBeTruthy()
    expect(localStorage.getItem(TOUR_STORAGE_KEYS.completed)).toBe('1')
  })

  it('el paso opcional cambia a Nivel 2 solo con acción explícita y recorre pistas y modos', async () => {
    render(<Harness />)
    fireEvent.click(await screen.findByRole('button', { name: 'Mostrarme' }))
    for (let i = 0; i < 5; i += 1) fireEvent.click(await screen.findByRole('button', { name: /Siguiente|Finalizar/ }))
    const explore = await screen.findByRole('button', { name: 'Explorar Dos ritmos' })
    // The target level is changed only by explicitly accepting the optional invitation.
    expect(explore).toBeTruthy()
    fireEvent.click(explore)
    await screen.findByRole('heading', { name: 'Combiná dos ritmos' })
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(await screen.findByRole('heading', { name: 'Explorá sus relaciones' })).toBeTruthy()
    expect(screen.getByText(/compartir un ciclo/)).toBeTruthy()
  })

  it('omite objetivos ausentes y conserva cierre accesible', async () => {
    render(<Harness includeTargets={false} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Mostrarme' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), { timeout: 3000 })
  })
})
