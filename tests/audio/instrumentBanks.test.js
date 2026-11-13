import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AudioEngine } from '../../src/audio/AudioEngine'
import { loadInstrumentBank } from '../../src/audio/instrumentBank'
import { INSTRUMENTS, recommendedInstrument, resolveInstrumentHits } from '../../src/audio/instrumentCatalog'
import { MUSICAL_PRESETS } from '../../src/music/presets'
import { controlledAudioContext } from '../helpers/controlledAudioContext'

let engine
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('AudioContext', controlledAudioContext())
  engine = new AudioEngine()
})
afterEach(async () => { await engine.dispose(); vi.useRealTimers(); vi.unstubAllGlobals() })
const response = () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })

it.each(MUSICAL_PRESETS)('$name recomienda un instrumento existente, independiente del patrón', preset => {
  expect(INSTRUMENTS[preset.recommendedInstrument]).toBeDefined()
  expect(recommendedInstrument(preset)).toBe(preset.recommendedInstrument)
  const before = structuredClone(preset)
  for (const id of Object.keys(INSTRUMENTS)) preset.accents.forEach((accent, i) => resolveInstrumentHits(id, accent, preset.strokes?.[i]))
  expect(preset).toEqual(before)
})

it.each([['arabe','darbuka'], ['flamenco','cajon-palmas'], ['rock','drums'], ['blues','drums-soft'], ['tango','acoustic'], ['libre','acoustic']])('%s tiene recomendación segura %s', (family, id) => {
  expect(recommendedInstrument({ family })).toBe(id)
})

it('distingue DUM, TAK y PA; KA comparte TAK suave sin inventar un golpe PA', () => {
  const dum = resolveInstrumentHits('darbuka', 2, 'D')[0]
  const tak = resolveInstrumentHits('darbuka', 1, 'T')[0]
  const ka = resolveInstrumentHits('darbuka', 1, 'K')[0]
  expect(dum.sample).toBe('dum')
  expect(tak.sample).toBe('tak')
  expect(ka.sample).toBe('tak')
  expect(ka.gain).toBeLessThan(tak.gain)
  expect(resolveInstrumentHits('darbuka', 2, 'P')[0].sample).toBe('pa')
})

it.each(Object.keys(INSTRUMENTS))('%s respeta silencios y siempre resuelve articulaciones desconocidas', id => {
  if (id === 'hihat') expect(resolveInstrumentHits(id, 1)[0].gain).toBeLessThan(resolveInstrumentHits(id, 2)[0].gain)
  for (const track of ['A', 'B']) for (const stroke of ['D','T','K','P','C','-',null,'unknown']) {
    expect(resolveInstrumentHits(id, 0, stroke, track)).toEqual([])
    for (const accent of [1,2]) {
      const hits = resolveInstrumentHits(id, accent, stroke, track)
      expect(hits.length).toBeGreaterThan(0)
      for (const h of hits) {
        expect(INSTRUMENTS[id].files[h.sample]).toBeDefined()
        expect(h.gain).toBeGreaterThan(0)
        expect(h.gain).toBeLessThanOrEqual(1)
      }
    }
  }
})

it('comparte solicitudes y decodificaciones entre bancos, pistas y combinaciones', async () => {
  const ctx = new AudioContext()
  const decode = vi.spyOn(ctx, 'decodeAudioData')
  await Promise.all([loadInstrumentBank(ctx,'cajon'), loadInstrumentBank(ctx,'cajon-palmas'), loadInstrumentBank(ctx,'palmas')])
  expect(fetch).toHaveBeenCalledTimes(3)
  expect(decode).toHaveBeenCalledTimes(3)
  await loadInstrumentBank(ctx, 'cajon-palmas')
  expect(fetch).toHaveBeenCalledTimes(3)
})

it('solo reintenta archivos fallidos, conserva los compartidos ya decodificados', async () => {
  const ctx = new AudioContext()
  vi.stubGlobal('fetch', vi.fn(async url => url.endsWith('cajon-edge.wav') ? { ok: false, status: 503 } : response()))
  await expect(loadInstrumentBank(ctx, 'cajon')).rejects.toThrow('503')
  const fetchGood = vi.fn(async () => response())
  vi.stubGlobal('fetch', fetchGood)
  await loadInstrumentBank(ctx, 'cajon')
  expect(fetchGood).toHaveBeenCalledTimes(1)
})

it('programa D/T/K con darbuka y B con cajón en los mismos timestamps, incluyendo silencios', async () => {
  await engine.start({ level:2, instrumentA:'darbuka', instrumentB:'cajon', stepA:.25, stepB:.25,
    accentsA:[2,1,0,1], strokesA:['D','T','D','K'], accentsB:[2,1,0,1] })
  const ctx = engine.ctx
  for (let t=.025; t<.86; t+=.025) { ctx.advanceTo(t); engine.schedule() }
  const bank = engine.instrumentBanks.get('darbuka')
  const sourcesA = ctx.sources.filter(s => Object.values(bank).includes(s.buffer))
  expect(sourcesA.map(s => s.buffer)).toEqual([bank.dum,bank.tak,bank.tak])
  sourcesA.forEach((s,i) => expect(s.startTime).toBeCloseTo([.08,.33,.83][i],12))
  expect(ctx.sources.filter(s => s.startTime === .58)).toHaveLength(0)
  expect(engine.scheduledNotes.filter(n => n.type==='A' && n.accent)).toHaveLength(3)
  expect(engine.scheduledNotes.filter(n => n.type==='B' && n.accent)).toHaveLength(3)
})

