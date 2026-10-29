import React, { StrictMode } from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RitmiaProvider, useRitmia } from '../../src/context/RitmiaContext'
import { audioEngine } from '../../src/audio/AudioEngine'
import { controlledAudioContext } from '../helpers/controlledAudioContext'

let frames
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('AudioContext', controlledAudioContext())
  frames = new Map()
  let nextFrame = 0
  vi.stubGlobal('requestAnimationFrame', callback => {
    frames.set(++nextFrame, callback)
    return nextFrame
  })
  vi.stubGlobal('cancelAnimationFrame', id => frames.delete(id))
})
afterEach(async () => {
  cleanup()
  await audioEngine.dispose()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const wrapper = ({ children }) => <RitmiaProvider>{children}</RitmiaProvider>

describe('RitmiaProvider ciclo de vida del transporte', () => {
  it('desmontar cancela fuentes futuras, rAF, timer, conexiones y contexto', async () => {
    const { result, unmount } = renderHook(useRitmia, { wrapper })
    await act(async () => { await result.current.startPlayback() })
    const ctx = audioEngine.ctx
    expect(result.current.isPlaying).toBe(true)
    expect(ctx.audibleAt(0.09).length).toBeGreaterThan(0)
    expect(frames.size).toBe(1)
    unmount()
    expect(ctx.audibleAt(0.09)).toEqual([])
    expect(ctx.nodes.every(n => n.connections.size === 0)).toBe(true)
    expect(ctx.state).toBe('closed')
    expect(audioEngine.ctx).toBeNull()
    expect(audioEngine.activeVoices.size).toBe(0)
    expect(audioEngine.scheduledNotes).toEqual([])
    expect(vi.getTimerCount()).toBe(0)
    expect(frames.size).toBe(0)
  })

  it('desmontar mientras resume está pendiente no deja audio ni rAF tardíos', async () => {
    vi.stubGlobal('AudioContext', controlledAudioContext({ suspended: true }))
    const { result, unmount } = renderHook(useRitmia, { wrapper })
    let pending
    act(() => { pending = result.current.startPlayback() })
    const ctx = audioEngine.ctx
    unmount()
    await act(async () => {
      ctx.resumeResolvers[0]()
      await pending
    })
    expect(ctx.state).toBe('closed')
    expect(ctx.sources).toHaveLength(0)
    expect(audioEngine.isPlaying).toBe(false)
    expect(audioEngine.ctx).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
    expect(frames.size).toBe(0)
  })

  it('Stop durante resume mantiene el estado React detenido tras completarse Start', async () => {
    vi.stubGlobal('AudioContext', controlledAudioContext({ suspended: true }))
    const { result } = renderHook(useRitmia, { wrapper })
    let pending
    act(() => { pending = result.current.startPlayback() })
    const ctx = audioEngine.ctx
    act(() => result.current.stopPlayback())
    await act(async () => {
      ctx.resumeResolvers[0]()
      await pending
    })
    expect(result.current.isPlaying).toBe(false)
    expect(ctx.sources).toHaveLength(0)
    expect(frames.size).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('dos toggles inmediatos cancelan un inicio pendiente', async () => {
    vi.stubGlobal('AudioContext', controlledAudioContext({ suspended: true }))
    const { result } = renderHook(useRitmia, { wrapper })
    act(() => result.current.togglePlayback())
    const ctx = audioEngine.ctx
    const pending = audioEngine.startPromise
    act(() => result.current.togglePlayback())
    await act(async () => {
      ctx.resumeResolvers[0]()
      await pending
    })
    expect(result.current.isPlaying).toBe(false)
    expect(audioEngine.isPlaying).toBe(false)
    expect(ctx.sources).toHaveLength(0)
    expect(frames.size).toBe(0)
  })

  it('Start repetido crea un solo rAF y un único transporte', async () => {
    const { result } = renderHook(useRitmia, { wrapper })
    await act(async () => {
      await Promise.all([result.current.startPlayback(), result.current.startPlayback()])
    })
    expect(frames.size).toBe(1)
    expect(vi.getTimerCount()).toBe(1)
    expect(audioEngine.scheduledNotes).toHaveLength(1)
  })

  it('cambiar de clave actualiza el patrón sin reiniciar ni comprimir su ciclo', async () => {
    const { result } = renderHook(useRitmia, { wrapper })
    act(() => {
      result.current.setBpm(120)
      result.current.setNumA(4)
      result.current.setDenA(4)
      result.current.setLevel(3)
      result.current.setMode('clave')
    })

    expect(result.current.numB).toBe(16)
    expect(result.current.timing.measureB).toBe(4)
    expect(result.current.timing.stepB).toBe(0.25)
    await act(async () => { await result.current.startPlayback() })
    const startTime = audioEngine.startTime
    const ctx = audioEngine.ctx

    act(() => {
      result.current.setNumA(3)
      result.current.setDenA(4)
    })
    expect(result.current.timing.measureB).toBe(4)
    expect(audioEngine.params.stepB).toBe(0.25)
    expect(audioEngine.startTime).toBe(startTime)
    expect(audioEngine.stepCountA).toBe(1)

    act(() => {
      result.current.setNumA(7)
      result.current.setDenA(8)
    })
    expect(result.current.timing.measureB).toBe(4)
    expect(audioEngine.params.stepB).toBe(0.25)
    expect(audioEngine.startTime).toBe(startTime)
    expect(audioEngine.stepCountA).toBe(1)

    act(() => result.current.setClaveIndex(1))

    expect(audioEngine.startTime).toBe(startTime)
    expect(audioEngine.params.stepB).toBe(0.25)
    expect(audioEngine.params.accentsB[2]).toBe(2)
    expect(audioEngine.stepCountB).toBe(1)

    const nextHitTime = startTime + 2 * result.current.timing.stepB
    ctx.advanceTo(nextHitTime)
    audioEngine.schedule()
    expect(audioEngine.scheduledNotes.find(note =>
      note.type === 'B' && Math.abs(note.time - nextHitTime) < 1e-10
    )).toMatchObject({ pos: 2, accent: 2 })
    const bEvents = audioEngine.scheduledNotes.filter(note => note.type === 'B')
    expect(new Set(bEvents.map(note => note.time)).size).toBe(bEvents.length)
  })

  it('StrictMode y remontaje permiten reproducir con un contexto nuevo', async () => {
    const strictWrapper = ({ children }) => <StrictMode><RitmiaProvider>{children}</RitmiaProvider></StrictMode>
    const first = renderHook(useRitmia, { wrapper: strictWrapper })
    await act(async () => { await first.result.current.startPlayback() })
    const ctx = audioEngine.ctx
    first.unmount()
    const second = renderHook(useRitmia, { wrapper: strictWrapper })
    await act(async () => { await second.result.current.startPlayback() })
    expect(ctx.state).toBe('closed')
    expect(audioEngine.ctx).not.toBe(ctx)
    expect(audioEngine.ctx.audibleAt(0.09).length).toBeGreaterThan(0)
    expect(frames.size).toBe(1)
    expect(vi.getTimerCount()).toBe(1)
    expect(second.result.current.isPlaying).toBe(true)
  })
})
