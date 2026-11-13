import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { App } from '../../src/App'

function openSearch() {
  fireEvent.click(screen.getByRole('combobox', { name: 'Preset', exact: true }))
  return screen.getByPlaceholderText('Buscar ritmo o estilo...')
}
function resultNames() {
  return within(screen.getByRole('listbox', { name: 'Presets', exact: true }))
    .getAllByRole('option').map(option => option.textContent)
}

it('filtra por nombre y confirma solo al elegir el resultado', () => {
  render(<App />)
  const search = openSearch()
  expect(search).toHaveFocus()
  fireEvent.change(search, { target: { value: 'Maqsum' } })
  expect(resultNames()).toEqual(['ÁrabeMaqsum'])
  expect(screen.getByRole('group', { name: 'Compás elegido' })).toHaveTextContent('Compás libre')
  expect(screen.getByRole('combobox', { name: 'Preset' })).toHaveAttribute('aria-activedescendant')
  fireEvent.click(screen.getByRole('option', { name: 'Árabe Maqsum', exact: true }))
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: 'Preset' })).toHaveValue('Maqsum')
  expect(screen.getByRole('group', { name: 'Compás elegido' })).toHaveTextContent('Maqsum')
})

it('busca por familia e ignora mayúsculas, minúsculas y tildes', () => {
  render(<App />)
  const search = openSearch()
  fireEvent.change(search, { target: { value: 'blues' } })
  expect(resultNames()).toEqual(['BluesBlues Shuffle', 'BluesSlow Blues'])
  fireEvent.change(search, { target: { value: 'ROCK' } })
  expect(resultNames()).toEqual(['RockRock clásico', 'RockHalf-time Rock'])
  fireEvent.change(search, { target: { value: 'arabe' } })
  expect(resultNames()).toHaveLength(10)
  expect(resultNames()[0]).toContain('Árabe')
  expect(within(screen.getByRole('listbox')).getAllByRole('option').every(option => option.textContent.includes('Árabe'))).toBe(true)
})

it('muestra cero coincidencias, limpia y restaura los resultados agrupados', () => {
  render(<App />)
  const search = openSearch()
  fireEvent.change(search, { target: { value: 'no existe ningún ritmo' } })
  expect(screen.getByText('No se encontraron ritmos')).toBeInTheDocument()
  expect(within(screen.getByRole('listbox')).queryAllByRole('option')).toHaveLength(0)
  fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))
  expect(search).toHaveValue('')
  expect(resultNames()).toHaveLength(34) // Compás libre y los 33 presets, en su orden de biblioteca.
  expect(resultNames()[0]).toContain('Compás libre')
  expect(resultNames().at(-1)).toContain('Funk')
  expect(screen.queryByText('No se encontraron ritmos')).not.toBeInTheDocument()
})

it('navega con flechas y Enter, y Escape cancela sin cambiar el preset', () => {
  render(<App />)
  let search = openSearch()
  fireEvent.change(search, { target: { value: 'jazz' } })
  expect(resultNames()).toHaveLength(2)
  fireEvent.keyDown(search, { key: 'ArrowDown' })
  const combo = screen.getByRole('combobox', { name: 'Preset' })
  const activeId = combo.getAttribute('aria-activedescendant')
  expect(document.getElementById(activeId)).toHaveAttribute('role', 'option')
  fireEvent.keyDown(search, { key: 'Enter' })
  expect(screen.getByRole('combobox', { name: 'Preset' })).toHaveValue('Jazz Waltz')

  search = openSearch()
  fireEvent.change(search, { target: { value: 'funk' } })
  fireEvent.keyDown(search, { key: 'Escape' })
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: 'Preset' })).toHaveValue('Jazz Waltz')
  search = openSearch()
  expect(search).toHaveValue('')
  expect(screen.getByRole('option', { name: 'Jazz Jazz Waltz', exact: true })).toHaveAttribute('aria-selected', 'true')
})

it('mantiene un único combobox y estados ARIA enlazados al listbox', () => {
  render(<App />)
  const search = openSearch()
  expect(screen.getAllByRole('combobox', { name: 'Preset' })).toHaveLength(1)
  expect(search).toHaveAttribute('aria-expanded', 'true')
  const list = screen.getByRole('listbox', { name: 'Presets' })
  expect(search).toHaveAttribute('aria-controls', list.id)
  expect(search).toHaveFocus()
})
