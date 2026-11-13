import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AudioEngine } from '../../src/audio/AudioEngine'
import { resolvePitchedNote } from '../../src/audio/pitchedInstruments'
import { BASS_PATTERNS } from '../../src/music/bassPatterns'
import { controlledAudioContext } from '../helpers/controlledAudioContext'

let engine
const response = () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })
beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('AudioContext', controlledAudioContext()); engine = new AudioEngine() })
afterEach(async () => { await engine.dispose(); vi.useRealTimers(); vi.unstubAllGlobals() })

it('no descarga el bajo al iniciar sin línea y carga dos notas exactas una sola vez cuando se activa', async () => {
  await engine.start({ instrumentA: 'drums' })
  expect(fetch.mock.calls.some(([url]) => String(url).includes('/bass-'))).toBe(false)
  const before = fetch.mock.calls.length
  const context = engine.ctx
  const decode = vi.spyOn(context, 'decodeAudioData')
  engine.setParams({ bassEventsA: BASS_PATTERNS['funk-clasico'].events })
  await engine.preparePitchedInstrument('A')
  await engine.preparePitchedInstrument('A')
  expect(fetch.mock.calls.slice(before).map(([url]) => String(url)).filter(url => url.includes('/bass-'))).toHaveLength(2)
  expect(decode).toHaveBeenCalledTimes(2)
})

it('Funk agenda una línea sincopada en el mismo timestamp que la batería sin duplicar el bombo', async () => {
  const bassEventsA = BASS_PATTERNS['funk-clasico'].events
  const accentsA = Array(16).fill(0)
  accentsA[0] = 2
  accentsA[7] = 1
  await engine.start({ instrumentA: 'acoustic', stepA: .1, accentsA, bassEventsA })
  const context = engine.ctx
  const bank = engine.pitchedInstrumentBanks.get('electricBass')
  const root = context.sources.find(source => source.buffer === bank[31])
  const kick = context.sources.find(source => source.buffer === engine.sampleBankBuffers.kickStrong)
  expect(root.startTime).toBe(.08)
  expect(kick.startTime).toBe(root.startTime)
  for (let time = .1; time < .42; time += .025) { context.advanceTo(time); engine.schedule() }
  const bass = context.sources.filter(source => Object.values(bank).includes(source.buffer))
  expect(bass.map(source => source.startTime)).toEqual(expect.arrayContaining([.08, .38]))
  expect(bass.map(source => source.buffer)).toContain(bank[38])
  expect(bass.every(source => source.playbackRate.value === 1)).toBe(true)
  expect(engine.params.stepA).toBe(.1)
  expect(engine.params.accentsA).toBe(accentsA)
})

it('shuffle, slow blues y funk usan ataques distintos sobre sus rejillas originales', () => {
  expect(BASS_PATTERNS['funk-clasico'].events.map(event => event.position)).toEqual([0,3,7,10,14])
  expect(BASS_PATTERNS['blues-shuffle'].events.map(event => event.position)).toEqual([0,2,3,5,6,8,9,11])
  expect(BASS_PATTERNS['slow-blues'].events.map(event => event.position)).toEqual([0,3,6,9])
  expect(resolvePitchedNote('electricBass', 31)).toMatchObject({ file: 'instruments/bass-g1.wav', rootMidi: 31 })
  expect(resolvePitchedNote('electricBass', 38)).toMatchObject({ file: 'instruments/bass-d2.wav', rootMidi: 38 })
  expect(resolvePitchedNote('electricBass', 40)).toBeNull()
})

it('desactivar el bajo desvanece sus notas ya programadas y conserva la fase del transporte', async () => {
  await engine.start({ stepA: .1, bassEventsA: BASS_PATTERNS['funk-clasico'].events })
  const context = engine.ctx
  const bass = context.sources.find(source => source.buffer === engine.pitchedInstrumentBanks.get('electricBass')[31])
  context.advanceTo(.09)
  const phase = engine.startTime
  engine.setParams({ bassEventsA: null })
  expect(bass.stopTime).toBeCloseTo(.105, 10)
  expect(engine.startTime).toBe(phase)
  expect(engine.isPlaying).toBe(true)
})

it('el fallo al descargar bajo avisa y mantiene reproducible la batería', async () => {
  vi.stubGlobal('fetch', vi.fn(async url => String(url).includes('/bass-') ? { ok: false, status: 503 } : response()))
  await engine.start({ bassEventsA: BASS_PATTERNS['funk-clasico'].events })
  expect(engine.isPlaying).toBe(true)
  expect(engine.instrumentStatus.A.bassError).toContain('batería continúa')
  expect(engine.pitchedInstrumentBanks.size).toBe(0)
  expect(engine.ctx.sources.some(source => source.buffer === engine.sampleBankBuffers.kickStrong)).toBe(true)
})

it('permite líneas A/B separadas que siguen cada reloj de pista', async () => {
  const lineA = [{ position: 0, midi: 31, velocity: .9 }]
  const lineB = [{ position: 0, midi: 38, velocity: .6 }]
  await engine.start({ level: 2, stepA: .1, stepB: .2, accentsA: [0], accentsB: [0], bassEventsA: lineA, bassEventsB: lineB })
  const bank = engine.pitchedInstrumentBanks.get('electricBass')
  const sources = engine.ctx.sources.filter(source => Object.values(bank).includes(source.buffer))
  expect(sources.map(source => [source.buffer, source.startTime])).toEqual([[bank[31], .08], [bank[38], .08]])
  expect(engine.scheduledNotes.filter(note => note.time === .08)).toHaveLength(2)
})
