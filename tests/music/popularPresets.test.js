import { expect, it } from 'vitest'
import { POPULAR_PRESETS } from '../../src/music/popularPresets'
import { MUSICAL_PRESETS } from '../../src/music/presets'
import { calculateTiming } from '../../src/music/timingCalculator'
import { INSTRUMENTS, recommendedInstrument, resolveInstrumentHits } from '../../src/audio/instrumentCatalog'
const positions = (id, role) => POPULAR_PRESETS.find(p => p.id === id).events.flatMap((cell, i) => cell.some(e => e.articulation === role) ? [i] : [])
it('adds nine distinct grooves while retaining the previous 24 IDs', () => {
  expect(POPULAR_PRESETS).toHaveLength(9)
  expect(MUSICAL_PRESETS).toHaveLength(33)
  expect(new Set(MUSICAL_PRESETS.map(p => p.id)).size).toBe(33)
  expect(MUSICAL_PRESETS.filter(p => p.family === 'arabe')).toHaveLength(10)
  expect(MUSICAL_PRESETS.filter(p => p.family === 'flamenco')).toHaveLength(13)
})
it.each(POPULAR_PRESETS)('$name: meter, timeline, parallel voices and every manual kit preserve events', preset => {
  const signature = JSON.stringify(preset)
  const expected = preset.id === 'slow-blues' ? [12,8,1] : preset.id === 'jazz-waltz' ? [3,4,3] : ['blues-shuffle','jazz-swing'].includes(preset.id) ? [4,4,3] : [4,4,preset.id === 'funk-clasico' ? 4 : 2]
  expect([preset.num,preset.den,preset.subdivision]).toEqual(expected)
  expect(preset.events).toHaveLength(preset.num * preset.subdivision)
  for (const mode of ['polirritmia','polimetria','morph','clave']) {
    const timing = calculateTiming({ bpm: preset.bpm, numA: preset.num, denA: preset.den, subdivisionA: preset.subdivision, mode })
    expect(timing.measureA).toBeCloseTo(60 / preset.bpm * preset.num * 4 / preset.den)
    expect(timing.stepA * preset.events.length).toBeCloseTo(timing.measureA)
    expect(timing.reunionSec / timing.measureA).toBeCloseTo(timing.reunionA)
  }
  expect(INSTRUMENTS[recommendedInstrument(preset)]).toBeDefined()
  preset.events.forEach((events,i) => {
    for (const id of Object.keys(INSTRUMENTS)) {
      const hits = resolveInstrumentHits(id,preset.accents[i],{events,referenceAccent:preset.accents[i]})
      expect(hits.length).toBeGreaterThanOrEqual(events.length)
      for (const hit of hits) { expect(INSTRUMENTS[id].files[hit.sample]).toBeDefined(); expect(hit.gain).toBeGreaterThan(0) }
      expect(resolveInstrumentHits(id,0,{events})).toEqual([])
    }
  })
  expect(JSON.stringify(preset)).toBe(signature)
})
it('separates conventional backbeat, four-on-floor, rock kicks and half-time',()=>{
  expect(positions('pop-clasico','kick')).toEqual([0,4])
  expect(positions('dance-pop','kick')).toEqual([0,2,4,6])
  expect(positions('rock-clasico','kick')).toEqual([0,1,4,5])
  expect(positions('half-time-rock','snare')).toEqual([4])
  expect(positions('rock-clasico','snare')).toEqual([2,6])
})
it('shuffle leaves the middle triplet silent; swing has its characteristic ride and pedal',()=>{
  expect(positions('blues-shuffle','closedHat')).toEqual([0,2,3,5,6,8,9,11])
  expect(positions('jazz-swing','ride')).toEqual([0,3,5,6,9,11])
  expect(positions('jazz-swing','pedalHat')).toEqual([3,9])
  expect(positions('jazz-waltz','ride')).toEqual([0,3,5,6])
  expect(positions('slow-blues','closedHat')).toHaveLength(12)
})
it('funk has simultaneous syncopated kick, ghost and hat, with independent dynamics',()=>{
  expect(positions('funk-clasico','kick')).toEqual([0,7,8])
  const preset=POPULAR_PRESETS.at(-1), events=preset.events[7]
  const hits=resolveInstrumentHits('drums',2,{events,referenceAccent:2})
  expect(hits).toEqual([{sample:'kickStrong',gain:.9},{sample:'snareSoft',gain:.2},{sample:'hatSoft',gain:.28}])
  expect(resolveInstrumentHits('drums',1,{events,referenceAccent:2}).map(h=>h.gain)).toEqual(hits.map(h=>h.gain*.55))
})
it('jazz uses actual ride and pedal samples without replacing them by crash',()=>{
  const p=POPULAR_PRESETS.find(p=>p.id==='jazz-swing')
  expect(resolveInstrumentHits('drums-jazz',1,{events:p.events[3],referenceAccent:1})).toEqual([{sample:'ride',gain:.45},{sample:'pedalHat',gain:.55}])
})
