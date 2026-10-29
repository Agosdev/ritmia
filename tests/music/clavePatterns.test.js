import { describe, it, expect } from 'vitest'
import { CLAVE_PATTERNS } from '../../src/music/clavePatterns'

describe('clavePatterns — Patrones Tradicionales', () => {
  it('contiene los 6 patrones tradicionales de clave', () => {
    expect(CLAVE_PATTERNS).toHaveLength(6)
    const names = CLAVE_PATTERNS.map(c => c.name)
    expect(names).toEqual([
      'Son 3-2',
      'Son 2-3',
      'Rumba 3-2',
      'Rumba 2-3',
      'Bossa 3-2',
      'Shiko',
    ])
  })

  it('son y rumba tienen cinco ataques en dos compases con sus diferencias tradicionales', () => {
    const expected = [
      [0, 3, 6, 10, 12],
      [2, 4, 8, 11, 14],
      [0, 3, 7, 10, 12],
      [2, 4, 8, 11, 15],
    ]

    CLAVE_PATTERNS.slice(0, 4).forEach((clave, index) => {
      const positions = clave.pat.flatMap((value, step) => value > 0 ? [step] : [])
      expect(clave.cycleMeasures).toBe(2)
      expect(clave.pat).toHaveLength(16)
      expect(positions).toEqual(expected[index])
      expect(positions).toHaveLength(5)
    })
  })

  it('conserva Bossa y Shiko y solo usa valores de acento válidos', () => {
    CLAVE_PATTERNS.forEach(clave => {
      clave.pat.forEach(val => {
        expect([0, 1, 2]).toContain(val)
      })
    })
    expect(CLAVE_PATTERNS.slice(4).map(({ name, pat }) => [name, pat])).toEqual([
      ['Bossa 3-2', [2, 0, 1, 0, 2, 0, 0, 1]],
      ['Shiko', [2, 0, 0, 1, 0, 2, 1, 0]],
    ])
  })
})
