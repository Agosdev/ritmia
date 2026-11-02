import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { App } from '../../src/App'

const change = (label, value) => fireEvent.change(screen.getAllByLabelText(label)[0], { target: { value: String(value) } })
const level = name => fireEvent.click(screen.getByRole('button', { name }))
const twoTracks = () => level('Nivel 2 — Dos ritmos')

beforeEach(() => {
  window.history.replaceState({}, '', '/?prototype=lab')
})

it('muestra borrador inválido conservando los colores de la agrupación aplicada', () => {
  const { container } = render(<App />)
  fireEvent.click(screen.getByText('Agrupaciones (opcional)'))
  change('Agrupación métrica pista A', '2+2+3')
  const colors = () => [...container.querySelectorAll('svg path')].map(path => path.getAttribute('stroke'))
  const previous = colors()
  change('Agrupación métrica pista A', '3x+2+2')
  expect(screen.getByLabelText('Agrupación métrica pista A')).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByText(/formato inválido; se conserva 2\+2\+3/)).toHaveTextContent('formato inválido; se conserva 2+2+3')
  expect(colors()).toEqual(previous)
  change('Agrupación métrica pista A', '3+')
  expect(screen.getAllByText(/texto incompleto/).length).toBeGreaterThan(0)
})

it('los controles de numerador rechazan texto parcial y decimales sin cambiar el compás', () => {
  render(<App />)
  twoTracks()
  fireEvent.click(screen.getByText('Entrada avanzada de pulsos B'))
  for (const [textLabel, numLabel, initial] of [
    ['Entrada libre de pulsos', 'Numerador compás A', 7],
    ['Entrada libre pulsos B', 'Numerador compás B', 5],
  ]) {
    for (const text of ['3x', '3.5', 'abc', '0', '33']) {
      change(textLabel, text)
      fireEvent.keyDown(screen.getByLabelText(textLabel), { key: 'Enter' })
      expect(screen.getByLabelText(numLabel)).toHaveValue(initial)
    }
    change(numLabel, 3.5)
    expect(screen.getByLabelText(numLabel)).toHaveValue(initial)
  }
})

it('aplica grupos explícitamente sin borrar silencios ni otros acentos y permite editar después', () => {
  render(<App />)
  const grid = screen.getByRole('group', { name: 'Secuenciador pista A' })
  const cells = grid.querySelectorAll('button')
  fireEvent.click(cells[3]) // silencio -> suave, comienzo del segundo grupo
  fireEvent.click(screen.getByText('Agrupaciones (opcional)'))
  expect(cells[3]).toHaveAttribute('data-accent', '1')
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar acentos a los grupos' }))
  expect([...cells].map(cell => Number(cell.dataset.accent))).toEqual([2,0,1,2,1,0,0])
  fireEvent.click(cells[3])
  expect(cells[3]).toHaveAttribute('data-accent', '0')
  change('Agrupación métrica pista A', '3+')
  expect(screen.getByRole('button', { name: 'Aplicar acentos a los grupos' })).toBeDisabled()
})
