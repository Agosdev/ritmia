import { describe, expect, it } from 'vitest'
import { playSample } from '../../src/audio/instruments'
import { controlledAudioContext } from '../helpers/controlledAudioContext'

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
