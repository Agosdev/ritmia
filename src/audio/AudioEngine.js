import { createMasterBus } from './masterBus'
import { playKick, playBass, playSnare, playHat, playWoodblock } from './instruments'

export class AudioEngine {
  constructor() {
    this.ctx = null
    this.masterGain = null
    this.compressor = null
    this.timerId = null
    this.transportGeneration = 0
    this.startPromise = null
    this.activeVoices = new Set()

    this.isPlaying = false
    this.startTime = 0
    this.nextNoteTimeA = 0
    this.nextNoteTimeB = 0
    this.stepCountA = 0
    this.stepCountB = 0

    // Cola de eventos programados para sincronización visual
    this.scheduledNotes = []
    this.eventVoices = new WeakMap()

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
    if (!this.ctx || this.ctx.state === 'closed') {
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
    const changed = Object.entries(newParams).some(([key, value]) => this.params[key] !== value)
    // Cancelar el lookahead viejo y retomar desde el primer timestamp pendiente mantiene la fase.
    if (changed && this.isPlaying) this.invalidateFutureNotes()
    this.params = { ...this.params, ...newParams }
  }

  invalidateFutureNotes() {
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const firstFutureTime = { A: null, B: null }
    const removedCounts = { A: 0, B: 0 }

    this.scheduledNotes = this.scheduledNotes.filter(note => {
      if (note.time <= now) return true

      const track = note.type
      firstFutureTime[track] ??= note.time
      removedCounts[track]++
      for (const voice of this.eventVoices.get(note) ?? []) {
        voice.stop()
        this.activeVoices.delete(voice)
      }
      return false
    })

    for (const track of ['A', 'B']) {
      if (firstFutureTime[track] === null) continue
      const timeKey = `nextNoteTime${track}`
      const countKey = `stepCount${track}`
      this[timeKey] = firstFutureTime[track]
      this[countKey] = Math.max(0, this[countKey] - removedCounts[track])
    }
  }

  async start(initialParams = {}) {
    this.setParams(initialParams)
    if (this.isPlaying && this.ctx?.state === 'running') return
    if (this.startPromise) return this.startPromise

    const generation = this.transportGeneration
    const pending = this.startTransport(generation)
    this.startPromise = pending
    try {
      await pending
    } finally {
      if (this.startPromise === pending) this.startPromise = null
    }
  }

  async startTransport(generation) {
    try {
      await this.ensureContext()
      // Stop/dispose invalidan también solicitudes que están esperando resume().
      if (generation !== this.transportGeneration) return
      if (this.ctx.state !== 'running') throw new Error('AudioContext no está activo')
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
    } catch (error) {
      if (generation !== this.transportGeneration) return
      this.stop()
      throw error
    }
  }

  trackVoice(voice) {
    if (!voice) return null
    this.activeVoices.add(voice)
    voice.onended = () => this.activeVoices.delete(voice)
    return voice
  }

  advancePastNotes(track, now, step) {
    if (!Number.isFinite(step) || step <= 0) return false
    const timeKey = `nextNoteTime${track}`
    const countKey = `stepCount${track}`
    if (this[timeKey] < now) {
      const skipped = Math.ceil((now - this[timeKey]) / step)
      this[timeKey] += skipped * step
      this[countKey] += skipped
      // Evitar un timestamp vencido por redondeo de coma flotante.
      if (this[timeKey] < now) {
        this[timeKey] += step
        this[countKey]++
      }
    }
    return true
  }

  schedule() {
    if (!this.isPlaying || !this.ctx || this.ctx.state !== 'running') return

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
    const validA = this.advancePastNotes('A', now, stepA)
    // B conserva su fase aun mientras está silenciada por el nivel.
    const validB = this.advancePastNotes('B', now, stepB)
    // Defensa ante parámetros externos extremos; el rango musical de la UI
    // requiere como máximo 64 pasos por pista dentro de estos 100ms.
    const maxEvents = 128
    let eventsA = 0
    let eventsB = 0

    // --- Pista A ---
    while (validA && this.nextNoteTimeA < now + lookahead && eventsA++ < maxEvents) {
      const lenA = accentsA.length || 1
      const posA = this.stepCountA % lenA
      const accentA = accentsA[posA] ?? 0
      let volA = volumeA
      const voices = []

      if (mode === 'morph') {
        volA = volumeA * (1 - morph)
      }

      if (accentA !== 0) {
        const velA = accentA === 2 ? 1 : 0.6
        if (accentA === 2) {
          voices.push(this.trackVoice(playKick(this.ctx, dest, this.nextNoteTimeA, velA, volA)))
        } else {
          voices.push(this.trackVoice(playBass(this.ctx, dest, this.nextNoteTimeA, velA, volA)))
        }
      }

      // Metrónomo en pulso 1 de A
      if (metronome && posA === 0) {
        voices.push(this.trackVoice(playWoodblock(this.ctx, dest, this.nextNoteTimeA, 0.8)))
      }

      const note = {
        time: this.nextNoteTimeA,
        pos: posA,
        type: 'A',
        accent: accentA,
      }
      this.scheduledNotes.push(note)
      this.eventVoices.set(note, voices.filter(Boolean))

      this.nextNoteTimeA += stepA
      this.stepCountA++
    }

    // --- Pista B (solo si estamos en Nivel 3) ---
    if (level === 3) {
      while (validB && this.nextNoteTimeB < now + lookahead && eventsB++ < maxEvents) {
        const lenB = accentsB.length || 1
        const posB = this.stepCountB % lenB
        const accentB = accentsB[posB] ?? 0
        let volB = volumeB
        const voices = []

        if (mode === 'morph') {
          volB = volumeB * morph
        }

        if (accentB !== 0) {
          const velB = accentB === 2 ? 1 : 0.58
          if (accentB === 2) {
            voices.push(this.trackVoice(playSnare(this.ctx, dest, this.nextNoteTimeB, velB, volB)))
          } else {
            voices.push(this.trackVoice(playHat(this.ctx, dest, this.nextNoteTimeB, velB, volB)))
          }
        }

        const note = {
          time: this.nextNoteTimeB,
          pos: posB,
          type: 'B',
          accent: accentB,
        }
        this.scheduledNotes.push(note)
        this.eventVoices.set(note, voices.filter(Boolean))

        this.nextNoteTimeB += stepB
        this.stepCountB++
      }
    }

    // Mantener cola limpia de eventos viejos (> 1.2 segundos atrás)
    this.scheduledNotes = this.scheduledNotes.filter(note => {
      if (note.time > now - 1.2) return true
      this.eventVoices.delete(note)
      return false
    })
  }

  stop() {
    this.transportGeneration++
    this.startPromise = null
    this.isPlaying = false
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    for (const voice of [...this.activeVoices]) voice.stop()
    this.activeVoices.clear()
    this.scheduledNotes = []
    this.eventVoices = new WeakMap()
  }

  getCurrentAudioTime() {
    return this.ctx ? this.ctx.currentTime : 0
  }

  dispose() {
    this.stop()
    const ctx = this.ctx
    this.masterGain?.disconnect()
    this.compressor?.disconnect()
    this.ctx = null
    this.masterGain = null
    this.compressor = null
    if (ctx && ctx.state !== 'closed') return ctx.close()
  }
}

// Instancia singleton compartida
export const audioEngine = new AudioEngine()
