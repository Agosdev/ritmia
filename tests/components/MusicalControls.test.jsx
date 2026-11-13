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

// Helper: abre el listbox del selector custom y hace click en un item por nombre
function openAndSelect(name) {
  const combobox = screen.getByRole('combobox', { name: 'Preset' })
  fireEvent.click(combobox)
  if (name === '') {
    // Compás libre es el primer option en el listbox
    const freeOpt = screen.getByRole('option', { name: /Compás libre/ })
    fireEvent.click(freeOpt)
  } else {
    const option = screen.getByRole('option', { name: new RegExp(name, 'i') })
    fireEvent.click(option)
  }
}

it('ofrece todos los palos solicitados por su nombre sin duplicar presets existentes', () => {
  render(<App />)
  // Abre el listbox
  const combobox = screen.getByRole('combobox', { name: 'Preset' })
  fireEvent.click(combobox)
  // Verifica que todos los palos flamencos están presentes como opciones
  for (const name of ['Martinete', 'Soleá', 'Soleá por bulerías', 'Bulerías', 'Alegrías',
    'Seguiriyas', 'Guajiras', 'Tangos flamencos', 'Tientos', 'Rumba flamenca', 'Farruca', 'Sevillanas']) {
    const opts = screen.getAllByRole('option').filter(o => o.textContent.replace(/^(Flamenco|Árabe|Tango)/, '') === name)
    expect(opts).toHaveLength(1)
  }
  // Verifica los ritmos árabes esenciales
  for (const name of ['Maqsum', 'Baladi', 'Saidi', 'Malfuf', 'Ayoub', 'Masmoudi Kabir']) {
    const opts = screen.getAllByRole('option').filter(o => o.textContent.replace(/^(Flamenco|Árabe|Tango)/, '') === name)
    expect(opts).toHaveLength(1)
  }
  // Selecciona Martinete y verifica descripción
  fireEvent.click(screen.getByRole('option', { name: /Martinete/ }))
  expect(screen.getByText(/no reproduce el cante libre de martinete/)).toBeInTheDocument()
})

it('selección inmediata bloquea A y compás libre en el transporte restituye la edición', () => {
  render(<App />)
  const combobox = screen.getByRole('combobox', { name: 'Preset' })
  expect(screen.queryByRole('button', { name: 'Aplicar', exact: true })).not.toBeInTheDocument()
  // Selecciona "Tangos flamencos"
  openAndSelect('Tangos flamencos')
  const grid = screen.getByRole('group', { name: 'Secuenciador pista A' })
  const cells = grid.querySelectorAll('button')
  expect(cells).toHaveLength(4)
  expect(cells[0]).toBeDisabled()
  fireEvent.click(cells[0])
  expect(cells[0]).toHaveAttribute('data-accent', '0')
  expect(screen.getByLabelText('Numerador compás A')).toBeDisabled()
  expect(screen.getByLabelText('Denominador compás A')).toBeDisabled()
  expect(screen.getByRole('button', { name: '7/8' })).toBeDisabled()
  fireEvent.click(screen.getByText('Agrupaciones (opcional)'))
  expect(screen.getByLabelText('Agrupación métrica pista A')).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Aplicar acentos a los grupos' })).toBeDisabled()
  // Volver a Compás libre
  openAndSelect('')
  expect(cells[0]).toBeEnabled()
  expect(screen.getByLabelText('Numerador compás A')).toBeEnabled()
  expect(screen.getByLabelText('Agrupación métrica pista A')).toBeEnabled()
  fireEvent.click(cells[0])
  expect(cells[0]).toHaveAttribute('data-accent', '1')
  // Selecciona Sevillanas y vuelve a libre; el numerador debe quedar en 3
  openAndSelect('Sevillanas')
  openAndSelect('')
  expect(screen.getByRole('combobox', { name: 'Preset' })).toHaveFocus()
  expect(screen.getByLabelText('Numerador compás A')).toHaveValue(3)
  expect(screen.getByLabelText('Numerador compás A')).toBeEnabled()
  expect(screen.queryByLabelText('Opciones')).not.toBeInTheDocument()
  expect(screen.getByRole('group', { name: 'Secuenciador pista A' }).querySelectorAll('button')).toHaveLength(3)
})

it('sincroniza chip, selector y ambas X sin borrar el patrón al volver a Compás libre', () => {
  render(<App />)
  const chip = screen.getByRole('group', { name: 'Compás elegido' })
  expect(chip).toHaveTextContent('Compás libre')
  expect(chip).toHaveTextContent('7/8')
  expect(screen.queryByRole('button', { name: /Quitar preset desde/ })).not.toBeInTheDocument()
  // Selecciona Tangos flamencos
  openAndSelect('Tangos flamencos')
  expect(chip).toHaveTextContent('Tangos flamencos')
  expect(chip).toHaveTextContent('4/4')
  expect(chip.firstElementChild).toHaveAccessibleName('Quitar preset desde el chip')
  // Quitar desde el selector
  fireEvent.click(screen.getByRole('button', { name: 'Quitar preset desde el selector' }))
  expect(screen.getByRole('combobox', { name: 'Preset' })).toHaveFocus()
  expect(chip).toHaveTextContent('Compás libre')
  expect(chip).toHaveTextContent('4/4')
  expect(screen.getByLabelText('Numerador compás A')).toBeEnabled()
  expect([...screen.getByRole('group', { name: 'Secuenciador pista A' }).querySelectorAll('button')].map(b => b.dataset.accent)).toEqual(['0','2','1','2'])
  // Selecciona Sevillanas
  openAndSelect('Sevillanas')
  expect(chip).toHaveTextContent('Sevillanas')
  expect(chip).toHaveTextContent('3/4')
  // Quitar desde el chip
  fireEvent.click(screen.getByRole('button', { name: 'Quitar preset desde el chip' }))
  expect(screen.getByRole('combobox', { name: 'Preset' })).toHaveFocus()
  expect(chip).toHaveTextContent('Compás libre')
  expect(screen.queryByRole('button', { name: /Quitar preset desde/ })).not.toBeInTheDocument()
  change('Numerador compás A', 5)
  expect(chip).toHaveTextContent('5/4')
})
