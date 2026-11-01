import { describe, expect, it } from 'vitest'
import { readMusicFrame, trackGain } from '../../src/components/visualizer/physical/musicFrame'

function engine(overrides = {}) {
  return {
    getCurrentAudioTime: () => 1.03,
    transportState: 'playing', isPlaying: true, startTime: 0,
    stepCountA: 3, stepCountB: 3, nextNoteTimeA: 1.5, nextNoteTimeB: 1.5,
    params: { level: 3, accentsA: [2, 0, 1, 0], accentsB: [2, 1, 0], stepA: .5, stepB: .5, volumeA: 1, volumeB: 1, mode: 'polirritmia', morph: .5 },
    scheduledNotes: [{ time: 1, type: 'A', pos: 2, accent: 1 }, { time: 1, type: 'B', pos: 2, accent: 0 }],
    ...overrides,
  }
}

describe('physical visualizers: actual audio events', () => {
  it('never impacts on silence or future notes, and never invents a B in levels 1–2', () => {
    const source = engine({ scheduledNotes: [{ time: 1, type: 'A', pos: 2, accent: 0 }, { time: 1.1, type: 'A', pos: 3, accent: 2 }] })
    const frame = readMusicFrame(source)
    expect(frame.tracks).toHaveLength(1)
    expect(frame.tracks[0]).toMatchObject({ audible: false, impact: 0, height: 0, eventTime: null })
    expect(readMusicFrame(engine(), { showTrackB: true }).tracks[1].impact).toBe(0)
  })
  it('derives the parabola, impact and squash from the elapsed AudioContext event time', () => {
    const source = engine({ scheduledNotes: [{ time: 1, type: 'A', pos: 0, accent: 2 }] })
    const impact = readMusicFrame({ ...source, getCurrentAudioTime: () => 1 }).tracks[0]
    expect(impact.impact).toBe(1)
    expect(impact.scaleX).toBeGreaterThan(1)
    expect(impact.scaleY).toBeLessThan(1)
    const apex = readMusicFrame({ ...source, getCurrentAudioTime: () => 1.225 }).tracks[0]
    expect(apex.height).toBeCloseTo(1)
    expect(apex.impact).toBe(0)
    const rest = readMusicFrame({ ...source, getCurrentAudioTime: () => 1.49 }).tracks[0]
    expect(rest.height).toBe(0)
    expect(rest.impact).toBe(0)
  })
  it('preserves the full freeze on pause and returns to neutral on reset', () => {
    const source = engine()
    const playing = readMusicFrame(source)
    const paused = readMusicFrame({ ...source, isPlaying: false, transportState: 'paused' })
    expect(paused.tracks).toEqual(playing.tracks)
    expect(paused.time).toBe(playing.time)
    const reset = readMusicFrame({ ...source, isPlaying: false, transportState: 'stopped', scheduledNotes: [] })
    expect(reset.tracks[0]).toMatchObject({ phase: 0, height: 0, impact: 0 })
  })
  it('scales soft hits and Morph with configured track gains, including a fully muted track', () => {
    const source = engine()
    const soft = readMusicFrame(source).tracks[0]
    const strong = readMusicFrame({ ...source, scheduledNotes: [{ time: 1, type: 'A', pos: 2, accent: 2 }] }).tracks[0]
    expect(soft.impact / strong.impact).toBeCloseTo(.55)
    expect(trackGain({ ...source.params, mode: 'morph', morph: .8 }, 'A')).toBeCloseTo(.2)
    expect(trackGain({ ...source.params, mode: 'morph', morph: .8 }, 'B')).toBeCloseTo(.8)
    for (const level of [1, 2]) expect(trackGain({ ...source.params, level, mode: 'morph', morph: 1 }, 'A')).toBe(1)
    expect(readMusicFrame({ ...source, params: { ...source.params, volumeA: 0 } }).tracks[0]).toMatchObject({ audible: false, impact: 0, height: 0 })
    expect(readMusicFrame({ ...source, params: { ...source.params, mode: 'morph', morph: 1 } }).tracks[0].impact).toBe(0)
  })
  it('disables kinetic motion under reduced motion without changing the musical snapshot', () => {
    const source = engine()
    const frame = readMusicFrame(source, { reduceMotion: true }).tracks[0]
    expect(frame).toMatchObject({ height: 0, impact: 0, scaleX: 1, scaleY: 1, accent: 1 })
    expect(frame.phase).toBe(readMusicFrame(source).tracks[0].phase)
  })
  it('interpolates actual scheduled intervals after a tempo change, without changing any engine data', () => {
    const source = engine({ scheduledNotes: [{ time: 1, type: 'A', pos: 2, accent: 1 }, { time: 1.2, type: 'A', pos: 3, accent: 2 }], getCurrentAudioTime: () => 1.1 })
    const original = JSON.stringify(source)
    expect(readMusicFrame(source).tracks[0].phase).toBeCloseTo(2.5 / 4)
    expect(JSON.stringify(source)).toBe(original)
  })
  it('keeps finite bounded output across all supported subdivisions and long steps', () => {
    for (const step of [.01875, .05, .18, .5, 6]) {
      const source = engine()
      source.params.stepA = step
      for (const time of [0, .999, 1, 1.001, 1.2, 8]) {
        const item = readMusicFrame({ ...source, getCurrentAudioTime: () => time }).tracks[0]
        expect(Number.isFinite(item.phase)).toBe(true)
        expect(item.phase).toBeGreaterThanOrEqual(0)
        expect(item.phase).toBeLessThan(1)
        expect(item.height).toBeGreaterThanOrEqual(0)
        expect(item.height).toBeLessThanOrEqual(1)
      }
    }
  })
})
