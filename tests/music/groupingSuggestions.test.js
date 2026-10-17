import { describe, it, expect } from 'vitest'
import {
  parseGrouping,
  isGroupingValid,
  groupIndexForBeat,
  getGroupingSuggestions,
} from '../../src/music/groupingSuggestions'

describe('groupingSuggestions — Teoría de Agrupación Rítmica', () => {
  describe('parseGrouping', () => {
    it('parsea correctamente strings válidos como "3+2+2"', () => {
      expect(parseGrouping('3+2+2')).toEqual([3, 2, 2])
      expect(parseGrouping(' 3 + 3 + 2 ')).toEqual([3, 3, 2])
      expect(parseGrouping('4+4+4')).toEqual([4, 4, 4])
    })

    it('retorna null para entradas inválidas o vacías', () => {
      expect(parseGrouping('')).toBeNull()
      expect(parseGrouping('   ')).toBeNull()
      expect(parseGrouping('abc')).toBeNull()
      expect(parseGrouping(null)).toBeNull()
    })
  })

  describe('isGroupingValid', () => {
    it('valida que la suma de grupos coincida exactamente con el numerador', () => {
      expect(isGroupingValid([3, 2, 2], 7)).toBe(true)
      expect(isGroupingValid([3, 2, 2], 8)).toBe(false)
      expect(isGroupingValid([4, 4, 4], 12)).toBe(true)
      expect(isGroupingValid([], 5)).toBe(false)
    })
  })

  describe('groupIndexForBeat', () => {
    it('determina el índice de grupo correspondiente a cada pulso en "3+2+2"', () => {
      const groups = [3, 2, 2]
      // Grupo 0: índices 0, 1, 2
      expect(groupIndexForBeat(0, groups)).toBe(0)
      expect(groupIndexForBeat(1, groups)).toBe(0)
      expect(groupIndexForBeat(2, groups)).toBe(0)
      // Grupo 1: índices 3, 4
      expect(groupIndexForBeat(3, groups)).toBe(1)
      expect(groupIndexForBeat(4, groups)).toBe(1)
      // Grupo 2: índices 5, 6
      expect(groupIndexForBeat(5, groups)).toBe(2)
      expect(groupIndexForBeat(6, groups)).toBe(2)
    })
  })

  describe('getGroupingSuggestions', () => {
    it('sugiere patrones asimétricos clásicos para compases irregulares', () => {
      expect(getGroupingSuggestions(5)).toContain('3+2')
      expect(getGroupingSuggestions(7)).toContain('3+2+2')
      expect(getGroupingSuggestions(12)).toContain('3+3+3+3')
      expect(getGroupingSuggestions(12)).toContain('4+4+4')
      expect(getGroupingSuggestions(15)).toContain('5+5+5')
    })

    it('retorna un array vacío para números menores a 2', () => {
      expect(getGroupingSuggestions(1)).toEqual([])
      expect(getGroupingSuggestions(0)).toEqual([])
    })
  })
})
