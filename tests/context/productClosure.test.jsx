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

it.each(MUSICAL_PRESETS)('$name: exact step duration, count, accents and locked state without changing B or marker', async preset => {
  const { result } = renderHook(useRitmia, { wrapper })
  act(() => { result.current.setLevel(2); result.current.setNumB(9); result.current.setInstrumentChoiceA('acoustic'); result.current.applyPreset(preset.id) })
  expect(result.current.numB).toBe(9)
  expect(result.current.numA).toBe(preset.num)
  expect(result.current.denA).toBe(preset.den)
  expect(result.current.bpm).toBe(92)
  expect(result.current.suggestedBpm).toBe(preset.bpm)
  expect(result.current.timing.measureA).toBeCloseTo((60 / 92) * preset.num * (4 / preset.den), 12)
  expect(result.current.level).toBe(2)
  expect(result.current.metronome).toBe(false)
  expect(result.current.presetModified).toBe(false)
  expect(result.current.accentsA).toEqual(preset.accents)
  expect(result.current.timing.stepA).toBeCloseTo((60 / 92) * (4 / preset.den) / (preset.subdivision ?? 1), 12)
  if (preset.id.startsWith('bulerias')) {
    expect(result.current.beatLabelsA).toEqual([12,1,2,3,4,5,6,7,8,9,10,11])
    expect(result.current.audioDescription).toContain('12, 3, ' + (preset.id === 'bulerias' ? '6' : '7') + ', 8, 10')
  }
  await act(async () => { await result.current.startPlayback() })
  const ctx = audioEngine.ctx
  for (let t = .025; t < .08 + (preset.accents.length - 1) * result.current.timing.stepA; t += .025) { ctx.advanceTo(t); audioEngine.schedule() }
  const aSources = ctx.sources.filter(source => [audioEngine.sampleBankBuffers.kickSoft, audioEngine.sampleBankBuffers.kickStrong].includes(source.buffer))
  const expected = preset.accents.flatMap((accent, index) => accent ? Array(preset.events?.[index].length || 1).fill(.08 + index * result.current.timing.stepA) : [])
  expect(aSources.map(source => source.startTime)).toHaveLength(expected.length)
  aSources.forEach((source, index) => expect(source.startTime).toBeCloseTo(expected[index], 10))
  act(() => result.current.setAccentsA(prev => prev.map((value, i) => i === 0 ? (value + 1) % 3 : value)))
  expect(result.current.accentsA).toEqual(preset.accents)
  expect(result.current.presetLocked).toBe(true)
  act(() => result.current.clearPreset())
  expect(result.current.presetId).toBe('')
  expect(result.current.presetLocked).toBe(false)
  expect(result.current.accentsA).toEqual(preset.accents)
  act(() => result.current.setAccentsA(prev => prev.map((value, i) => i === 0 ? (value + 1) % 3 : value)))
  expect(result.current.accentsA[0]).toBe((preset.accents[0] + 1) % 3)
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

it('presets bloquean todas las ediciones de A; compás libre conserva sonido y desbloquea', async () => {
  const { result } = renderHook(useRitmia, { wrapper })
  act(() => { result.current.setLevel(2); result.current.setInstrumentChoiceA('acoustic'); result.current.applyPreset('tangos') })
  const updater = vi.fn(() => [2, 2, 2, 2])
  act(() => {
    result.current.setNumA(7); result.current.setDenA(8)
    result.current.setAccentsA(updater); result.current.setGroupingA('1+1+1+1')
    result.current.setBpm(120); result.current.setVolumeA(.5)
    result.current.setAccentsB([1,1,1,1,1]); result.current.setMode('polimetria')
  })
  expect(updater).not.toHaveBeenCalled()
  expect(result.current).toMatchObject({ numA: 4, denA: 4, accentsA: [0,2,1,2], groupingA: '2+2', bpm: 120, volumeA: .5, mode: 'polimetria' })
  expect(result.current.accentsB).toEqual([1,1,1,1,1])
  // Selecting another preset still works while locked.
  act(() => result.current.applyPreset('sevillanas'))
  expect(result.current).toMatchObject({ numA: 3, denA: 4, accentsA: [2,1,1], groupingA: '3', presetLocked: true })
  await act(async () => { await result.current.startPlayback() })
  const audioParams = { ...audioEngine.params }
  const nextNote = audioEngine.nextNoteTimeA
  act(() => result.current.clearPreset())
  expect(audioEngine.isPlaying).toBe(true)
  expect(audioEngine.nextNoteTimeA).toBe(nextNote)
  expect(audioEngine.params).toEqual(audioParams)
  act(() => { result.current.setNumA(4); result.current.setDenA(8); result.current.setAccentsA([0,1,2,1]); result.current.setGroupingA('2+2') })
  expect(result.current).toMatchObject({ presetId: '', presetLocked: false, numA: 4, denA: 8, accentsA: [0,1,2,1], groupingA: '2+2' })
})

it('Malfuf conserva 2/4, ocho semicorcheas y fase al desbloquear; la edición libre mantiene la resolución', async () => {
  const { result } = renderHook(useRitmia, { wrapper })
  act(() => { result.current.setInstrumentChoiceA('acoustic'); result.current.applyPreset('malfuf'); result.current.setBpm(120) })
  expect(result.current).toMatchObject({ numA: 2, denA: 4, subdivisionA: 4, gridCountA: 8 })
  expect(result.current.timing.stepA).toBe(.125)
  expect(result.current.timing.measureA).toBe(1)
  expect(result.current.gridGroupingA).toEqual([4, 4])
  expect(result.current.beatLabelsA).toEqual(['1', '1e', '1&', '1a', '2', '2e', '2&', '2a'])
  await act(async () => { await result.current.startPlayback() })
  const params = audioEngine.params
  const next = audioEngine.nextNoteTimeA
  act(() => result.current.clearPreset())
  expect(audioEngine.params).toEqual(params)
  expect(audioEngine.nextNoteTimeA).toBe(next)
  expect(result.current).toMatchObject({ subdivisionA: 4, gridCountA: 8 })
  act(() => result.current.setAccentsA(a => a.map((v, i) => i === 7 ? 1 : v)))
  expect(result.current.accentsA[7]).toBe(1)
  act(() => result.current.setNumA(32))
  expect(result.current.subdivisionA).toBe(1)
  expect(result.current.accentsA).toHaveLength(32)
})
