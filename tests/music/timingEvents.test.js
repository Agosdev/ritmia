import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { AudioEngine } from '../../src/audio/AudioEngine'
import { calculateTiming } from '../../src/music/timingCalculator'
import { controlledAudioContext } from '../helpers/controlledAudioContext'

let engine
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('AudioContext', controlledAudioContext())
  engine = new AudioEngine()
})
afterEach(async () => {
  await engine.dispose()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it.each([
  ['polirritmia', [0.08, 0.83], { a: 3, b: 2 }],
  ['polimetria', [0.08, 0.33, 0.58, 0.83, 1.08, 1.33], { a: 1, b: 2 }],
])('3/4 vs 2/8 en %s: ratios contrastados con eventos reales del scheduler', async (mode, expectedB, ratio) => {
  const timing = calculateTiming({ bpm: 120, numA: 3, denA: 4, numB: 2, denB: 8, mode })
  await engine.start({ ...timing, mode, level: 3, accentsA: [2, 0, 1], accentsB: [0, 1], metronome: false })
  const events = new Map()
  for (let i = 0; i <= 60; i++) {
    engine.ctx.advanceTo(i / 40)
    engine.schedule()
    for (const event of engine.scheduledNotes) {
      if (event.time < 1.58 - 1e-9) events.set(`${event.type}:${event.time}`, event)
    }
  }
  const byTrack = type => [...events.values()].filter(n => n.type === type)
  const times = type => byTrack(type).map(n => Number(n.time.toFixed(8)))
  expect(times('A')).toEqual([0.08, 0.58, 1.08])
  expect(times('B')).toEqual(expectedB)
  expect(timing.eventRatio).toEqual(ratio)
  expect(byTrack('A')[1].accent).toBe(0) // El silencio también es un paso.
  expect(byTrack('B')[0].accent).toBe(0)
  const starts = engine.ctx.sources.map(s => Number(s.startTime.toFixed(8)))
  expect(starts).not.toContain(0.58) // A y B están en silencio en ese instante.
})
