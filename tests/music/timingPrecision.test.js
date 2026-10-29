import { describe, it, expect } from 'vitest'
import { calculateTiming, gcd, lcm } from '../../src/music/timingCalculator'
import { DENOMINATORS, MODES } from '../../src/music/constants'

const base = { bpm: 120, numA: 3, denA: 4, numB: 2, denB: 8, mode: 'polimetria' }

describe('Duraciones, unidades y reencuentros exactos', () => {
  it.each([
    [4, 4, 4, 4, 32, 1, 1, 2],
    [7, 8, 5, 8, 140, 5, 7, 8.75],
    [3, 4, 2, 8, 24, 1, 3, 1.5],
    [3, 4, 6, 8, 24, 1, 1, 1.5],
    [31, 1, 32, 1, 31744, 32, 31, 1984],
    [1, 16, 32, 1, 1024, 512, 1, 64],
  ])('%i/%i vs %i/%i: primer reencuentro métrico', (numA, denA, numB, denB, ticks, a, b, seconds) => {
    const timing = calculateTiming({ ...base, numA, denA, numB, denB })
    expect(timing.lcmTicks).toBe(ticks)
    expect(timing.reunionA).toBe(a)
    expect(timing.reunionB).toBe(b)
    expect(timing.reunionSec).toBe(seconds)
    expect(timing.tickSec).toBe(0.0625) // fusa: 1/16s con negra de 1/2s
  })

  it.each(['polirritmia', 'morph', 'clave'])('%s: B adaptada se reencuentra cada 1×A/1×B', mode => {
    const timing = calculateTiming({ ...base, mode })
    expect(timing.stepA).toBe(0.5)
    expect(timing.stepB).toBe(0.75)
    expect(timing.measureA).toBe(1.5)
    expect(timing.measureB).toBe(1.5)
    expect(timing.reunionA).toBe(1)
    expect(timing.reunionB).toBe(1)
    expect(timing.reunionSec).toBe(1.5)
    expect(timing.pulseRatio).toEqual({ a: 3, b: 2 })
    expect(timing.eventRatio).toEqual({ a: 3, b: 2 })
    expect(timing.durationRatio).toEqual({ a: 1, b: 1 })
  })

  it.each([
    [4, 4, 2, 0.5, 2, 1, 1, 2, 4],
    [3, 4, 1.5, 0.5, 8, 3, 3, 8, 12],
    [5, 4, 2.5, 0.5, 8, 5, 5, 8, 20],
    [7, 8, 1.75, 0.25, 16, 7, 7, 16, 28],
  ])('clave canónica: A=%i/%i conserva ocho negras', (
    numA, denA, measureA, stepA, reunionA, reunionB, durationA, durationB, reunionSec,
  ) => {
    const timing = calculateTiming({
      bpm: 120, numA, denA, numB: 16, denB: 8, mode: 'clave', claveMeasures: 2,
    })
    expect(timing.measureA).toBe(measureA)
    expect(timing.stepA).toBe(stepA)
    expect(timing.stepB).toBe(0.25)
    expect(timing.measureB).toBe(4)
    expect(timing.ticksB).toBe(64)
    expect(timing.reunionA).toBe(reunionA)
    expect(timing.reunionB).toBe(reunionB)
    expect(timing.reunionSec).toBe(reunionSec)
    expect(timing.eventRatio).toEqual(denA === 8 ? { a: 1, b: 1 } : { a: 1, b: 2 })
    expect(timing.durationRatio).toEqual({ a: durationA, b: durationB })
  })

  it('escala el ciclo fijo con el BPM y deja Bossa/Shiko adaptados a A', () => {
    const slowerClave = calculateTiming({
      bpm: 60, numA: 4, denA: 4, numB: 16, denB: 8, mode: 'clave', claveMeasures: 2,
    })
    expect(slowerClave.measureB).toBe(8)
    expect(slowerClave.stepB).toBe(0.5)
    expect(slowerClave.reunionSec).toBe(8)

    const bossa = calculateTiming({
      bpm: 120, numA: 3, denA: 4, numB: 8, denB: 8, mode: 'clave', claveMeasures: 1,
    })
    expect(bossa.measureB).toBe(bossa.measureA)
    expect(bossa.stepB).toBe(0.1875)
    expect(bossa.reunionA).toBe(1)
    expect(bossa.reunionB).toBe(1)
  })

  it('polimetría 3/4 vs 2/8 separa pasos por compás, frecuencias y duraciones', () => {
    const timing = calculateTiming(base)
    expect(timing.stepA).toBe(0.5)
    expect(timing.stepB).toBe(0.25)
    expect(timing.measureA).toBe(1.5)
    expect(timing.measureB).toBe(0.5)
    expect(timing.pulseRatio).toEqual({ a: 3, b: 2 })
    expect(timing.eventRatio).toEqual({ a: 1, b: 2 })
    expect(timing.durationRatio).toEqual({ a: 3, b: 1 })
    expect(timing.ticksA).toBe(24)
    expect(timing.ticksB).toBe(8)
  })

  it('reduce relaciones sin confundirlas con golpes audibles', () => {
    const timing = calculateTiming({ ...base, numA: 6, numB: 4, mode: 'polirritmia' })
    expect(timing.pulseRatio).toEqual({ a: 3, b: 2 })
    expect(timing.eventRatio).toEqual({ a: 3, b: 2 })
  })

  it('31/1 vs 32/1 al BPM mínimo alcanza 5952 segundos, sin cap', () => {
    const timing = calculateTiming({ ...base, bpm: 40, numA: 31, denA: 1, numB: 32, denB: 1 })
    expect(timing.measureA).toBe(186)
    expect(timing.measureB).toBe(192)
    expect(timing.reunionSec).toBe(5952)
  })

  it('caso más denso de la UI: 1/16 vs 32/1 a 200 BPM', () => {
    const timing = calculateTiming({ ...base, bpm: 200, numA: 1, denA: 16, numB: 32, denB: 1, mode: 'polirritmia' })
    expect(timing.measureA).toBe(0.075)
    expect(timing.stepB).toBe(0.00234375)
    expect(timing.reunionB).toBe(1)
  })

  it('todos los compases admitidos producen enteros exactos y tiempos finitos en los BPM extremos', () => {
    let maxLcm = 0
    let maxError = 0
    let invalid = 0
    for (let numA = 1; numA <= 32; numA++) for (let numB = 1; numB <= 32; numB++) {
      for (const denA of DENOMINATORS) for (const denB of DENOMINATORS) {
        for (const bpm of [40, 200]) for (const mode of MODES) {
          const t = calculateTiming({ bpm, numA, denA, numB, denB, mode })
          maxLcm = Math.max(maxLcm, t.lcmTicks)
          if (![t.reunionA, t.reunionB, t.lcmTicks, t.ticksA, t.ticksB].every(Number.isSafeInteger) ||
              ![t.stepA, t.stepB, t.measureA, t.measureB, t.reunionSec].every(x => Number.isFinite(x) && x > 0)) invalid++
          maxError = Math.max(maxError, Math.abs(t.reunionA * t.measureA - t.reunionSec),
            Math.abs(t.reunionB * t.measureB - t.reunionSec))
        }
      }
    }
    expect(invalid).toBe(0)
    expect(maxLcm).toBe(31744)
    expect(maxError).toBeLessThan(1e-9) // <1 ns de discrepancia matemática, no precisión auditiva.
  })
})

