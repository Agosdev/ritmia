import React from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { RitmiaProvider, useRitmia } from '../../src/context/RitmiaContext'
import { MUSICAL_PRESETS } from '../../src/music/presets'
import { audioEngine } from '../../src/audio/AudioEngine'
import { controlledAudioContext } from '../helpers/controlledAudioContext'

const wrapper = ({ children }) => <RitmiaProvider>{children}</RitmiaProvider>

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('AudioContext', controlledAudioContext())
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(async () => {
  cleanup()
  await audioEngine.dispose()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('preserva el BPM manual al aplicar consecutivamente todos los presets y cambiar de nivel', () => {
  const { result } = renderHook(useRitmia, { wrapper })
  act(() => { result.current.setBpm(100); result.current.setLevel(2) })

  for (const preset of MUSICAL_PRESETS) {
    act(() => result.current.applyPreset(preset.id))
    expect(result.current.bpm).toBe(100)
    expect(result.current.suggestedBpm).toBe(preset.bpm)
    expect(result.current.numA).toBe(preset.num)
    expect(result.current.denA).toBe(preset.den)
    expect(result.current.timing.measureA).toBeCloseTo((60 / 100) * preset.num * (4 / preset.den), 12)
    expect(result.current.timing.stepA).toBeCloseTo((60 / 100) * (4 / preset.den) / (preset.subdivision ?? 1), 12)
  }

  act(() => { result.current.setLevel(1); result.current.setLevel(2) })
  expect(result.current.bpm).toBe(100)
})

it('solo aplica el tempo sugerido ante una acción explícita y respeta los límites validados', () => {
  const { result } = renderHook(useRitmia, { wrapper })
  act(() => result.current.applyPreset('maqsum'))
  expect(result.current.bpm).toBe(92)
  expect(result.current.suggestedBpm).toBe(100)
  act(() => result.current.setBpm(result.current.suggestedBpm))
  expect(result.current.bpm).toBe(100)
  expect(result.current.timing.measureA).toBeCloseTo(2.4, 12)
  act(() => result.current.setBpm(201))
  expect(result.current.bpm).toBe(100)
})

it('cambiar BPM y preset durante playback conserva la línea temporal y no duplica eventos', async () => {
  const { result } = renderHook(useRitmia, { wrapper })
  act(() => { result.current.setBpm(100); result.current.applyPreset('maqsum') })
  await act(async () => { await result.current.startPlayback() })
  const context = audioEngine.ctx
  const startTime = audioEngine.startTime

  context.advanceTo(.2)
  audioEngine.schedule()
  act(() => result.current.setBpm(120))
  expect(audioEngine.ctx).toBe(context)
  expect(audioEngine.isPlaying).toBe(true)
  expect(audioEngine.startTime).toBe(startTime)
  expect(result.current.timing.measureA).toBe(2)

  act(() => result.current.applyPreset('funk-clasico'))
  expect(result.current.bpm).toBe(120)
  expect(result.current.timing.measureA).toBe(2)
  expect(audioEngine.isPlaying).toBe(true)
  expect(audioEngine.startTime).toBe(startTime)
  const noteKeys = audioEngine.scheduledNotes.map(note => `${note.type}:${note.time}`)
  expect(new Set(noteKeys).size).toBe(noteKeys.length)
  expect(result.current.strokesA).toEqual(MUSICAL_PRESETS.find(preset => preset.id === 'funk-clasico').events
    .map((events, index) => ({ events, referenceAccent: MUSICAL_PRESETS.find(preset => preset.id === 'funk-clasico').accents[index] })))
})
