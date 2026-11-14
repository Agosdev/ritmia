import React from 'react'
import {act,cleanup,renderHook} from '@testing-library/react'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import {RitmiaProvider,useRitmia} from '../../src/context/RitmiaContext'
import {audioEngine} from '../../src/audio/AudioEngine'
import {POPULAR_PRESETS} from '../../src/music/popularPresets'
import {resolveInstrumentHits} from '../../src/audio/instrumentCatalog'
import {BASS_PATTERNS} from '../../src/music/bassPatterns'
import {controlledAudioContext} from '../helpers/controlledAudioContext'
const wrapper=({children})=><RitmiaProvider>{children}</RitmiaProvider>
beforeEach(()=>{vi.useFakeTimers();vi.stubGlobal('AudioContext',controlledAudioContext());vi.stubGlobal('requestAnimationFrame',vi.fn(()=>1));vi.stubGlobal('cancelAnimationFrame',vi.fn())})
afterEach(async()=>{cleanup();await audioEngine.dispose();vi.useRealTimers();vi.unstubAllGlobals()})
it.each(POPULAR_PRESETS)('$name: every simultaneous voice is scheduled at its exact position with the recommended bank',async p=>{
 const {result}=renderHook(useRitmia,{wrapper})
 act(()=>{result.current.applyPreset(p.id)})
 expect(result.current.instrumentA).toBe(p.recommendedInstrument)
 expect(result.current.strokesA).toEqual(p.events.map((events,i)=>({events,referenceAccent:p.accents[i]})))
 await act(async()=>{await result.current.startPlayback()})
 const step=result.current.timing.stepA,ctx=audioEngine.ctx
 for(let t=.025;t<.08+(p.events.length-1)*step;t+=.025){ctx.advanceTo(t);audioEngine.schedule()}
 const expected=p.events.flatMap((events,i)=>resolveInstrumentHits(p.recommendedInstrument,p.accents[i],{events,referenceAccent:p.accents[i]}).map(h=>({sample:h.sample,time:.08+i*step})))
 const bank=audioEngine.instrumentBanks.get ? audioEngine.instrumentBanks.get(p.recommendedInstrument) : audioEngine.instrumentBanks[p.recommendedInstrument]
 expect(bank).toBeDefined()
 const percussionSources=ctx.sources.filter(source=>Object.values(bank).includes(source.buffer))
 expect(percussionSources).toHaveLength(expected.length)
 percussionSources.forEach((s,i)=>{expect(s.startTime).toBeCloseTo(expected[i].time,10);expect(s.buffer).toBe(bank[expected[i].sample])})
 if(p.id==='funk-clasico') {
  const bass=BASS_PATTERNS[p.id].events
  const bassBank=audioEngine.pitchedInstrumentBanks.get('electricBass')
  expect(bassBank).toBeDefined()
  const bassSources=ctx.sources.filter(source=>Object.values(bassBank).includes(source.buffer))
  expect(bassSources).toHaveLength(bass.length)
  bassSources.forEach((source,i)=>{expect(source.startTime).toBeCloseTo(.08+bass[i].position*step,10);expect(source.buffer).toBe(bassBank[bass[i].midi])})
 } else expect(audioEngine.pitchedInstrumentBanks.size).toBe(0)
})
it('manual kits persist across popular presets; A/B keep phase and the complete event data during a change',async()=>{
 const {result}=renderHook(useRitmia,{wrapper})
 act(()=>{result.current.setLevel(2);result.current.applyPreset('funk-clasico');result.current.setInstrumentChoiceB('darbuka')})
 await act(async()=>{await result.current.startPlayback()})
 const before={bpm:result.current.bpm,timing:result.current.timing,strokes:result.current.strokesA,accents:result.current.accentsA,b:result.current.accentsB,start:audioEngine.startTime}
 act(()=>result.current.setInstrumentChoiceA('cajon'))
 await act(async()=>{await audioEngine.prepareInstrument('A','cajon')})
 expect(audioEngine.startTime).toBe(before.start)
 expect(result.current.timing).toEqual(before.timing)
 expect(result.current.strokesA).toEqual(before.strokes)
 expect(result.current.accentsA).toEqual(before.accents)
 expect(result.current.accentsB).toEqual(before.b)
 act(()=>result.current.applyPreset('jazz-swing'))
 expect(result.current.instrumentA).toBe('cajon')
 expect(result.current.instrumentB).toBe('darbuka')
 act(()=>result.current.setInstrumentChoiceA('auto'))
 expect(result.current.instrumentA).toBe('drums-jazz')
})

it('Funk activa bajo solo en Automático; Blues puede habilitar su línea distinta sin alterar métrica',()=>{
 const {result}=renderHook(useRitmia,{wrapper})
 act(()=>result.current.applyPreset('funk-clasico'))
 expect(result.current.bassChoiceA).toBe('auto')
 expect(result.current.bassEnabledA).toBe(true)
 expect(result.current.bassPatternA.events.map(e=>e.position)).toEqual([0,3,7,10,14])
 const funkTiming={bpm:result.current.bpm,num:result.current.numA,den:result.current.denA,sub:result.current.subdivisionA}
 act(()=>result.current.setBassChoiceA('off'))
 act(()=>result.current.applyPreset('blues-shuffle'))
 expect(result.current.bassChoiceA).toBe('off')
 expect(result.current.bassEnabledA).toBe(false)
 expect(result.current.bassPatternA.events.map(e=>e.position)).toEqual([0,2,3,5,6,8,9,11])
 act(()=>result.current.setBassChoiceA('on'))
 expect(result.current.bassEnabledA).toBe(true)
 expect(result.current.bpm).toBe(92)
 expect(result.current.suggestedBpm).toBe(96)
 expect(result.current.numA).toBe(4)
 expect(result.current.denA).toBe(4)
 expect(result.current.subdivisionA).toBe(3)
 expect(funkTiming).toEqual({bpm:92,num:4,den:4,sub:4})
})
