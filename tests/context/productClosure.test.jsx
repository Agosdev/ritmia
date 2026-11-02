import React from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { RitmiaProvider, useRitmia } from '../../src/context/RitmiaContext'
import { audioEngine, AudioEngine } from '../../src/audio/AudioEngine'
import { MUSICAL_PRESETS } from '../../src/music/presets'
import { calculateTiming } from '../../src/music/timingCalculator'
import { controlledAudioContext } from '../helpers/controlledAudioContext'
const wrapper = ({ children }) => <RitmiaProvider>{children}</RitmiaProvider>
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('AudioContext', controlledAudioContext())
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})
afterEach(async () => { cleanup(); await audioEngine.dispose(); vi.useRealTimers(); vi.unstubAllGlobals() })

it.each(MUSICAL_PRESETS)('$name: exact step duration, count, accents and editable state without changing B or marker', async preset => {
  const { result } = renderHook(useRitmia, { wrapper })
  act(() => { result.current.setLevel(2); result.current.setNumB(9); result.current.applyPreset(preset.id) })
  expect(result.current.numB).toBe(9)
  expect(result.current.level).toBe(2)
  expect(result.current.metronome).toBe(false)
  expect(result.current.presetModified).toBe(false)
  expect(result.current.accentsA).toEqual(preset.accents)
  expect(result.current.timing.stepA).toBeCloseTo(60 / preset.bpm, 12)
  if (preset.id.startsWith('bulerias')) {
    expect(result.current.beatLabelsA).toEqual([12,1,2,3,4,5,6,7,8,9,10,11])
    expect(result.current.audioDescription).toContain('12, 3, ' + (preset.id === 'bulerias' ? '6' : '7') + ', 8, 10')
  }
  await act(async () => { await result.current.startPlayback() })
  const ctx = audioEngine.ctx
  for (let t = .025; t < .08 + (preset.num - 1) * result.current.timing.stepA; t += .025) { ctx.advanceTo(t); audioEngine.schedule() }
  const aSources = ctx.sources.filter(source => [audioEngine.sampleBankBuffers.kickSoft, audioEngine.sampleBankBuffers.kickStrong].includes(source.buffer))
  const expected = preset.accents.flatMap((accent, index) => accent ? [.08 + index * result.current.timing.stepA] : [])
  expect(aSources.map(source => source.startTime)).toHaveLength(expected.length)
  aSources.forEach((source, index) => expect(source.startTime).toBeCloseTo(expected[index], 10))
  act(() => result.current.setAccentsA(prev => prev.map((value, i) => i === 0 ? (value + 1) % 3 : value)))
  expect(result.current.presetModified).toBe(true)
})

it('reset keeps stopped intent or restarts once when playing; stop toggle preserves phase', async () => {
  const { result } = renderHook(useRitmia, { wrapper })
  act(() => result.current.resetPlayback())
  expect(result.current.transportState).toBe('stopped')
  await act(async () => { await result.current.startPlayback() })
  audioEngine.ctx.advanceTo(.17)
  await act(async () => { await result.current.pausePlayback() })
  const next = audioEngine.nextNoteTimeA
  await act(async () => { await result.current.startPlayback() })
  expect(audioEngine.nextNoteTimeA).toBe(next)
  await act(async () => { result.current.resetPlayback(); await Promise.resolve(); await Promise.resolve() })
  expect(audioEngine.isPlaying).toBe(true)
  expect(audioEngine.scheduledNotes[0]).toMatchObject({ pos: 0, type: 'A' })
  expect(new Set(audioEngine.scheduledNotes.map(n => `${n.type}-${n.time}`)).size).toBe(audioEngine.scheduledNotes.length)
  expect(vi.getTimerCount()).toBe(1)
})

it('cycle marking is acoustic, brief, off by default and scheduled exactly once per cycle', async () => {
  const engine = new AudioEngine()
  const timing = calculateTiming({ bpm: 120, numA: 4, denA: 4 })
  await engine.start({ ...timing, accentsA: [0,0,0,0] })
  expect(engine.ctx.sources).toHaveLength(0)
  engine.stop()
  await engine.start({ metronome: true })
  const ctx = engine.ctx
  for (let t = .025; t < 4.1; t += .025) { ctx.advanceTo(t); engine.schedule() }
  const times = ctx.sources.map(s => s.startTime)
  expect(times).toHaveLength(3)
  expect(times[1] - times[0]).toBeCloseTo(2, 10)
  expect(times[2] - times[1]).toBeCloseTo(2, 10)
  expect(ctx.sources.every(s => s.buffer === engine.sampleBankBuffers.snareSoft)).toBe(true)
  expect(ctx.sources[0].stopTime - times[0]).toBeCloseTo(.08)
  engine.stop()
  expect(ctx.audibleAt(ctx.currentTime)).toEqual([])
  await engine.dispose()
})

it.each(['polirritmia', 'polimetria', 'morph', 'clave'])('dos niveles y presets conservan modo %s y el patrón B', mode => {
  const { result } = renderHook(useRitmia, { wrapper })
  act(() => { result.current.setLevel(2); result.current.setMode(mode) })
  const before = [...result.current.accentsB]
  act(() => result.current.applyPreset('tangos'))
  expect(result.current.mode).toBe(mode)
  expect(result.current.level).toBe(2)
  expect(result.current.accentsB).toEqual(before)
  act(() => result.current.setLevel(3))
  expect(result.current.level).toBe(2)
  act(() => result.current.setLevel(1))
  expect(audioEngine.params.level).toBe(1)
  act(() => result.current.setLevel(2))
  expect(audioEngine.params.level).toBe(2)
  expect(result.current.accentsB).toEqual(before)
})

it('clave restaura el patrón B anterior al cambiar a otro modo', () => {
  const { result } = renderHook(useRitmia, { wrapper })
  act(() => { result.current.setLevel(2); result.current.setNumB(3); result.current.setAccentsB([1,0,2]) })
  act(() => result.current.setMode('clave'))
  expect(result.current.numB).not.toBe(3)
  act(() => result.current.setMode('polimetria'))
  expect(result.current.numB).toBe(3)
  expect(result.current.accentsB).toEqual([1,0,2])
})
