import { describe, it, expect } from 'vitest'
import { MUSICAL_PRESETS } from '../../src/music/presets'
import { calculateTiming } from '../../src/music/timingCalculator'

// Independently transcribed skeletal variants; provenance in docs/arabic-rhythms.md.
const cases = [
  ['maqsum', 4, 4, 2, 'DT-TD-T-'],
  ['baladi', 4, 4, 2, 'DD-TD-T-'],
  ['saidi', 4, 4, 2, 'DT-DD-T-'],
  ['malfuf', 2, 4, 4, 'D--T--T-'],
  ['ayoub', 2, 4, 4, 'D--KD-T-'],
  ['masmoudi-kabir', 8, 4, 1, 'DD-TD-T-'],
  ['chiftetelli', 8, 4, 2, 'D--T--T-D-D-T---'],
  ['wahda', 4, 4, 2, 'D--T--T-'],
  ['fallahi', 2, 4, 4, 'DT-TD-T-'],
  ['karsilama', 9, 8, 1, 'D-T-D-TTT'],
]

describe('ritmos árabes — métrica, subdivisión y variantes documentadas', () => {
  it.each(cases)('%s conserva métrica y ataques sin duplicar BPM', (id, num, den, subdivision, pattern) => {
    const preset = MUSICAL_PRESETS.find(p => p.id === id)
    expect(preset).toMatchObject({ num, den, subdivision, family: 'arabe' })
    expect(preset.strokes.join('')).toBe(pattern)
    expect(preset.accents).toEqual([...pattern].map(s => s === 'D' ? 2 : s === '-' ? 0 : 1))
    expect(preset.accents).toHaveLength(num * subdivision)
    expect(preset.bpm).toBeGreaterThanOrEqual(40)
    expect(preset.bpm).toBeLessThanOrEqual(200)
    expect(preset.description).toContain('La articulación audible depende del instrumento elegido')
    const timing = calculateTiming({ bpm: 120, numA: num, denA: den, subdivisionA: subdivision })
    expect(timing.measureA).toBeCloseTo(num * 4 / den * .5, 12)
    expect(timing.stepA * pattern.length).toBeCloseTo(timing.measureA, 12)
  })

  it('distingue Maqsum, Baladi y Saidi en posiciones de corchea', () => {
    const patterns = cases.slice(0, 3).map(([id]) => MUSICAL_PRESETS.find(p => p.id === id).accents.join(''))
    expect(new Set(patterns).size).toBe(3)
  })

  it('Karsilama agrupa nueve corcheas 2+2+2+3', () => {
    expect(MUSICAL_PRESETS.find(p => p.id === 'karsilama').grouping).toBe('2+2+2+3')
  })

  it.each(['polirritmia', 'polimetria', 'morph', 'clave'])('subdividir A conserva duraciones y reencuentros en %s', mode => {
    const config = { bpm: 120, numA: 4, denA: 4, numB: 3, denB: 8, mode, claveMeasures: mode === 'clave' ? 2 : 1 }
    const plain = calculateTiming(config)
    const divided = calculateTiming({ ...config, subdivisionA: 2 })
    for (const key of ['measureA', 'measureB', 'stepB', 'ticksA', 'reunionSec', 'reunionA', 'reunionB']) expect(divided[key]).toBe(plain[key])
    expect(divided.stepA).toBe(plain.stepA / 2)
    expect(divided.eventRatio.a / divided.eventRatio.b).toBeCloseTo(2 * plain.eventRatio.a / plain.eventRatio.b)
  })

  it.each([0, 5, 8, NaN])('rechaza subdivisión inválida %s', subdivisionA => {
    expect(() => calculateTiming({ bpm: 120, numA: 4, denA: 4, subdivisionA })).toThrow(RangeError)
  })

  it('mantiene catorce presets anteriores y diez nuevos sin IDs duplicados', () => {
    expect(MUSICAL_PRESETS.filter(p => p.family === 'arabe')).toHaveLength(10)
    expect(MUSICAL_PRESETS.filter(p => p.family === 'flamenco')).toHaveLength(13)
    expect(MUSICAL_PRESETS.find(p => p.id === 'marcato').family).toBe('tango')
    expect(new Set(MUSICAL_PRESETS.map(p => p.id)).size).toBe(MUSICAL_PRESETS.length)
  })
})
