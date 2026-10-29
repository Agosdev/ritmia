import { describe, it, expect } from 'vitest'
import { parseGrouping, isGroupingValid, getGroupingStatus, getGroupingSuggestions } from '../../src/music/groupingSuggestions'

describe('Agrupaciones: texto completo, borrador y límites', () => {
  it.each(['3x+2+2', '3.5+2+2', 'abc', '3++2+2', '+3+2+2', '3+-2+6',
    '0+7', '3,2,2', '3 2+2', '1e1+2', 'Infinity', '33', '999999999999999999999'])('rechaza %s sin parseo parcial', text => {
    expect(parseGrouping(text)).toBeNull()
    expect(getGroupingStatus(text, 7)).toBe('invalid')
  })
  it.each(['', '   ', '\t\n'])('vacío/espacios %j no son una configuración válida', text => {
    expect(parseGrouping(text)).toBeNull()
    expect(getGroupingStatus(text, 7)).toBe('empty')
  })
  it.each(['3+', ' 3 + 2 + '])('distingue el borrador incompleto %j', text => {
    expect(parseGrouping(text)).toBeNull()
    expect(getGroupingStatus(text, 7)).toBe('incomplete')
  })
  it('admite espacios entre tokens y ceros iniciales, y valida la suma', () => {
    expect(parseGrouping(' 03 + 2 + 2 ')).toEqual([3, 2, 2])
    expect(getGroupingStatus(' 03 + 2 + 2 ', 7)).toBe('valid')
    expect(getGroupingStatus('3+2+2', 8)).toBe('sum-mismatch')
    expect(getGroupingStatus('3x+', 7)).toBe('invalid')
  })
  it.each([[0, 7], [-1, 8], [3.5, 3.5], [NaN], [Infinity], ['7'], new Array(7)].map(groups => [groups]))('valida también arrays externos %j', groups => {
    expect(isGroupingValid(groups, 7)).toBe(false)
  })
  it('acepta exactamente los límites 1 y 32 y rechaza sumas mayores', () => {
    expect(isGroupingValid(parseGrouping('1'), 1)).toBe(true)
    expect(isGroupingValid(parseGrouping('32'), 32)).toBe(true)
    expect(isGroupingValid(parseGrouping(Array(32).fill('1').join('+')), 32)).toBe(true)
    expect(parseGrouping(Array(33).fill('1').join('+'))).toBeNull()
    expect(isGroupingValid([32, 1], 32)).toBe(false)
    expect(isGroupingValid([32, 1], 33)).toBe(false)
  })
  it('todas las sugerencias para 1–32 son agrupaciones válidas', () => {
    for (let num = 1; num <= 32; num++) for (const suggestion of getGroupingSuggestions(num)) {
      expect(isGroupingValid(parseGrouping(suggestion), num)).toBe(true)
    }
    for (const num of [0, -1, 2.5, 33, NaN, Infinity]) expect(getGroupingSuggestions(num)).toEqual([])
  })
})
