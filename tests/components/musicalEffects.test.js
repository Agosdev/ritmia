import { describe, expect, it } from 'vitest'
import {
  getAmbientTransform,
  getVisibleMusicalImpacts,
  isDenseVisualPlayback,
} from '../../src/components/visualizer/musicalEffects'

const config = {
  scheduledNotes: [],
  audioTime: 1,
  transportState: 'playing',
  showTrackB: true,
  reduceMotion: false,
  bpm: 92,
  numA: 4,
  numB: 4,
  stepA: 0.5,
  stepB: 0.5,
  volumeA: 1,
  volumeB: 1,
  mode: 'polirritmia',
  morphAmount: 0.5,
}

describe('musical visual effects', () => {
  it('only responds to already elapsed accented notes, never silent or future positions', () => {
    const impacts = getVisibleMusicalImpacts({
      ...config,
      scheduledNotes: [
        { time: 0.98, pos: 0, type: 'A', accent: 2 },
        { time: 0.99, pos: 1, type: 'A', accent: 0 },
        { time: 1.01, pos: 2, type: 'B', accent: 2 },
      ],
    })

    expect(impacts).toHaveLength(1)
    expect(impacts[0]).toMatchObject({ type: 'A', pos: 0, accent: 2, intensity: 1 })
  })

  it('keeps track identity and scales morph impacts by the configured gain balance', () => {
    const impacts = getVisibleMusicalImpacts({
      ...config,
      mode: 'morph',
      morphAmount: 0.75,
      scheduledNotes: [
        { time: 0.96, pos: 1, type: 'A', accent: 2 },
        { time: 0.96, pos: 2, type: 'B', accent: 1 },
      ],
    })

    expect(Object.fromEntries(impacts.map(({ type, intensity }) => [type, intensity]))).toEqual({
      A: 0.25,
      B: 0.39,
    })
  })

  it('produces no impacts for zero-volume, reduced-motion, stopped, or dense playback', () => {
    const scheduledNotes = [{ time: 0.98, pos: 0, type: 'A', accent: 2 }]
    for (const overrides of [
      { volumeA: 0 },
      { reduceMotion: true },
      { transportState: 'stopped' },
      { bpm: 200 },
      { numA: 32, numB: 32 },
    ]) {
      expect(getVisibleMusicalImpacts({ ...config, ...overrides, scheduledNotes })).toEqual([])
    }
  })

  it('limits concurrent impacts and drops expired or over-capacity pulses', () => {
    const scheduledNotes = Array.from({ length: 6 }, (_, index) => ({
      time: 0.98,
      pos: index,
      type: index % 2 ? 'B' : 'A',
      accent: 2,
    }))
    const impacts = getVisibleMusicalImpacts({ ...config, scheduledNotes })

    expect(impacts).toHaveLength(4)
    expect(getVisibleMusicalImpacts({
      ...config,
      audioTime: 1.2,
      scheduledNotes: [{ time: 0.98, pos: 0, type: 'A', accent: 2 }],
    })).toEqual([])
  })

  it('freezes ambient movement when paused and resets it when stopped or reduced', () => {
    const playing = getAmbientTransform(3, 'playing', false)
    expect(getAmbientTransform(3, 'paused', false)).toBe(playing)
    expect(getAmbientTransform(3, 'stopped', false)).toBe('translate(0 0)')
    expect(getAmbientTransform(3, 'playing', true)).toBe('translate(0 0)')
    expect(getAmbientTransform(3, 'playing', false, true)).toBe('translate(0 0)')
    expect(getAmbientTransform(3.1, 'playing', false)).not.toBe(playing)
  })

  it('reduces decorative motion at high tempo and dense cycle lengths', () => {
    expect(isDenseVisualPlayback({ ...config, bpm: 160 })).toBe(true)
    expect(isDenseVisualPlayback({ ...config, numA: 32, numB: 32 })).toBe(true)
    expect(isDenseVisualPlayback(config)).toBe(false)
  })
})
