import React, { StrictMode } from 'react'
import { act, cleanup, render, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RitmiaProvider, useRitmia, useRitmiaRealtime } from '../../src/context/RitmiaContext'
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

function runNextFrame() {
  const [id, callback] = frames.entries().next().value
  frames.delete(id)
  act(() => callback())
}

describe('RitmiaProvider ciclo de vida del transporte', () => {
  it('inicia con movimiento normal y permite activar su reducción interna', () => {
    const { result } = renderHook(useRitmia, { wrapper })
    expect(result.current.reduceMotion).toBe(false)
    act(() => result.current.setReduceMotion(true))
    expect(result.current.reduceMotion).toBe(true)
  })

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

  it('pausar congela la fase visual, reanudar la conserva y reiniciar vuelve al inicio', async () => {
    const { result } = renderHook(
      () => ({ config: useRitmia(), realtime: useRitmiaRealtime() }),
      { wrapper },
    )
    act(() => {
      result.current.config.setLevel(3)
      result.current.config.setMode('polimetria')
    })
    await act(async () => { await result.current.config.startPlayback() })
    const ctx = audioEngine.ctx
    ctx.advanceTo(audioEngine.startTime + 0.2)
    runNextFrame()
    const pausedProgress = result.current.realtime.progressA
    const pausedProgressB = result.current.realtime.progressB
    expect(pausedProgress).toBeGreaterThan(0)
    expect(pausedProgressB).toBeGreaterThan(0)

    await act(async () => { await result.current.config.pausePlayback() })
    expect(result.current.config.transportState).toBe('paused')
    expect(result.current.config.isPlaying).toBe(false)
    expect(result.current.realtime.progressA).toBeCloseTo(pausedProgress, 10)
    expect(result.current.realtime.progressB).toBeCloseTo(pausedProgressB, 10)
    expect(frames.size).toBe(0)
    expect(result.current.realtime.progressA).toBeCloseTo(pausedProgress, 10)

    act(() => result.current.config.setBpm(200))
    expect(audioEngine.nextNoteTimeA).toBeGreaterThan(ctx.currentTime)
    expect(audioEngine.nextNoteTimeB).toBeGreaterThan(ctx.currentTime)
    await act(async () => { await result.current.config.startPlayback() })
    expect(result.current.config.transportState).toBe('playing')
    runNextFrame()
    expect(result.current.realtime.progressA).toBeCloseTo(pausedProgress, 10)
    expect(result.current.realtime.progressB).toBeCloseTo(pausedProgressB, 10)

    act(() => result.current.config.stopPlayback())
    expect(result.current.config.transportState).toBe('stopped')
    expect(result.current.realtime.progressA).toBe(0)
    expect(result.current.realtime.currentBeatA).toBe(-1)
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

  it('el progreso y el pulso visual siguen el reloj y solo reaccionan después del evento', async () => {
    let mainRenders = 0
    let realtime
    let config
    function MainProbe() {
      mainRenders++
      config = useRitmia()
      return null
    }
    function RealtimeProbe() {
      realtime = useRitmiaRealtime()
      return null
    }
    render(<RitmiaProvider><MainProbe /><RealtimeProbe /></RitmiaProvider>)
    act(() => {
      config.setBpm(120)
      config.setNumA(4)
      config.setDenA(4)
      config.setAccentsA([2, 1, 0, 0])
    })
    await act(async () => { await config.startPlayback() })
    const ctx = audioEngine.ctx
    const startTime = audioEngine.startTime

    ctx.advanceTo(startTime - 0.01)
    runNextFrame()
    expect(realtime.currentBeatA).toBe(-1)
    expect(realtime.progressA).toBe(0)
    const rendersAfterStart = mainRenders

    ctx.advanceTo(startTime)
    expect(ctx.audibleAt(startTime)).toHaveLength(2)
    runNextFrame()
    expect(realtime.currentBeatA).toBe(0)
    expect(realtime.progressA).toBe(0)
    expect(mainRenders).toBe(rendersAfterStart)

    ctx.advanceTo(startTime + 0.02)
    runNextFrame()
    expect(realtime.currentBeatA).toBe(0)
    expect(realtime.progressA).toBeCloseTo(0.01, 10)
    expect(mainRenders).toBe(rendersAfterStart)
  })

  it('BPM nuevo se refleja en progreso y cancelación del lookahead sin reiniciar', async () => {
    const { result } = renderHook(
      () => ({ config: useRitmia(), realtime: useRitmiaRealtime() }),
      { wrapper },
    )
    act(() => {
      result.current.config.setBpm(120)
      result.current.config.setNumA(4)
      result.current.config.setDenA(4)
      result.current.config.setAccentsA([2, 1, 0, 0])
    })
    await act(async () => { await result.current.config.startPlayback() })
    const ctx = audioEngine.ctx
    const startTime = audioEngine.startTime
    ctx.advanceTo(startTime + 0.41)
    audioEngine.schedule()
    const staleFuture = audioEngine.scheduledNotes.find(note => note.type === 'A' && note.time > ctx.currentTime)
    expect(staleFuture).toBeDefined()

    act(() => result.current.config.setBpm(200))
    expect(audioEngine.startTime).toBe(startTime)
    expect(audioEngine.scheduledNotes).not.toContain(staleFuture)
    expect(ctx.sources.find(source => source.startTime === staleFuture.time).stopTime)
      .toBe(ctx.currentTime)
    expect(audioEngine.params.stepA).toBeCloseTo(0.3, 10)

    ctx.advanceTo(startTime + 0.6)
    audioEngine.schedule()
    runNextFrame()
    expect(result.current.realtime.progressA).toBeCloseTo(0.5, 10)
    expect(result.current.realtime.currentBeatA).toBe(-1)
  })

  it('el atraso del hilo salta eventos pasados y una pausa de AudioContext congela el progreso', async () => {
    const { result } = renderHook(
      () => ({ config: useRitmia(), realtime: useRitmiaRealtime() }),
      { wrapper },
    )
    act(() => {
      result.current.config.setBpm(120)
      result.current.config.setNumA(4)
      result.current.config.setDenA(4)
    })
    await act(async () => { await result.current.config.startPlayback() })
    const ctx = audioEngine.ctx
    const startTime = audioEngine.startTime

    ctx.advanceTo(startTime + 2.32)
    audioEngine.schedule()
    runNextFrame()
    expect(audioEngine.scheduledNotes.every(note => note.time >= ctx.currentTime)).toBe(true)
    expect(result.current.realtime.currentBeatA).toBe(-1)
    expect(result.current.realtime.progressA).toBeCloseTo(0.16, 10)

    ctx.state = 'suspended'
    const frozenProgress = result.current.realtime.progressA
    runNextFrame()
    expect(result.current.realtime.progressA).toBe(frozenProgress)
    expect(frames.size).toBe(1)
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
    expect(audioEngine.stepCountA).toBe(0)

    act(() => {
      result.current.setNumA(7)
      result.current.setDenA(8)
    })
    expect(result.current.timing.measureB).toBe(4)
    expect(audioEngine.params.stepB).toBe(0.25)
    expect(audioEngine.startTime).toBe(startTime)
    expect(audioEngine.stepCountA).toBe(0)

    act(() => result.current.setClaveIndex(1))

    expect(audioEngine.startTime).toBe(startTime)
    expect(ctx.sources.filter(source => source.startTime === startTime)
      .every(source => source.stopTime === ctx.currentTime)).toBe(true)
    expect(audioEngine.params.stepB).toBe(0.25)
    expect(audioEngine.params.accentsB[2]).toBe(2)
    expect(audioEngine.stepCountB).toBe(0)
    expect(audioEngine.scheduledNotes.some(note => note.type === 'B' && note.time > ctx.currentTime)).toBe(false)

    const nextHitTime = audioEngine.nextNoteTimeB
    ctx.advanceTo(nextHitTime)
    audioEngine.schedule()
    expect(audioEngine.scheduledNotes.find(note =>
      note.type === 'B' && Math.abs(note.time - nextHitTime) < 1e-10
    )).toMatchObject({ pos: 0, accent: 0 })
    ctx.advanceTo(audioEngine.nextNoteTimeB)
    audioEngine.schedule()
    ctx.advanceTo(audioEngine.nextNoteTimeB)
    audioEngine.schedule()
    expect(audioEngine.scheduledNotes.find(note => note.type === 'B' && note.pos === 2))
      .toMatchObject({ pos: 2, accent: 2 })
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
