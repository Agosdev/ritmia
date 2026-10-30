import { describe, expect, it } from 'vitest'
import { playKick, playBass, playSnare, playHat, playWoodblock, playSample } from '../../src/audio/instruments'
import { controlledAudioContext } from '../helpers/controlledAudioContext'

describe.each([playKick, playBass, playSnare, playHat, playWoodblock])('%s lifecycle', play => {
  it('cancela un sonido futuro y libera todas sus conexiones de forma idempotente', () => {
    const Context = controlledAudioContext()
    const ctx = new Context()
    const voice = play(ctx, ctx.destination, 1)
    expect(ctx.audibleAt(1.01).length).toBeGreaterThan(0)
    voice.stop()
    voice.stop()
    expect(ctx.audibleAt(1.01)).toEqual([])
    expect(ctx.sources.every(s => s.stopTime === 0 && s.onended === null)).toBe(true)
    expect(ctx.nodes.every(n => n.connections.size === 0)).toBe(true)
  })

  it('libera sus nodos al finalizar naturalmente y tolera Stop posterior', () => {
    const Context = controlledAudioContext()
    const ctx = new Context()
    const voice = play(ctx, ctx.destination, 0)
    expect(ctx.audibleAt(0.01).length).toBeGreaterThan(0)
    ctx.advanceTo(1)
    voice.stop()
    expect(ctx.audibleAt(1)).toEqual([])
    expect(ctx.nodes.every(n => n.connections.size === 0)).toBe(true)
    expect(ctx.sources.every(s => s.onended === null)).toBe(true)
  })
})

describe('playSample lifecycle', () => {
  it('cancela una muestra futura y libera el source y su ganancia', () => {
    const Context = controlledAudioContext()
    const ctx = new Context()
    const buffer = ctx.createBuffer(1, 22050, 22050)
    const voice = playSample(ctx, ctx.destination, 1, buffer, 0.8, 0.5)

    expect(ctx.audibleAt(1.01)).toHaveLength(1)
    expect(ctx.sources[0].buffer).toBe(buffer)
    expect(ctx.nodes[1].gain.setValueAtTime).toHaveBeenCalledWith(0.4, 1)
    voice.stop()
    expect(ctx.audibleAt(1.01)).toEqual([])
    expect(ctx.nodes.every(node => node.connections.size === 0)).toBe(true)
  })

  it('libera las conexiones al terminar el buffer', () => {
    const Context = controlledAudioContext()
    const ctx = new Context()
    const buffer = ctx.createBuffer(1, 22050, 22050)
    const voice = playSample(ctx, ctx.destination, 0, buffer)

    ctx.advanceTo(1)
    voice.stop()
    expect(ctx.audibleAt(1)).toEqual([])
    expect(ctx.nodes.every(node => node.connections.size === 0)).toBe(true)
  })
})
