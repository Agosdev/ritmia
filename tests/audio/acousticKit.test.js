import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AudioEngine } from '../../src/audio/AudioEngine'
import { controlledAudioContext } from '../helpers/controlledAudioContext'

let engine

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('AudioContext', controlledAudioContext())
  engine = new AudioEngine()
})

afterEach(async () => {
  await engine.dispose()
  vi.restoreAllMocks()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('kit acústico CC0', () => {
  it('decodifica cuatro muestras una vez y programa capas A/B con el reloj del motor', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    }))
    vi.stubGlobal('fetch', fetchMock)

    await engine.start({
      level: 2,
      soundKit: 'acoustic',
      stepA: 0.04,
      stepB: 0.04,
      accentsA: [1, 2],
      accentsB: [1, 2],
      metronome: false,
    })
    const ctx = engine.ctx
    ctx.advanceTo(0.05)
    engine.schedule()

    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(Object.keys(engine.sampleBankBuffers)).toEqual([
      'kickSoft', 'kickStrong', 'snareSoft', 'snareStrong',
    ])
    expect(ctx.sources.map(source => [source.startTime, source.buffer])).toEqual([
      [0.08, engine.sampleBankBuffers.kickSoft],
      [0.08, engine.sampleBankBuffers.snareSoft],
      [0.12, engine.sampleBankBuffers.kickStrong],
      [0.12, engine.sampleBankBuffers.snareStrong],
    ])

    engine.stop()
    await engine.start()
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('rechaza el inicio sin síntesis y permite reintentar', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(engine.start({ metronome: false })).rejects.toThrow('HTTP 404')

    expect(engine.soundBankError).toBeInstanceOf(Error)
    expect(engine.sampleBankBuffers).toBeNull()
    expect(engine.ctx.sources).toEqual([])
    expect(engine.isPlaying).toBe(false)
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })))
    await engine.start()
    expect(engine.isPlaying).toBe(true)
  })

  it('espera a que terminen todas las solicitudes antes de rechazar el inicio', async () => {
    let finishRemainingRequests
    const remainingRequests = new Promise(resolve => { finishRemainingRequests = resolve })
    const fetchMock = vi.fn(url => url.endsWith('kick-soft.wav')
      ? Promise.resolve({ ok: false, status: 404 })
      : remainingRequests)
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const starting = engine.start({ metronome: false })
    const rejected = expect(starting).rejects.toThrow('HTTP 404')
    while (fetchMock.mock.calls.length < 4) await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(engine.isPlaying).toBe(false)

    finishRemainingRequests({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    })
    await rejected
    expect(engine.isPlaying).toBe(false)
    expect(engine.soundBankError).toBeInstanceOf(Error)
  })

  it('descarta buffers y errores tardíos si se desmonta durante la carga', async () => {
    let finish
    const response = new Promise(resolve => { finish = resolve })
    const loading = vi.fn(() => response)
    vi.stubGlobal('fetch', loading)
    const starting = engine.start()
    while (loading.mock.calls.length < 4) await Promise.resolve()
    await engine.dispose()
    finish({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })
    await starting
    expect(engine.ctx).toBeNull()
    expect(engine.sampleBankBuffers).toBeNull()
    expect(engine.sampleBankContext).toBeNull()
    expect(engine.isPlaying).toBe(false)
    expect(engine.timerId).toBeNull()
  })

  it('un reinicio durante una carga fallida compartida nunca arranca en silencio', async () => {
    let finish
    const response = new Promise(resolve => { finish = resolve })
    const loading = vi.fn(() => response)
    vi.stubGlobal('fetch', loading)
    const ensure = vi.spyOn(engine, 'ensureAcousticSoundBank')
    const first = engine.start()
    while (loading.mock.calls.length < 4) await Promise.resolve()
    engine.stop()
    const second = engine.start()
    const rejected = expect(second).rejects.toThrow('HTTP 503')
    while (ensure.mock.calls.length < 2) await Promise.resolve()
    finish({ ok: false, status: 503 })
    await first
    await rejected
    expect(engine.isPlaying).toBe(false)
    expect(engine.ctx.sources).toEqual([])
    expect(engine.soundBankError).toBeInstanceOf(Error)
    expect(loading).toHaveBeenCalledTimes(4)
  })

  it.each([1])('nivel %i mantiene A audible aunque Morph guardado esté al 100%%', async level => {
    await engine.start({ level, mode: 'morph', morph: 1, volumeA: .75, accentsA: [2], metronome: false })
    const gain = engine.ctx.nodes.find(node => node.gain && node !== engine.masterGain)
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(.75, engine.startTime)
    expect(engine.params.mode).toBe('morph')
    expect(engine.params.morph).toBe(1)
  })

  it('mantiene silencio en posiciones vacías sin metrónomo', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    })))

    await engine.start({
      soundKit: 'acoustic',
      accentsA: [0],
      metronome: false,
    })

    expect(engine.scheduledNotes[0].accent).toBe(0)
    expect(engine.ctx.sources).toEqual([])
  })

  it('agenda 32 posiciones acústicas a 200 BPM sin duplicar timestamps', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    })))

    await engine.start({
      soundKit: 'acoustic',
      stepA: 0.3,
      accentsA: Array(32).fill(1),
      metronome: false,
    })
    const ctx = engine.ctx
    for (let time = 0; time < 9.5; time += 0.025) {
      ctx.advanceTo(time)
      engine.schedule()
    }

    const starts = ctx.sources.map(source => source.startTime)
    expect(starts).toHaveLength(32)
    expect(new Set(starts).size).toBe(32)
    expect(engine.activeVoices.size).toBeLessThanOrEqual(4)
  })
})
