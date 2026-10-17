import { describe, it, expect, beforeEach } from 'vitest'
import {
  playKick,
  playBass,
  playSnare,
  playHat,
  playWoodblock,
  getNoiseBuffer,
} from '../../src/audio/instruments'

describe('instruments — Síntesis de Sonido Web Audio', () => {
  let ctx
  let destination

  beforeEach(() => {
    ctx = new window.AudioContext()
    destination = ctx.createGain()
  })

  it('getNoiseBuffer genera un buffer de ruido blanco de 0.5s', () => {
    const buffer = getNoiseBuffer(ctx)
    expect(buffer).toBeDefined()
    expect(buffer.sampleRate).toBe(ctx.sampleRate)
    expect(buffer.length).toBe(Math.floor(ctx.sampleRate * 0.5))
  })

  it('playKick programa oscilador y envolvente de ganancia sin errores', () => {
    expect(() => {
      playKick(ctx, destination, 0.1, 1, 1)
    }).not.toThrow()
  })

  it('playBass programa oscilador triangular y filtro sin errores', () => {
    expect(() => {
      playBass(ctx, destination, 0.1, 1, 1)
    }).not.toThrow()
  })

  it('playSnare programa buffer de ruido y oscilador sin errores', () => {
    expect(() => {
      playSnare(ctx, destination, 0.1, 1, 1)
    }).not.toThrow()
  })

  it('playHat programa ruido filtrado en paso altos sin errores', () => {
    expect(() => {
      playHat(ctx, destination, 0.1, 1, 1)
    }).not.toThrow()
  })

  it('playWoodblock programa sonido percusivo a 850Hz sin errores', () => {
    expect(() => {
      playWoodblock(ctx, destination, 0.1, 0.8)
    }).not.toThrow()
  })
})