it('cambiar durante playback conserva fase, cancela A pendiente, desvanece su cola y conserva B', async () => {
  await engine.start({level:2,stepA:.04,stepB:.04,accentsA:[2,1],accentsB:[2,1]})
  const ctx=engine.ctx
  ctx.advanceTo(.09); engine.schedule()
  const oldA=ctx.sources.find(s=>s.startTime===.08 && s.buffer===engine.sampleBankBuffers.kickStrong)
  const oldB=ctx.sources.find(s=>s.startTime===.08 && s.buffer===engine.sampleBankBuffers.snareStrong)
  const bPending=ctx.sources.find(s=>s.startTime===.12 && s.buffer===engine.sampleBankBuffers.snareSoft)
  const start=engine.startTime
  engine.setParams({instrumentA:'cajon'})
  await engine.prepareInstrument('A','cajon')
  expect(engine.startTime).toBe(start)
  expect(engine.nextNoteTimeA).toBeCloseTo(.12,12)
  expect(oldA.stopTime).toBeCloseTo(.105,12)
  expect(oldB.stopTime).toBeGreaterThan(.105)
  expect(bPending.stopTime).toBeGreaterThan(.12)
  engine.schedule()
  const liveAtNext=ctx.sources.filter(s=>Math.abs(s.startTime-.12)<1e-10 && s.stopTime>.12)
  expect(liveAtNext).toHaveLength(2)
  expect(liveAtNext).toContain(bPending)
  expect(vi.getTimerCount()).toBe(1)
})

it('un banco que falla usa el kit actual, avisa y permite recuperar sin reiniciar el transporte', async () => {
  vi.stubGlobal('fetch', vi.fn(async url => url.includes('darbuka-') ? {ok:false,status:503} : response()))
  await engine.start({instrumentA:'darbuka',accentsA:[2]})
  expect(engine.isPlaying).toBe(true)
  expect(engine.activeInstruments.A).toBe('acoustic')
  expect(engine.instrumentStatus.A.error).toContain('kit acústico actual')
  expect(engine.ctx.sources[0].buffer).toBe(engine.sampleBankBuffers.kickStrong)
  const start=engine.startTime
  vi.stubGlobal('fetch', vi.fn(async()=>response()))
  await engine.retryInstrument('A')
  expect(engine.activeInstruments.A).toBe('darbuka')
  expect(engine.instrumentStatus.A.error).toBeNull()
  expect(engine.startTime).toBe(start)
})

it('una carga tardía no sobrescribe una elección posterior ni revive un contexto descartado', async () => {
  await engine.start()
  let finish
  const delayed=new Promise(resolve=>{finish=resolve})
  vi.stubGlobal('fetch', vi.fn(url=>url.includes('darbuka-') ? delayed : Promise.resolve(response())))
  engine.setParams({instrumentA:'darbuka'})
  const late=engine.prepareInstrument('A','darbuka')
  engine.setParams({instrumentA:'cajon'})
  await engine.prepareInstrument('A','cajon')
  finish(response()); await late
  expect(engine.activeInstruments.A).toBe('cajon')
  engine.setParams({instrumentB:'darbuka',level:2})
  const loading=engine.prepareInstrument('B','darbuka')
  await engine.dispose(); await loading
  expect(engine.ctx).toBeNull()
  expect(engine.instrumentBanks.size).toBe(0)
  expect(engine.instrumentStatus).toEqual({})
})

it('no carga el instrumento de B mientras el nivel 1 lo mantiene inactivo', async () => {
  await engine.start({instrumentB:'cajon',level:1})
  expect(fetch).toHaveBeenCalledTimes(4)
  engine.setParams({level:2})
  await engine.prepareInstrument('B','cajon')
  expect(fetch).toHaveBeenCalledTimes(6)
})

it('limita colas en B muy densa sin cancelar ataques ni extender una cola ya cortada', async () => {
  await engine.start({level:2,instrumentB:'cymbals',accentsA:[0],accentsB:[2],stepB:.00234375})
  const ctx=engine.ctx
  for(let time=.025;time<1;time+=.025){ctx.advanceTo(time);engine.schedule()}
  const sources=ctx.sources.filter(s=>s.buffer===engine.instrumentBanks.get('cymbals').crash)
  expect(sources.length).toBeGreaterThan(300)
  // Every scheduled onset remains audible for at least its attack, even when tails overlap.
  expect(sources.every(s=>s.stopTime>s.startTime)).toBe(true)
  const audible=sources.filter(s=>s.startTime<=ctx.currentTime && s.stopTime>ctx.currentTime)
  expect(audible.length).toBeLessThanOrEqual(35) // 32 voices plus at most 3 short fades.
  const voice=[...engine.activeVoices].find(v=>v.track==='B')
  voice.stop(.005,ctx.currentTime+.01)
  const end=voice.endTime
  voice.stop(.005,ctx.currentTime+.02)
  expect(voice.endTime).toBeLessThanOrEqual(end)
})

it('volver a Nivel 1 desvanece colas largas de B sin cambiar el reloj de A',async()=>{
  await engine.start({level:2,instrumentB:'cymbals'})
  const ctx=engine.ctx
  ctx.advanceTo(.1)
  const b=ctx.sources.find(s=>s.buffer===engine.instrumentBanks.get('cymbals').crash)
  const next=engine.nextNoteTimeA,start=engine.startTime
  engine.setParams({level:1})
  expect(b.stopTime).toBeCloseTo(.115,12)
  expect(engine.startTime).toBe(start)
  expect(engine.nextNoteTimeA).toBe(next)
})
