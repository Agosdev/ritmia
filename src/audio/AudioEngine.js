import { createMasterBus } from './masterBus'
import { playSample, playPitchedSample } from './instruments'
import { loadAcousticSoundBank } from './soundBank'
import { loadInstrumentBank, loadPitchedInstrumentBank } from './instrumentBank'
import { INSTRUMENTS, resolveInstrumentHits } from './instrumentCatalog'

export class AudioEngine {
  constructor() {
    this.ctx = null
    this.masterGain = null
    this.compressor = null
    this.timerId = null
    this.transportGeneration = 0
    this.startPromise = null
    this.pausePromise = null
    this.activeVoices = new Set()
    this.sampleBankPromise = null
    this.sampleBankContext = null
    this.sampleBankBuffers = null
    this.soundBankError = null
    this.instrumentBanks = new Map()
    this.pitchedInstrumentBanks = new Map()
    this.pitchedBankPromises = new Map()
    this.instrumentRequests = {}
    this.activeInstruments = { A: 'acoustic', B: 'acoustic' }
    this.instrumentStatus = {}
    this.instrumentListeners = new Set()
    this.audioStatusListeners = new Set()
    this.intentionalSuspend = false

    this.isPlaying = false
    this.transportState = 'stopped'
    this.startTime = 0
    this.nextNoteTimeA = 0
    this.nextNoteTimeB = 0
    this.stepCountA = 0
    this.stepCountB = 0
    this.resumePhaseUntilA = null
    this.resumePhaseUntilB = null

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
      metronome: false,
      instrumentA: 'acoustic', instrumentB: 'acoustic',
      strokesA: null, strokesB: null,
      bassEventsA: null, bassEventsB: null,
    }
  }

  async ensureAcousticSoundBank() {
    if (this.sampleBankContext !== this.ctx) {
      this.instrumentBanks.clear()
      this.pitchedInstrumentBanks.clear()
      this.pitchedBankPromises.clear()
      this.instrumentRequests = {}
      this.activeInstruments = { A: 'acoustic', B: 'acoustic' }
      this.sampleBankContext = this.ctx
      this.sampleBankPromise = null
      this.sampleBankBuffers = null
      this.soundBankError = null
    }
    if (this.sampleBankBuffers) return

    const context = this.ctx
    const pending = this.sampleBankPromise ??= loadAcousticSoundBank(context)
    const isCurrentContext = () => this.ctx === context && this.sampleBankContext === context
    try {
      const buffers = await pending
      // A late decode from a disposed context must not repopulate the cache.
      if (!isCurrentContext() || this.sampleBankPromise !== pending) return
      this.sampleBankBuffers = buffers
      this.instrumentBanks.set('acoustic', buffers)
      this.soundBankError = null
    } catch (error) {
      if (!isCurrentContext()) return
      if (this.sampleBankPromise === pending) {
        this.soundBankError = error
        this.sampleBankPromise = null
      }
      // All callers sharing a failed load must reject, even after the first clears it.
      throw error
    }
  }

  subscribeInstrumentStatus(listener) {
    this.instrumentListeners.add(listener)
    listener(this.instrumentStatus)
    return () => this.instrumentListeners.delete(listener)
  }

  publishInstrumentStatus(track, status) {
    this.instrumentStatus = { ...this.instrumentStatus, [track]: status }
    this.instrumentListeners.forEach(listener => listener(this.instrumentStatus))
  }

  subscribeAudioStatus(listener) {
    this.audioStatusListeners.add(listener)
    return () => this.audioStatusListeners.delete(listener)
  }

  handleContextStateChange(context) {
    if (this.ctx !== context || context.state === 'running') return
    if (this.transportState !== 'playing' || !this.isPlaying || this.intentionalSuspend) return

    this.isPlaying = false
    this.transportState = 'interrupted'
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    this.invalidateFutureNotes()
    this.audioStatusListeners.forEach(listener => listener('interrupted'))
  }

  activateInstrument(track, id) {
    if (this.activeInstruments[track] === id) return
    // Replace only pending events of this track; keep the master clock and counters.
    if (this.isPlaying) this.invalidateFutureNotes(track)
    for (const voice of this.activeVoices) {
      if (voice.track === track) voice.stop(.015)
    }
    this.activeInstruments[track] = id
  }

  prepareInstrument(track, id, retry = false) {
    if (!Object.hasOwn(INSTRUMENTS, id)) id = 'acoustic'
    const context = this.ctx
    if (!context || !this.sampleBankBuffers) return Promise.resolve()
    const previous = this.instrumentRequests[track]
    if (!retry && previous?.id === id && previous.context === context) return previous.promise
    const request = { id, context, promise: null }
    this.instrumentRequests[track] = request
    const current = () => this.ctx === context && this.instrumentRequests[track] === request
    this.publishInstrumentStatus(track, { requested: id, effective: this.activeInstruments[track], loading: true, error: null })
    request.promise = (async () => {
      try {
        const buffers = this.instrumentBanks.get(id) ?? await loadInstrumentBank(context, id)
        if (!current()) return
        this.instrumentBanks.set(id, buffers)
        this.activateInstrument(track, id)
        this.publishInstrumentStatus(track, { requested: id, effective: id, loading: false, error: null })
      } catch (error) {
        if (!current()) return
        this.activateInstrument(track, 'acoustic')
        this.publishInstrumentStatus(track, { requested: id, effective: 'acoustic', loading: false,
          error: 'No pudimos cargar este instrumento. Podés seguir escuchando el ritmo con el kit acústico.' })
      }
    })()
    return request.promise
  }

  async prepareSelectedInstruments() {
    const context = this.ctx
    // A selection made while loading must win before the transport starts.
    while (this.ctx === context) {
      const { instrumentA, instrumentB, level } = this.params
      const tracks = [['A', instrumentA], ...(level === 2 ? [['B', instrumentB]] : [])]
      await Promise.all(tracks.map(([track, id]) => this.prepareInstrument(track, id, !!this.instrumentStatus[track]?.error)))
      const bassTracks = tracks.map(([track]) => track).filter(track => this.params[`bassEvents${track}`]?.length)
      await Promise.all(bassTracks.map(track => this.preparePitchedInstrument(track)))
      if (instrumentA === this.params.instrumentA && instrumentB === this.params.instrumentB && level === this.params.level) return
    }
  }

  retryInstrument(track) {
    return this.prepareInstrument(track, this.params[`instrument${track}`], true)
  }

  retryBass(track) {
    if (!this.ctx || !this.sampleBankBuffers) return Promise.resolve()
    return this.preparePitchedInstrument(track)
  }

  preparePitchedInstrument(track) {
    const context = this.ctx
    if (!context || !this.sampleBankBuffers) return Promise.resolve()
    let pending = this.pitchedBankPromises.get('electricBass')
    if (!pending) {
      pending = loadPitchedInstrumentBank(context, 'electricBass')
      this.pitchedBankPromises.set('electricBass', pending)
      pending.catch(() => {
        if (this.pitchedBankPromises.get('electricBass') === pending) this.pitchedBankPromises.delete('electricBass')
      })
    }
    this.publishInstrumentStatus(track, { ...this.instrumentStatus[track], bassLoading: true, bassError: null })
    return pending.then(buffers => {
      if (this.ctx !== context || this.pitchedBankPromises.get('electricBass') !== pending) return
      this.pitchedInstrumentBanks.set('electricBass', buffers)
      this.publishInstrumentStatus(track, { ...this.instrumentStatus[track], bassLoading: false, bassError: null })
    }).catch(error => {
      if (this.ctx !== context) return
      this.publishInstrumentStatus(track, { ...this.instrumentStatus[track], bassLoading: false,
        bassError: 'No pudimos cargar el bajo. Podés seguir escuchando la batería.' })
      return error
    })
  }

  playBassNote(track, time, note, volume) {
    if (!note || !Number.isInteger(note.midi)) return null
    const bank = this.pitchedInstrumentBanks.get('electricBass')
    const sample = bank?.[note.midi]
    if (!sample) return null
    const voice = playPitchedSample(this.ctx, this.masterGain, time, sample, note.midi, note.midi,
      note.velocity ?? 0.7, volume, 0.42)
    if (voice) voice.kind = 'bass'
    return this.trackVoice(voice, track)
  }

  playTrackHit(track, time, accent, stroke, volume) {
    const id = this.activeInstruments[track]
    const bank = this.instrumentBanks.get(id)
    const fallback = resolveInstrumentHits('acoustic', accent, null, track)[0]
    const hits = resolveInstrumentHits(id, accent, stroke, track)
    // Bound simultaneous tails, including dense B subdivisions, without dropping attacks.
    const sounding = [...this.activeVoices].filter(voice => voice.track === track && voice.startTime <= time && voice.endTime > time)
      .sort((a, b) => a.startTime - b.startTime)
    while (sounding.length + hits.length > 32) sounding.shift().stop(.005, time)
    return hits.map(hit => {
      const buffer = bank?.[hit.sample] ?? this.sampleBankBuffers?.[fallback?.sample]
      return this.trackVoice(playSample(this.ctx, this.masterGain, time, buffer, hit.gain, volume), track)
    }).filter(Boolean)
  }

  async ensureContext() {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) throw new Error('Web Audio API no está disponible en este entorno')
      this.ctx = new AudioCtx()
      const { masterGain, compressor } = createMasterBus(this.ctx)
      this.masterGain = masterGain
      this.compressor = compressor
      const context = this.ctx
      context.onstatechange = () => this.handleContextStateChange(context)
    }

    if (this.ctx.state !== 'running') {
      await this.ctx.resume()
    }
  }

  setParams(newParams) {
    newParams = { ...newParams }
    for (const track of ['A', 'B']) {
      const key = `instrument${track}`
      if (key in newParams && !Object.hasOwn(INSTRUMENTS, newParams[key])) newParams[key] = 'acoustic'
    }
    const old = this.params
    const changed = Object.entries(newParams).some(([key, value]) => !['instrumentA', 'instrumentB'].includes(key) && this.params[key] !== value)
    // Cancelar el lookahead viejo y retomar desde el primer timestamp pendiente mantiene la fase.
    if (changed && this.isPlaying) this.invalidateFutureNotes()
    this.params = { ...this.params, ...newParams }
    if (old.level === 2 && this.params.level === 1) {
      for (const voice of this.activeVoices) if (voice.track === 'B') voice.stop(.015)
    }
    for (const track of ['A', 'B']) {
      if (old[`bassEvents${track}`]?.length && !this.params[`bassEvents${track}`]?.length) {
        for (const voice of this.activeVoices) if (voice.track === track && voice.kind === 'bass') voice.stop(.015)
      }
    }
    for (const track of ['A', 'B']) {
      if (track === 'B' && this.params.level !== 2) continue
      const key = `instrument${track}`
      if (old[key] !== this.params[key] || (track === 'B' && old.level !== this.params.level)) {
        this.prepareInstrument(track, this.params[key])
      }
      if (this.params[`bassEvents${track}`]?.length &&
          (!old[`bassEvents${track}`]?.length || (track === 'B' && old.level !== this.params.level))) {
        this.preparePitchedInstrument(track)
      }
    }
  }

  invalidateFutureNotes(onlyTrack = null) {
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const firstFutureTime = { A: null, B: null }
    const removedCounts = { A: 0, B: 0 }

    this.scheduledNotes = this.scheduledNotes.filter(note => {
      if (note.time <= now || (onlyTrack && note.type !== onlyTrack)) return true

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
      if (this.pausePromise) await this.pausePromise
      await this.ensureContext()
      // Stop/dispose invalidan también solicitudes que están esperando resume().
      if (generation !== this.transportGeneration) return
      if (this.ctx.state !== 'running') throw new Error('AudioContext no está activo')
      {
        await this.ensureAcousticSoundBank()
        await this.prepareSelectedInstruments()
        if (generation !== this.transportGeneration) return
      }
      if (this.isPlaying) return

      if (this.transportState === 'stopped') {
        // Offset de 80ms para preparar los primeros buffers
        const now = this.ctx.currentTime
        this.startTime = now + 0.08
        this.nextNoteTimeA = this.startTime
        this.nextNoteTimeB = this.startTime
        this.stepCountA = 0
        this.stepCountB = 0
        this.scheduledNotes = []
      }
      this.isPlaying = true
      this.transportState = 'playing'

      // Ejecutar inmediatamente el primer ciclo y luego cada 25ms
      this.schedule()
      this.timerId = window.setInterval(() => this.schedule(), 25)
    } catch (error) {
      if (generation !== this.transportGeneration) return
      this.stop()
      throw error
    }
  }

  pause() {
    if (this.transportState !== 'playing' || !this.ctx) return Promise.resolve()
    if (this.pausePromise) return this.pausePromise

    const generation = ++this.transportGeneration
    this.isPlaying = false
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }

    const pending = (async () => {
      try {
        this.intentionalSuspend = true
        await this.ctx.suspend()
        if (generation !== this.transportGeneration) return
        this.invalidateFutureNotes()
        this.resumePhaseUntilA = this.nextNoteTimeA
        this.resumePhaseUntilB = this.nextNoteTimeB
        for (const voice of [...this.activeVoices]) voice.stop()
        this.activeVoices.clear()
        this.transportState = 'paused'
      } catch (error) {
        if (generation === this.transportGeneration && this.ctx?.state === 'running') {
          this.isPlaying = true
          this.transportState = 'playing'
          this.schedule()
          this.timerId = window.setInterval(() => this.schedule(), 25)
        }
        throw error
      } finally {
        this.intentionalSuspend = false
      }
    })()
    this.pausePromise = pending
    pending.finally(() => {
      if (this.pausePromise === pending) this.pausePromise = null
    }).catch(() => {})
    return pending
  }

  trackVoice(voice, track = null) {
    if (!voice) return null
    voice.track = track
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
    const acousticBuffers = this.sampleBankContext === this.ctx
      ? this.sampleBankBuffers
      : null
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

      if (mode === 'morph' && level === 2) {
        volA = volumeA * (1 - morph)
      }

      if (accentA !== 0 && acousticBuffers) {
        voices.push(...this.playTrackHit('A', this.nextNoteTimeA, accentA, this.params.strokesA?.[posA], volA))
      }
      const bassA = this.params.bassEventsA?.find(event => event.position === posA)
      if (bassA) {
        const bassVoice = this.playBassNote('A', this.nextNoteTimeA, bassA, volA)
        if (bassVoice) voices.push(bassVoice)
      }

      // Metrónomo en pulso 1 de A
      if (metronome && posA === 0 && acousticBuffers) {
        // One quiet existing acoustic hit, sharing the exact cycle timestamp.
        voices.push(this.trackVoice(playSample(this.ctx, dest, this.nextNoteTimeA, acousticBuffers.snareSoft, 1, 0.25, 0.08)))
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

    // --- Pista B (solo si estamos en Nivel 2) ---
    if (level === 2) {
      while (validB && this.nextNoteTimeB < now + lookahead && eventsB++ < maxEvents) {
        const lenB = accentsB.length || 1
        const posB = this.stepCountB % lenB
        const accentB = accentsB[posB] ?? 0
        let volB = volumeB
        const voices = []

        if (mode === 'morph' && level === 2) {
          volB = volumeB * morph
        }

        if (accentB !== 0 && acousticBuffers) {
          voices.push(...this.playTrackHit('B', this.nextNoteTimeB, accentB, this.params.strokesB?.[posB], volB))
        }
        const bassB = this.params.bassEventsB?.find(event => event.position === posB)
        if (bassB) {
          const bassVoice = this.playBassNote('B', this.nextNoteTimeB, bassB, volB)
          if (bassVoice) voices.push(bassVoice)
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
    this.transportState = 'stopped'
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    for (const voice of [...this.activeVoices]) voice.stop()
    this.activeVoices.clear()
    this.scheduledNotes = []
    this.eventVoices = new WeakMap()
    this.startTime = 0
    this.nextNoteTimeA = 0
    this.nextNoteTimeB = 0
    this.stepCountA = 0
    this.stepCountB = 0
    this.resumePhaseUntilA = null
    this.resumePhaseUntilB = null
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
    this.instrumentBanks.clear()
    this.instrumentRequests = {}
    this.instrumentStatus = {}
    this.activeInstruments = { A: 'acoustic', B: 'acoustic' }
    this.sampleBankBuffers = null
    this.sampleBankContext = null
    this.sampleBankPromise = null
    this.soundBankError = null
    if (ctx && ctx.state !== 'closed') return ctx.close()
  }
}

// Instancia singleton compartida
export const audioEngine = new AudioEngine()
