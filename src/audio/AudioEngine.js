import { createMasterBus } from './masterBus'
import { playKick, playBass, playSnare, playHat, playWoodblock } from './instruments'

export class AudioEngine {
  constructor() {
    this.ctx = null
    this.masterGain = null
    this.compressor = null
    this.timerId = null

    this.isPlaying = false
    this.startTime = 0
    this.nextNoteTimeA = 0
    this.nextNoteTimeB = 0
    this.stepCountA = 0
    this.stepCountB = 0

    // Cola de eventos programados para sincronización visual
    this.scheduledNotes = []

    this.params = {
      level: 1,
      mode: 'polirritmia',
      stepA: 0.5,
      stepB: 0.5,
      measureA: 2,
      measureB: 2,
      accentsA: [2, 0, 1, 0, 1, 0, 0],
      accentsB: [2, 0, 1, 0, 1],
      volumeA: 1,
      volumeB: 1,
      morph: 0.5,
      metronome: true,
    }
  }

  async ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) throw new Error('Web Audio API no está disponible en este entorno')
      this.ctx = new AudioCtx()
      const { masterGain, compressor } = createMasterBus(this.ctx)
      this.masterGain = masterGain
      this.compressor = compressor
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
  }

  setParams(newParams) {
    this.params = { ...this.params, ...newParams }
  }

  async start(initialParams = {}) {
    this.setParams(initialParams)
    await this.ensureContext()

    if (this.isPlaying) return

    // Offset de 80ms para preparar los primeros buffers
    const now = this.ctx.currentTime
    this.startTime = now + 0.08
    this.nextNoteTimeA = this.startTime
    this.nextNoteTimeB = this.startTime
    this.stepCountA = 0
    this.stepCountB = 0
    this.scheduledNotes = []
    this.isPlaying = true

    // Ejecutar inmediatamente el primer ciclo y luego cada 25ms
    this.schedule()
    this.timerId = window.setInterval(() => this.schedule(), 25)
  }

  schedule() {
    if (!this.isPlaying || !this.ctx) return

    const now = this.ctx.currentTime
    const lookahead = 0.1 // 100ms
    const {
      level,
      mode,
      stepA,
      stepB,
      accentsA,
      accentsB,
      volumeA,
      volumeB,
      morph,
      metronome,
    } = this.params

    const dest = this.masterGain

    // --- Pista A ---
    while (this.nextNoteTimeA < now + lookahead) {
      const lenA = accentsA.length || 1
      const posA = this.stepCountA % lenA
      const accentA = accentsA[posA] ?? 0
      let volA = volumeA

      if (mode === 'morph') {
        volA = volumeA * (1 - morph)
      }

      if (accentA !== 0) {
        const velA = accentA === 2 ? 1 : 0.6
        if (accentA === 2) {
          playKick(this.ctx, dest, this.nextNoteTimeA, velA, volA)
        } else {
          playBass(this.ctx, dest, this.nextNoteTimeA, velA, volA)
        }
      }

      // Metrónomo en pulso 1 de A
      if (metronome && posA === 0) {
        playWoodblock(this.ctx, dest, this.nextNoteTimeA, 0.8)
      }

      this.scheduledNotes.push({
        time: this.nextNoteTimeA,
        pos: posA,
        type: 'A',
        accent: accentA,
      })

      this.nextNoteTimeA += stepA
      this.stepCountA++
    }

    // --- Pista B (solo si estamos en Nivel 3) ---
    if (level === 3) {
      while (this.nextNoteTimeB < now + lookahead) {
        const lenB = accentsB.length || 1
        const posB = this.stepCountB % lenB
        const accentB = accentsB[posB] ?? 0
        let volB = volumeB

        if (mode === 'morph') {
          volB = volumeB * morph
        }

        if (accentB !== 0) {
          const velB = accentB === 2 ? 1 : 0.58
          if (accentB === 2) {
            playSnare(this.ctx, dest, this.nextNoteTimeB, velB, volB)
          } else {
            playHat(this.ctx, dest, this.nextNoteTimeB, velB, volB)
          }
        }

        this.scheduledNotes.push({
          time: this.nextNoteTimeB,
          pos: posB,
          type: 'B',
          accent: accentB,
        })

        this.nextNoteTimeB += stepB
        this.stepCountB++
      }
    }

    // Mantener cola limpia de eventos viejos (> 1.2 segundos atrás)
    this.scheduledNotes = this.scheduledNotes.filter(note => note.time > now - 1.2)
  }

  stop() {
    this.isPlaying = false
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    this.scheduledNotes = []
  }

  getCurrentAudioTime() {
    return this.ctx ? this.ctx.currentTime : 0
  }

  dispose() {
    this.stop()
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
  }
}

// Instancia singleton compartida
export const audioEngine = new AudioEngine()
