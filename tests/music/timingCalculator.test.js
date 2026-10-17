import { describe, it, expect } from 'vitest'
import {
  gcd,
  lcm,
  cappedLcm,
  calculateTiming,
} from '../../src/music/timingCalculator'

describe('timingCalculator — Teoría Musical', () => {
  describe('gcd y lcm', () => {
    it('calcula correctamente el Máximo Común Divisor (gcd)', () => {
      expect(gcd(12, 8)).toBe(4)
      expect(gcd(7, 5)).toBe(1)
      expect(gcd(32, 16)).toBe(16)
      expect(gcd(0, 5)).toBe(5)
    })

    it('calcula correctamente el Mínimo Común Múltiplo (lcm)', () => {
      expect(lcm(4, 6)).toBe(12)
      expect(lcm(3, 5)).toBe(15)
      expect(lcm(0, 10)).toBe(0)
    })

    it('limita el LCM con cappedLcm a MAX_LCM (2048)', () => {
      expect(cappedLcm(4, 6)).toBe(12)
      // lcm(1024, 768) = 3072 > 2048
      expect(cappedLcm(1024, 768)).toBe(2048)
    })
  })

  describe('calculateTiming', () => {
    it('calcula stepA y measureA para 4/4 a 120 BPM', () => {
      const timing = calculateTiming({
        bpm: 120,
        numA: 4,
        denA: 4,
        mode: 'polirritmia',
      })
      // Negra a 120 BPM = 0.5 segundos
      expect(timing.stepA).toBeCloseTo(0.5, 4)
      expect(timing.measureA).toBeCloseTo(2.0, 4)
    })

    it('calcula compás 7/8 a 92 BPM', () => {
      const timing = calculateTiming({
        bpm: 92,
        numA: 7,
        denA: 8,
        mode: 'polirritmia',
      })
      // Duración compás = (60/92) * 7 * (4/8) = (60/92) * 3.5 = 2.2826s
      expect(timing.measureA).toBeCloseTo((60 / 92) * 3.5, 4)
      expect(timing.stepA).toBeCloseTo(timing.measureA / 7, 4)
    })

    it('en polirritmia (3:2), ambos compases tienen igual duración de compás', () => {
      const timing = calculateTiming({
        bpm: 60,
        numA: 3,
        denA: 4,
        numB: 2,
        denB: 4,
        mode: 'polirritmia',
      })
      expect(timing.measureA).toBeCloseTo(timing.measureB, 5)
      expect(timing.ratio).toBeCloseTo(1.5, 4)
    })

    it('en polimetría, las figuras musicales conservan su duración absoluta (corchea=corchea)', () => {
      const timing = calculateTiming({
        bpm: 60,
        numA: 7,
        denA: 8,
        numB: 5,
        denB: 8,
        mode: 'polimetria',
      })
      // Con denA=8 y denB=8, los steps individuales deben ser idénticos
      expect(timing.stepA).toBeCloseTo(timing.stepB, 5)
      // Pero las duraciones de los compases difieren
      expect(timing.measureA).toBeCloseTo(3.5, 4) // 7 * 0.5s
      expect(timing.measureB).toBeCloseTo(2.5, 4) // 5 * 0.5s
      // Reencuentro calculado por MCM
      expect(timing.reunionA).toBe(5)
      expect(timing.reunionB).toBe(7)
    })
  })
})
