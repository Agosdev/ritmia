import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'styled-components'
import { theme } from '../../src/styles/theme'
import { BeatGrid } from '../../src/components/visualizer/BeatGrid'
import { RitmiaProvider } from '../../src/context/RitmiaContext'

function renderWithProviders(ui) {
  return render(
    <ThemeProvider theme={theme}>
      <RitmiaProvider>{ui}</RitmiaProvider>
    </ThemeProvider>
  )
}

describe('BeatGrid Component', () => {
  it('renderiza la cantidad correcta de pulsos', () => {
    const accents = [0, 0, 0, 0]
    renderWithProviders(
      <BeatGrid
        numBeats={4}
        accents={accents}
        onAccentsChange={vi.fn()}
        currentBeat={-1}
        trackType="A"
        label="Test Grid"
      />
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(4)
  })

  it('al hacer clic en un pulso, cicla el acento (0 -> 1)', async () => {
    const user = userEvent.setup()
    const onAccentsChange = vi.fn()
    const accents = [0, 0, 0, 0]

    renderWithProviders(
      <BeatGrid
        numBeats={4}
        accents={accents}
        onAccentsChange={onAccentsChange}
        currentBeat={-1}
        trackType="A"
        label="Test Grid"
      />
    )

    const firstBeat = screen.getByRole('button', { name: /pulso 1/i })
    await user.click(firstBeat)

    expect(onAccentsChange).toHaveBeenCalledWith([1, 0, 0, 0])
  })

  it('al hacer clic en un pulso con valor 2 (fuerte), cicla a 0 (silencio)', async () => {
    const user = userEvent.setup()
    const onAccentsChange = vi.fn()
    const accents = [2, 0, 0, 0]

    renderWithProviders(
      <BeatGrid
        numBeats={4}
        accents={accents}
        onAccentsChange={onAccentsChange}
        currentBeat={-1}
        trackType="A"
        label="Test Grid"
      />
    )

    const firstBeat = screen.getByRole('button', { name: /pulso 1/i })
    await user.click(firstBeat)

    expect(onAccentsChange).toHaveBeenCalledWith([0, 0, 0, 0])
  })
})
