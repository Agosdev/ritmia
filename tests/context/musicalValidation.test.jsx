import React from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RitmiaProvider, useRitmia } from '../../src/context/RitmiaContext'
import { audioEngine } from '../../src/audio/AudioEngine'

const wrapper = ({ children }) => <RitmiaProvider>{children}</RitmiaProvider>
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('Contexto: validación musical antes del motor', () => {
  it.each(['A', 'B'])('conserva agrupación válida de %s mientras el borrador es inválido/incompleto', track => {
    const { result } = renderHook(useRitmia, { wrapper })
    const valid = track === 'A' ? '2+2+3' : '2+3'
    act(() => result.current[`setGrouping${track}`](valid))
    const active = valid.split('+').map(Number)
    const accents = result.current[`accents${track}`]
    for (const text of ['3x+2+2', '3.5+2+2', 'abc', '', '   ', '3+', '1']) {
      act(() => result.current[`setGrouping${track}`](text))
      expect(result.current[`isValidGrouping${track}`]).toBe(false)
      expect(result.current[`grouping${track}`]).toBe(text)
      expect(result.current[`activeGrouping${track}`]).toEqual(active)
      expect(result.current[`groupingFeedback${track}`]).toContain(`se conserva ${valid}`)
      expect(result.current[`accents${track}`]).toEqual(accents)
    }
    act(() => result.current[`setNum${track}`](4))
    expect(result.current[`activeGrouping${track}`]).toBeNull()
    expect(result.current[`groupingFeedback${track}`]).toContain('sin agrupación aplicada')
    act(() => result.current[`setGrouping${track}`]('2+2'))
    expect(result.current[`isValidGrouping${track}`]).toBe(true)
    expect(result.current[`activeGrouping${track}`]).toEqual([2, 2])
  })

  it('no transforma valores inválidos del contexto en otro compás o tempo', () => {
    const { result } = renderHook(useRitmia, { wrapper })
    const original = { bpm: 92, numA: 7, denA: 8, numB: 5, denB: 8, mode: 'polirritmia' }
    for (const invalid of [NaN, Infinity, 0, -1, 3.5, '8', null, undefined]) {
      act(() => {
        result.current.setBpm(invalid)
        result.current.setNumA(invalid)
        result.current.setNumB(invalid)
        result.current.setDenA(invalid)
        result.current.setDenB(invalid)
        result.current.setMode(invalid)
      })
      expect(result.current).toMatchObject(original)
    }
    act(() => {
      result.current.setNumA(33)
      result.current.setDenA(3)
      result.current.setBpm(201)
      result.current.setNumB(() => NaN)
    })
    expect(result.current).toMatchObject(original)
  })

  it('cada envío al motor mantiene acentos, numerador y duración coherentes al redimensionar', () => {
    const updates = vi.spyOn(audioEngine, 'setParams')
    const { result } = renderHook(useRitmia, { wrapper })
    act(() => {
      result.current.setNumA(32)
      result.current.setNumB(1)
      result.current.setDenA(1)
      result.current.setDenB(16)
    })
    expect(result.current.accentsA).toHaveLength(32)
    expect(result.current.accentsB).toHaveLength(1)
    act(() => { result.current.setNumA(1); result.current.setNumB(32) })
    for (const [params] of updates.mock.calls) {
      expect(params.accentsA.length).toBeCloseTo(params.measureA / params.stepA, 10)
      expect(params.accentsB.length).toBeCloseTo(params.measureB / params.stepB, 10)
      expect(params.accentsA.every(a => [0, 1, 2].includes(a))).toBe(true)
    }
    act(() => {
      result.current.setAccentsA([NaN])
      result.current.setAccentsB([])
      result.current.setVolumeA(Infinity)
      result.current.setMorphAmount(NaN)
    })
    expect(result.current.accentsA).toEqual([2])
    expect(result.current.accentsB).toHaveLength(32)
    expect(result.current.volumeA).toBe(1)
    expect(result.current.morphAmount).toBe(0.5)
  })

  it('el cuestionario usa la agrupación aplicada, no el borrador inválido', () => {
    const { result } = renderHook(useRitmia, { wrapper })
    act(() => { result.current.setLevel(2); result.current.setGroupingA('abc') })
    act(() => result.current.openTest())
    expect(result.current.testData.q).toContain('3+2+2')
    expect(result.current.testData.a).toBe('3')
    act(() => result.current.setNumA(4))
    act(() => result.current.openTest())
    expect(result.current.testData.q).toContain('ninguna aplicada')
    expect(result.current.testData.a).toBe('0')
    expect(new Set(result.current.testData.options).size).toBe(3)
  })

  it('descripción y cuestionario usan el ratio de pasos correcto en 3/4 vs 2/8', () => {
    const { result } = renderHook(useRitmia, { wrapper })
    act(() => {
      result.current.setLevel(3)
      result.current.setNumA(3); result.current.setDenA(4)
      result.current.setNumB(2); result.current.setDenB(8)
    })
    act(() => result.current.openTest())
    expect(result.current.audioDescription).toContain('frecuencia de pasos A:B 3:2')
    expect(result.current.testData.a).toContain('frecuencia de pasos A:B 3:2')
    act(() => result.current.setMode('polimetria'))
    expect(result.current.audioDescription).toContain('frecuencia de pasos A:B 1:2')
    expect(result.current.audioDescription).toContain('Reencuentro cada 1×A / 3×B')
  })
})
