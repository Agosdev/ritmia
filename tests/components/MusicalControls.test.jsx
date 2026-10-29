import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { expect, it } from 'vitest'
import { App } from '../../src/App'

const change = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value: String(value) } })
const level = name => fireEvent.click(screen.getByRole('button', { name }))
const level3 = () => level('Nivel 3 — Polirritmia')

it('muestra relaciones con unidades coherentes y la fórmula de B según modo', () => {
  render(<App />)
  level3()
  change('Numerador compás A', 3)
  change('Denominador compás A', 4)
  change('Numerador compás B', 2)
  expect(screen.getByText('Frecuencia de pasos A:B = 3:2')).toBeInTheDocument()
  expect(screen.getByText('Duración efectiva A:B = 1:1')).toBeInTheDocument()
  expect(screen.getByText('paso B = duración A / numB')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Polimetría — corchea=corchea' }))
  expect(screen.getByText('Frecuencia de pasos A:B = 1:2')).toBeInTheDocument()
  expect(screen.getByText('Duración efectiva A:B = 3:1')).toBeInTheDocument()
  expect(screen.getByText('paso B = (60/bpm) * (4/denB)')).toBeInTheDocument()
})

it('presenta 31/1 vs 32/1 como 32×A/31×B y 31744 fusas, sin cap', () => {
  render(<App />)
  level3()
  change('Numerador compás A', 31)
  change('Denominador compás A', 1)
  change('Numerador compás B', 32)
  change('Denominador compás B', 1)
  change('Valor numérico BPM', 120)
  fireEvent.click(screen.getByRole('button', { name: 'Polimetría — corchea=corchea' }))
  expect(screen.getByText('MCM exacto = 31744 fusas')).toBeInTheDocument()
  expect(screen.getByText('Reencuentro A×32 / B×31, ≈1984.000s (desde inicio conjunto)')).toBeInTheDocument()
})

it('presenta son/rumba como ciclo canónico de ocho negras, no como dos compases de A', () => {
  render(<App />)
  level3()
  change('Valor numérico BPM', 120)
  change('Numerador compás A', 3)
  change('Denominador compás A', 4)
  fireEvent.click(screen.getByRole('button', { name: 'Clave — 6 patrones tradicionales' }))
  fireEvent.click(screen.getByRole('button', { name: 'Son 3-2' }))

  expect(screen.getByText('Ciclo de clave: ocho negras = 4.000s')).toBeInTheDocument()
  expect(screen.getByText(/Pasos A por compás \/ B por ciclo = 3:16/)).toBeInTheDocument()
  expect(screen.getByText('Reencuentro A×8 compases / B×3 ciclos, ≈12.000s (desde inicio conjunto)')).toBeInTheDocument()
  expect(screen.queryByText(/Pasos por compás propio A:B/)).not.toBeInTheDocument()
})

it('muestra borrador inválido conservando los colores de la agrupación aplicada', () => {
  const { container } = render(<App />)
  level('Nivel 2 — Agrupa')
  change('Agrupación métrica pista A', '2+2+3')
  const colors = () => [...container.querySelectorAll('svg path')].map(path => path.getAttribute('stroke'))
  const previous = colors()
  change('Agrupación métrica pista A', '3x+2+2')
  expect(screen.getByLabelText('Agrupación métrica pista A')).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByRole('status')).toHaveTextContent('formato inválido; se conserva 2+2+3')
  expect(colors()).toEqual(previous)
  change('Agrupación métrica pista A', '3+')
  expect(screen.getByRole('status')).toHaveTextContent('texto incompleto')
})

it('los controles de numerador rechazan texto parcial y decimales sin cambiar el compás', () => {
  render(<App />)
  level3()
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
