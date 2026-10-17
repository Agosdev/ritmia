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

  it('cada patrón tiene una longitud de 8 pulsos y valores de acento válidos (0, 1, 2)', () => {
    CLAVE_PATTERNS.forEach(clave => {
      expect(clave.pat).toHaveLength(8)
      clave.pat.forEach(val => {
        expect([0, 1, 2]).toContain(val)
      })
    })
  })
})
