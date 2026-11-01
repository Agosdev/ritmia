import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AudioEngine } from '../../src/audio/AudioEngine'
import { controlledAudioContext } from '../helpers/controlledAudioContext'
import { calculateTiming } from '../../src/music/timingCalculator'
import { CLAVE_PATTERNS } from '../../src/music/clavePatterns'

const params = {
  level: 1, stepA: 0.5, stepB: 0.375,
  accentsA: [2, 1, 2, 1], accentsB: [2, 1, 1, 2], metronome: false,
}

let engine
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('AudioContext', controlledAudioContext())
  engine = new AudioEngine()
})
afterEach(async () => {
  await engine.dispose()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function expectWindow(notes, now) {
  expect(notes.length).toBeGreaterThan(0)
  for (const note of notes) {
    expect(note.time).toBeGreaterThanOrEqual(now)
    expect(note.time).toBeLessThan(now + 0.1)
  }
}

describe('AudioEngine transporte y scheduler', () => {
  it('Start → Stop corta fuentes activas y no programa más eventos', async () => {
    await engine.start(params)
    const ctx = engine.ctx
    expect(engine.scheduledNotes).toEqual([{ time: 0.08, pos: 0, type: 'A', accent: 2 }])
    ctx.advanceTo(0.1)
    expect(ctx.audibleAt(0.1)).toHaveLength(1)
    engine.stop()
    expect(ctx.audibleAt(0.1)).toHaveLength(0)
    expect(engine.activeVoices.size).toBe(0)
    expect(engine.scheduledNotes).toEqual([])
    ctx.advanceTo(10)
    vi.advanceTimersByTime(1000)
    engine.schedule()
    expect(ctx.sources).toHaveLength(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('Start → Stop → Start reinicia desde el primer pulso sin fuentes viejas', async () => {
    await engine.start(params)
    const ctx = engine.ctx
    const old = ctx.sources[0]
    engine.stop()
    ctx.advanceTo(2)
    await engine.start()
    expect(engine.ctx).toBe(ctx)
    expect(engine.scheduledNotes).toEqual([{ time: 2.08, pos: 0, type: 'A', accent: 2 }])
    expect(ctx.audibleAt(2.09)).toHaveLength(1)
    expect(ctx.audibleAt(2.09)).not.toContain(old)
    expect(vi.getTimerCount()).toBe(1)
  })

  it('pausa entre pulsos cancela voces anticipadas y reanuda A y B desde su fase exacta', async () => {
    await engine.start({ ...params, level: 3 })
    const ctx = engine.ctx
    const startTime = engine.startTime
    ctx.advanceTo(0.19)

    await engine.pause()
    const paused = {
      nextA: engine.nextNoteTimeA,
      nextB: engine.nextNoteTimeB,
      countA: engine.stepCountA,
      countB: engine.stepCountB,
    }
    expect(engine.transportState).toBe('paused')
    expect(engine.isPlaying).toBe(false)
    expect(ctx.state).toBe('suspended')
    expect(ctx.audibleAt(ctx.currentTime)).toEqual([])
    expect(engine.scheduledNotes.some(note => note.time > ctx.currentTime)).toBe(false)
    expect(ctx.sources.every(source => source.stopTime <= ctx.currentTime)).toBe(true)
    expect(engine.activeVoices).toHaveLength(0)
    expect(paused).toMatchObject({
      nextA: startTime + 0.5,
      nextB: startTime + 0.375,
      countA: 1,
      countB: 1,
    })

    await engine.start()
    expect(engine.transportState).toBe('playing')
    expect(engine.startTime).toBe(startTime)
    expect(engine.nextNoteTimeA).toBe(paused.nextA)
    expect(engine.nextNoteTimeB).toBe(paused.nextB)
    ctx.advanceTo(paused.nextB - 0.01)
    engine.schedule()
    const resumedB = engine.scheduledNotes.filter(note => note.type === 'B' && note.time === paused.nextB)
    expect(resumedB).toHaveLength(1)
    expect(resumedB[0].pos).toBe(1)
    engine.schedule()
    expect(engine.scheduledNotes.filter(note => note.type === 'B' && note.time === paused.nextB)).toHaveLength(1)
  })

  it('múltiples pausas conservan el próximo timestamp y los cambios de BPM aplican desde el pulso pendiente', async () => {
    await engine.start(params)
    const ctx = engine.ctx
    ctx.advanceTo(0.19)
    await engine.pause()
    const firstPending = engine.nextNoteTimeA

    await engine.start()
    await engine.pause()
    expect(engine.nextNoteTimeA).toBe(firstPending)
    engine.setParams({ stepA: 0.3 })
    await engine.start()
    ctx.advanceTo(firstPending)
    engine.schedule()

    const resumed = engine.scheduledNotes.find(note => note.type === 'A' && note.time === firstPending)
    expect(resumed).toMatchObject({ pos: 1, accent: params.accentsA[1] })
    expect(engine.nextNoteTimeA).toBeCloseTo(firstPending + 0.3, 10)

    await engine.pause()
    engine.stop()
    expect(engine.transportState).toBe('stopped')
    expect(engine.startTime).toBe(0)
    expect(engine.stepCountA).toBe(0)
    await engine.start()
    expect(engine.scheduledNotes[0]).toMatchObject({ pos: 0, type: 'A' })
  })

  it.each([40, 200])('reanuda desde la misma fase a %s BPM', async bpm => {
    const timing = calculateTiming({ bpm, numA: 4, denA: 4, numB: 3, denB: 4, mode: 'polirritmia' })
    await engine.start({ ...params, ...timing, accentsA: [2, 1, 0, 1] })
    const ctx = engine.ctx
    const pendingTime = engine.startTime + timing.stepA
    ctx.advanceTo(engine.startTime + timing.stepA * 0.4)
    await engine.pause()

    expect(engine.nextNoteTimeA).toBeCloseTo(pendingTime, 10)
    expect(engine.stepCountA).toBe(1)
    await engine.start()
    ctx.advanceTo(pendingTime - 0.01)
    engine.schedule()
    expect(engine.scheduledNotes.filter(note => note.type === 'A' && note.time === pendingTime))
      .toMatchObject([{ pos: 1, accent: 1 }])
    expect(engine.scheduledNotes.filter(note => note.type === 'A' && note.time === pendingTime)).toHaveLength(1)
  })

  it.each(['polirritmia', 'polimetria', 'morph', 'clave'])(
    'pausa y reanuda sin alterar el origen ni la fase A/B en modo %s',
    async mode => {
      const timing = calculateTiming({
        bpm: 174,
        numA: 4,
        denA: 4,
        numB: mode === 'clave' ? 16 : 3,
        denB: mode === 'clave' ? 8 : 4,
        mode,
        claveMeasures: mode === 'clave' ? 2 : 1,
      })
      await engine.start({
        ...params,
        ...timing,
        level: 3,
        mode,
        accentsA: [2, 1, 0, 1],
        accentsB: Array(mode === 'clave' ? 16 : 3).fill(1),
      })
      const ctx = engine.ctx
      ctx.advanceTo(engine.startTime + timing.stepA * 1.35)
      engine.schedule()
      await engine.pause()
      const paused = {
        startTime: engine.startTime,
        nextA: engine.nextNoteTimeA,
        nextB: engine.nextNoteTimeB,
        countA: engine.stepCountA,
        countB: engine.stepCountB,
      }

      await engine.start()
      expect(engine.transportState).toBe('playing')
      expect(engine.startTime).toBe(paused.startTime)
      expect(engine.params.mode).toBe(mode)
      expect(paused.nextA).toBeCloseTo(paused.startTime + paused.countA * timing.stepA, 10)
      expect(paused.nextB).toBeCloseTo(paused.startTime + paused.countB * timing.stepB, 10)
      const resumedNotes = engine.scheduledNotes.filter(note => note.time > ctx.currentTime)
      const uniqueTrackTimes = new Set(resumedNotes.map(note => `${note.type}-${note.time}`))
      expect(uniqueTrackTimes.size).toBe(resumedNotes.length)
      for (const track of ['A', 'B']) {
        const newNotes = resumedNotes.filter(note => note.type === track)
        const nextTime = track === 'A' ? engine.nextNoteTimeA : engine.nextNoteTimeB
        const nextCount = track === 'A' ? engine.stepCountA : engine.stepCountB
        const pendingTime = track === 'A' ? paused.nextA : paused.nextB
        const pendingCount = track === 'A' ? paused.countA : paused.countB
        const step = track === 'A' ? timing.stepA : timing.stepB
        expect(newNotes.every(note => note.time >= pendingTime)).toBe(true)
        expect(nextTime).toBeCloseTo(pendingTime + newNotes.length * step, 10)
        expect(nextCount).toBe(pendingCount + newNotes.length)
      }
    },
  )

  it('Stop repetido es idempotente, incluso antes del primer Start', async () => {
    engine.stop()
    engine.stop()
    await engine.start(params)
    const ctx = engine.ctx
    engine.stop()
    engine.stop()
    expect(ctx.sources[0].stopTime).toBe(0)
    expect(ctx.audibleAt(0.09)).toEqual([])
    expect(engine.isPlaying).toBe(false)
    expect(engine.timerId).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('Start repetido no duplica fuentes, reinicia fase ni agrega intervalos', async () => {
    await Promise.all([engine.start(params), engine.start(params)])
    const ctx = engine.ctx
    ctx.advanceTo(0.1)
    await engine.start()
    expect(engine.startTime).toBe(0.08)
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.audibleAt(0.1)).toHaveLength(1)
    expect(vi.getTimerCount()).toBe(1)
  })

  it('activa B en el próximo paso de su fase, sin reiniciar A ni recuperar golpes perdidos', async () => {
    await engine.start(params)
    const ctx = engine.ctx
    ctx.advanceTo(1.1)
    engine.schedule() // B avanza en silencio.
    expect(engine.scheduledNotes.some(n => n.type === 'B')).toBe(false)
    engine.setParams({ level: 3 })
    engine.schedule()
    expect(engine.scheduledNotes.some(n => n.type === 'B')).toBe(false)
    ctx.advanceTo(1.12)
    engine.schedule()
    const notes = engine.scheduledNotes.filter(n => n.type === 'B')
    expectWindow(notes, 1.12)
    expect(notes).toHaveLength(1)
    expect(notes[0].time).toBeCloseTo(1.205, 10)
    expect(notes[0].pos).toBe(3)
    expect(engine.startTime).toBe(0.08)
    expect(engine.nextNoteTimeA).toBeCloseTo(1.58, 10)
    expect(ctx.audibleAt(1.21)).toHaveLength(1) // Una muestra de snare.
  })

  it('salta diez segundos de atraso en ambas pistas conservando fase y horizonte', async () => {
    await engine.start({ ...params, level: 3 })
    const ctx = engine.ctx
    const previousSources = ctx.sources.length
    ctx.advanceTo(10)
    vi.advanceTimersByTime(25)
    expectWindow(engine.scheduledNotes, 10)
    expect(engine.scheduledNotes).toHaveLength(1)
    expect(engine.scheduledNotes[0]).toMatchObject({ type: 'A', pos: 0 })
    expect(engine.scheduledNotes[0].time).toBeCloseTo(10.08, 10)
    expect(engine.stepCountA).toBe(21)
    expect(engine.stepCountB).toBe(27)
    expect(engine.nextNoteTimeB).toBeCloseTo(10.205, 10)
    expect(ctx.sources.length - previousSources).toBe(1)
    ctx.advanceTo(10.12)
    engine.schedule()
    const b = engine.scheduledNotes.filter(n => n.type === 'B')
    expectWindow(b, 10.12)
    expect(b[0].pos).toBe(3)
    expect(b[0].time).toBeCloseTo(10.205, 10)
  })

  it('Stop cancela todos los sonidos futuros, incluyendo snare y metrónomo', async () => {
    await engine.start({ ...params, level: 3, metronome: true })
    const ctx = engine.ctx
    expect(ctx.sources).toHaveLength(3)
    expect(ctx.sources.every(s => s.startTime > ctx.currentTime)).toBe(true)
    expect(ctx.audibleAt(0.09)).toHaveLength(3)
    engine.stop()
    expect(ctx.audibleAt(0.09)).toEqual([])
    expect(ctx.sources.every(s => s.stopTime === 0 && s.connections.size === 0)).toBe(true)
    expect(ctx.nodes.filter(n => ![engine.masterGain, engine.compressor].includes(n))
      .every(n => n.connections.size === 0)).toBe(true)
    expect(engine.scheduledNotes).toEqual([])
  })

  it('resume resuelto después de Stop no reactiva el transporte', async () => {
    vi.stubGlobal('AudioContext', controlledAudioContext({ suspended: true }))
    const pending = engine.start(params)
    const ctx = engine.ctx
    engine.stop()
    ctx.resumeResolvers[0]()
    await pending
    vi.advanceTimersByTime(1000)
    expect(engine.isPlaying).toBe(false)
    expect(ctx.sources).toHaveLength(0)
    expect(engine.scheduledNotes).toEqual([])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('un Start antiguo no interfiere con Start → Stop → Start, resuelto fuera de orden', async () => {
    vi.stubGlobal('AudioContext', controlledAudioContext({ suspended: true }))
    const oldStart = engine.start(params)
    const ctx = engine.ctx
    engine.stop()
    const newStart = engine.start(params)
    ctx.resumeResolvers[1]()
    await newStart
    const startTime = engine.startTime
    ctx.resumeResolvers[0]()
    await oldStart
    expect(engine.startTime).toBe(startTime)
    expect(ctx.sources).toHaveLength(1)
    expect(engine.scheduledNotes).toHaveLength(1)
    expect(vi.getTimerCount()).toBe(1)
  })

  it('libera voces y nodos al terminar naturalmente, sin esperar Stop', async () => {
    await engine.start({ ...params, level: 3, metronome: true })
    const ctx = engine.ctx
    ctx.advanceTo(0.22) // El marcador acústico breve ya terminó.
    expect(engine.activeVoices.size).toBe(2) // kick y snare continúan.
    ctx.advanceTo(0.8)
    expect(engine.activeVoices.size).toBe(0)
    expect(ctx.sources.every(s => s.onended === null && s.connections.size === 0)).toBe(true)
    expect(ctx.audibleAt(0.8)).toEqual([])
  })

  it('dispose desconecta el grafo, cierra el contexto y permite un contexto nuevo', async () => {
    await engine.start(params)
    const ctx = engine.ctx
    await engine.dispose()
    await engine.dispose()
    expect(ctx.state).toBe('closed')
    expect(ctx.nodes.every(n => n.connections.size === 0)).toBe(true)
    expect(engine.ctx).toBeNull()
    expect(engine.masterGain).toBeNull()
    expect(engine.compressor).toBeNull()
    expect(engine.activeVoices.size).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    await engine.start(params)
    expect(engine.ctx).not.toBe(ctx)
    expect(engine.ctx.audibleAt(0.09)).toHaveLength(1)
  })

  it('no programa con contexto suspendido y recupera el reloj al reanudarse', async () => {
    await engine.start(params)
    const ctx = engine.ctx
    ctx.state = 'suspended'
    ctx.advanceTo(10)
    engine.schedule()
    expect(ctx.sources).toHaveLength(1)
    ctx.state = 'running'
    engine.schedule()
    expectWindow(engine.scheduledNotes, 10)
    expect(ctx.sources).toHaveLength(2)
  })

  it.each([0, -1, NaN, Infinity])('un step inválido (%s) no bloquea el scheduler', async step => {
    await engine.start({ ...params, level: 3, stepA: step, stepB: step })
    expect(engine.scheduledNotes).toEqual([])
    expect(engine.ctx.sources).toHaveLength(0)
  })

  it('acota el trabajo incluso ante steps externos extremadamente pequeños', async () => {
    await engine.start({ ...params, stepA: 1e-12, accentsA: [0] })
    expect(engine.scheduledNotes).toHaveLength(128)
    expectWindow(engine.scheduledNotes, 0)
    engine.ctx.advanceTo(10)
    engine.schedule()
    expect(engine.scheduledNotes).toHaveLength(128)
    expectWindow(engine.scheduledNotes, 10)
  })

  it.each(['polirritmia', 'polimetria'])('B entra en su fase con timing real de %s', async mode => {
    const timing = calculateTiming({ bpm: 120, numA: 3, denA: 4, numB: 2, denB: 8, mode })
    await engine.start({ ...params, ...timing, mode, accentsA: [2, 1, 1], accentsB: [2, 1] })
    const expectedStep = Math.ceil((1.1 - 0.08) / timing.stepB)
    const expectedTime = 0.08 + expectedStep * timing.stepB
    engine.ctx.advanceTo(expectedTime - 0.01)
    engine.setParams({ level: 3 })
    engine.schedule()
    const notes = engine.scheduledNotes.filter(n => n.type === 'B')
    expect(notes).toHaveLength(1)
    expect(notes[0].time).toBeCloseTo(expectedTime, 10)
    expect(notes[0].pos).toBe(expectedStep % 2)
    expect(engine.params.stepA).toBe(timing.stepA)
    expect(engine.params.stepB).toBe(timing.stepB)
  })

  it('mantiene la política de cambio de step sin reprogramar eventos ya anticipados', async () => {
    await engine.start(params)
    engine.ctx.advanceTo(0.1)
    engine.setParams({ stepA: 0.25 })
    engine.ctx.advanceTo(0.58)
    engine.schedule()
    const current = engine.scheduledNotes.filter(n => n.time >= 0.58)
    expect(current).toHaveLength(1)
    expect(current[0]).toMatchObject({ time: 0.58, pos: 1 })
    expect(engine.nextNoteTimeA).toBeCloseTo(0.83, 10)
    engine.schedule()
    expect(engine.scheduledNotes.filter(n => n.time >= 0.58)).toEqual(current)
  })

  it('cancela el evento futuro anticipado y lo reemplaza con los parámetros nuevos', async () => {
    await engine.start({
      ...params,
      stepA: 0.05,
      accentsA: [2, 2, 2, 2],
      metronome: false,
    })
    const ctx = engine.ctx
    ctx.advanceTo(0.04)
    engine.schedule()
    const oldFuture = ctx.sources.find(source => source.startTime === 0.13)
    expect(oldFuture).toBeDefined()

    engine.setParams({ accentsA: [0, 1, 2, 0] })
    expect(oldFuture.stopTime).toBe(0.04)
    expect(engine.scheduledNotes.some(note => note.time === 0.13)).toBe(false)

    engine.schedule()
    expect(engine.scheduledNotes.find(note => note.time === 0.13))
      .toMatchObject({ type: 'A', pos: 1, accent: 1 })
    expect(ctx.sources.filter(source => source.startTime === 0.13)).toHaveLength(2)
    expect(ctx.sources.find(source => source.startTime === 0.13 && source.stopTime > 0.04))
      .toBeDefined()
  })

  it('programa cinco ataques en dos compases y repite el ciclo completo', async () => {
    const timing = calculateTiming({
      bpm: 120, numA: 4, denA: 4, numB: 16, denB: 8, mode: 'clave', claveMeasures: 2,
    })
    await engine.start({
      ...params,
      ...timing,
      level: 3,
      mode: 'clave',
      accentsA: [0, 0, 0, 0],
      accentsB: CLAVE_PATTERNS[0].pat,
    })

    const firstCycleHits = []
    const firstNote = engine.scheduledNotes.find(note => note.type === 'B')
    if (firstNote.accent > 0) firstCycleHits.push({ pos: firstNote.pos, time: firstNote.time })
    for (let step = 1; step < 16; step++) {
      const time = engine.nextNoteTimeB
      engine.ctx.advanceTo(time)
      engine.schedule()
      const note = engine.scheduledNotes.find(n => n.type === 'B' && n.time === time)
      expect(note).toBeDefined()
      if (note.accent > 0) firstCycleHits.push({ pos: note.pos, time: note.time })
    }

    expect(firstCycleHits.map(({ pos }) => pos)).toEqual([0, 3, 6, 10, 12])
    firstCycleHits.forEach(({ time }, index) => {
      expect(time).toBeCloseTo([0.08, 0.83, 1.58, 2.58, 3.08][index], 10)
    })
    expect(engine.nextNoteTimeB).toBeCloseTo(engine.startTime + timing.measureB, 10)

    const nextCycleStart = engine.nextNoteTimeB
    engine.ctx.advanceTo(nextCycleStart)
    engine.schedule()
    expect(engine.scheduledNotes.find(n => n.type === 'B' && Math.abs(n.time - nextCycleStart) < 1e-10))
      .toMatchObject({ pos: 0, accent: 2 })
  })

  it('rechazo de resume libera el inicio pendiente y permite reintentar', async () => {
    await engine.ensureContext()
    const ctx = engine.ctx
    ctx.state = 'suspended'
    ctx.resume = vi.fn().mockRejectedValueOnce(new Error('resume rechazado'))
      .mockImplementationOnce(() => { ctx.state = 'running'; return Promise.resolve() })
    await expect(engine.start(params)).rejects.toThrow('resume rechazado')
    expect(engine.startPromise).toBeNull()
    expect(engine.isPlaying).toBe(false)
    expect(ctx.sources).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
    await engine.start(params)
    expect(ctx.audibleAt(0.09)).toHaveLength(1)
  })

  it('Start sobre un transporte suspendido reanuda sin reiniciar fase ni duplicar fuentes', async () => {
    await engine.start(params)
    const ctx = engine.ctx
    ctx.advanceTo(0.1)
    ctx.state = 'suspended'
    await engine.start()
    expect(ctx.state).toBe('running')
    expect(engine.startTime).toBe(0.08)
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.audibleAt(0.1)).toHaveLength(1)
    expect(vi.getTimerCount()).toBe(1)
  })
})