describe('Rechazo explícito de parámetros inválidos', () => {
  it.each([
    ['bpm', 0], ['bpm', NaN], ['bpm', Infinity], ['bpm', 39], ['bpm', 201], ['bpm', 92.5],
    ['numA', 0], ['numA', -1], ['numA', 33], ['numA', 3.5], ['numA', '3'],
    ['numB', NaN], ['numB', Infinity], ['numB', 0],
    ['denA', 0], ['denA', 3], ['denA', 32], ['denB', Infinity], ['denB', '8'],
    ['mode', 'desconocido'],
  ])('%s=%s nunca produce NaN/Infinity ni otro compás silenciosamente', (key, value) => {
    expect(() => calculateTiming({ ...base, [key]: value })).toThrow(RangeError)
  })

  it.each([NaN, Infinity, 0.5, '3', Number.MAX_SAFE_INTEGER + 1])('MCD/MCM rechazan %s', value => {
    expect(() => gcd(value, 4)).toThrow(RangeError)
    expect(() => lcm(4, value)).toThrow(RangeError)
  })

  it('MCM detecta overflow y admite cero/signos sin recursión infinita', () => {
    expect(() => lcm(Number.MAX_SAFE_INTEGER, 2)).toThrow(RangeError)
    expect(gcd(0, 0)).toBe(0)
    expect(gcd(-12, 8)).toBe(4)
    expect(lcm(-12, 8)).toBe(24)
    expect(lcm(0, 8)).toBe(0)
  })
})
