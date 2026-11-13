import React from 'react'
import { act, cleanup, renderHook, render, screen, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { RitmiaProvider, useRitmia } from '../../src/context/RitmiaContext'
import { audioEngine } from '../../src/audio/AudioEngine'
import { controlledAudioContext } from '../helpers/controlledAudioContext'
import { App } from '../../src/App'
const wrapper=({children})=><RitmiaProvider>{children}</RitmiaProvider>
beforeEach(()=>{
  vi.useFakeTimers()
  vi.stubGlobal('AudioContext',controlledAudioContext())
  vi.stubGlobal('requestAnimationFrame',vi.fn(()=>1))
  vi.stubGlobal('cancelAnimationFrame',vi.fn())
})
afterEach(async()=>{cleanup();await audioEngine.dispose();vi.useRealTimers();vi.unstubAllGlobals()})
const musical=c=>({bpm:c.bpm,numA:c.numA,denA:c.denA,subdivisionA:c.subdivisionA,accentsA:[...c.accentsA],strokesA:c.strokesA,groupingA:c.groupingA,
  numB:c.numB,denB:c.denB,accentsB:[...c.accentsB],mode:c.mode,timing:c.timing})

it('automático sigue al preset; manual persiste, permite volver y no toca la música ni B',()=>{
  const {result}=renderHook(useRitmia,{wrapper})
  expect(result.current.instrumentA).toBe('acoustic')
  act(()=>result.current.applyPreset('maqsum'))
  expect(result.current.instrumentA).toBe('darbuka')
  act(()=>result.current.applyPreset('tangos'))
  expect(result.current.instrumentA).toBe('palmas')
  act(()=>result.current.setInstrumentChoiceA('cajon'))
  act(()=>result.current.applyPreset('ayoub'))
  expect(result.current.instrumentChoiceA).toBe('cajon')
  expect(result.current.instrumentA).toBe('cajon')
  const before=musical(result.current)
  for(const id of ['acoustic','castanets','drums','zills','darbuka','auto']){
    act(()=>result.current.setInstrumentChoiceA(id))
    expect(musical(result.current)).toEqual(before)
  }
  expect(result.current.instrumentA).toBe('darbuka')
  expect(result.current.instrumentChoiceB).toBe('auto')
  expect(result.current.instrumentB).toBe('acoustic')
  act(()=>result.current.setInstrumentChoiceA('not-an-instrument'))
  expect(result.current.instrumentChoiceA).toBe('auto')
})

it.each(['polirritmia','polimetria','morph','clave'])('instrumentos independientes conservan ajustes y transporte en %s',async mode=>{
  const {result}=renderHook(useRitmia,{wrapper})
  act(()=>{result.current.setLevel(2);result.current.setMode(mode);result.current.applyPreset('maqsum');result.current.setInstrumentChoiceB('cajon')})
  const before=musical(result.current)
  await act(async()=>{await result.current.startPlayback()})
  expect(audioEngine.activeInstruments).toEqual({A:'darbuka',B:'cajon'})
  const start=audioEngine.startTime
  act(()=>result.current.setInstrumentChoiceA('castanets'))
  await act(async()=>{await audioEngine.prepareInstrument('A','castanets')})
  expect(audioEngine.activeInstruments).toEqual({A:'castanets',B:'cajon'})
  expect(audioEngine.startTime).toBe(start)
  expect(musical(result.current)).toEqual(before)
  act(()=>result.current.setInstrumentChoiceB('auto'))
  await act(async()=>{await audioEngine.prepareInstrument('B','acoustic')})
  expect(result.current.instrumentB).toBe('acoustic')
  expect(musical(result.current)).toEqual(before)
})

it('Compás libre conserva articulaciones, métrica y selección manual al quitar el preset',()=>{
  const {result}=renderHook(useRitmia,{wrapper})
  act(()=>{result.current.applyPreset('ayoub');result.current.setInstrumentChoiceA('darbuka')})
  const before=musical(result.current)
  act(()=>result.current.clearPreset())
  expect(result.current.instrumentA).toBe('darbuka')
  expect(musical(result.current)).toEqual(before)
  act(()=>result.current.setInstrumentChoiceA('auto'))
  expect(result.current.instrumentA).toBe('acoustic')
  expect(musical(result.current)).toEqual(before)
})

it('selector compacto accesible y edición de instrumentos disponible con A bloqueado',()=>{
  render(<App />)
  const select=screen.getByRole('combobox',{name:'Instrumento pista A',exact:true})
  expect(select).toHaveValue('auto')
  expect(screen.getByRole('option',{name:/Automático \(recomendado\)/})).toBeInTheDocument()
  fireEvent.change(select,{target:{value:'darbuka'}})
  expect(select).toHaveValue('darbuka')
  fireEvent.click(screen.getByRole('combobox',{name:'Preset',exact:true}))
  fireEvent.click(screen.getByRole('option',{name:'Árabe Maqsum',exact:true}))
  expect(select).toBeEnabled()
  expect(select).toHaveValue('darbuka')
  fireEvent.click(screen.getByRole('button',{name:'Nivel 2 — Dos ritmos',exact:true}))
  expect(screen.getByRole('combobox',{name:'Instrumento pista B',exact:true})).toHaveValue('auto')
})
