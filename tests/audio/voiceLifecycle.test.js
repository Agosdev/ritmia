import { describe, expect, it } from 'vitest'
import { playKick, playBass, playSnare, playHat, playWoodblock } from '../../src/audio/instruments'
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
