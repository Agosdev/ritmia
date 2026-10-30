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
      level: 3,
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

  it('informa el error de carga y continúa con la síntesis original', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await engine.start({ soundKit: 'acoustic', metronome: false })

    expect(engine.soundBankError).toBeInstanceOf(Error)
    expect(engine.sampleBankBuffers).toBeNull()
    expect(engine.ctx.sources[0].constructor.name).toContain('Oscillator')
  })

  it('espera a que terminen todas las solicitudes antes de activar el fallback', async () => {
    let finishRemainingRequests
    const remainingRequests = new Promise(resolve => { finishRemainingRequests = resolve })
    const fetchMock = vi.fn(url => url.endsWith('kick-soft.wav')
      ? Promise.resolve({ ok: false, status: 404 })
      : remainingRequests)
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const starting = engine.start({ soundKit: 'acoustic', metronome: false })
    while (fetchMock.mock.calls.length < 4) await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(engine.isPlaying).toBe(false)

    finishRemainingRequests({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    })
    await starting
    expect(engine.isPlaying).toBe(true)
    expect(engine.soundBankError).toBeInstanceOf(Error)
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
