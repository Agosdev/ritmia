import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { calculateTiming } from '../music/timingCalculator'
import { parseGrouping, isGroupingValid, getGroupingSuggestions, getGroupingStatus, groupingFeedback } from '../music/groupingSuggestions'
import { CLAVE_PATTERNS } from '../music/clavePatterns'
import { NOTE_NAMES } from '../music/constants'
import { isNumerator, isDenominator, isBpm, isMode, isUnitValue, isAccentArray, isLevel, isText } from '../music/validation'
import { audioEngine } from '../audio/AudioEngine'

const RitmiaContext = createContext(null)
const RitmiaRealtimeContext = createContext(null)

// Preserva la API de setter de React, incluidos los actualizadores funcionales.
function useValidatedState(initial, validate) {
  const [value, setValue] = useState(initial)
  const setValidated = useCallback(update => setValue(previous => {
    const next = typeof update === 'function' ? update(previous) : update
    return validate(next) ? next : previous
  }), [validate])
  return [value, setValidated]
}

function getTrackVisualState(notes, track, audioTime, step, length, startTime, nextTime, nextIndex) {
  if (audioTime < startTime || !Number.isFinite(step) || step <= 0 || length <= 0) {
    return { beat: -1, progress: 0 }
  }

  const trackNotes = notes.filter(note => note.type === track)
  let previous = null
  let next = null
  for (const note of trackNotes) {
    if (note.time <= audioTime) previous = note
    else {
      next = note
      break
    }
  }

  let position
  if (previous && next) {
    const distance = (next.pos - previous.pos + length) % length || 1
    const interval = next.time - previous.time
    const fraction = interval > 0 ? (audioTime - previous.time) / interval : 0
    position = previous.pos + distance * fraction
  } else if (previous) {
    position = previous.pos + (audioTime - previous.time) / step
  } else if (next) {
    const distance = (next.pos - ((next.pos + length - 1) % length) + length) % length || 1
    const interval = next.time - (nextTime - step)
    const fraction = interval > 0 ? (audioTime - (next.time - interval)) / interval : 0
    position = next.pos - distance + distance * fraction
  } else {
    position = nextIndex - 1 + (audioTime - (nextTime - step)) / step
  }

  const beat = previous && audioTime - previous.time < 0.05 ? previous.pos : -1
  return {
    beat,
    progress: ((position % length) + length) % length / length,
  }
}

export function RitmiaProvider({ children }) {
  // Configuración de Tempo y Reproducción
  const [bpm, setBpm] = useValidatedState(92, isBpm)
  const [isPlaying, setIsPlaying] = useState(false)
  const [level, setLevel] = useValidatedState(1, isLevel)

  // Compás A
  const [numA, setNumA] = useValidatedState(7, isNumerator)
  const [denA, setDenA] = useValidatedState(8, isDenominator)
  const [storedAccentsA, setAccentsA] = useValidatedState([2, 0, 1, 0, 1, 0, 0], isAccentArray)
  const [groupingA, setGroupingA] = useValidatedState('3+2+2', isText)
  const [volumeA, setVolumeA] = useValidatedState(1, isUnitValue)

  // Compás B
  const [numB, setNumB] = useValidatedState(5, isNumerator)
  const [denB, setDenB] = useValidatedState(8, isDenominator)
  const [storedAccentsB, setAccentsB] = useValidatedState([2, 0, 1, 0, 1], isAccentArray)
  const [groupingB, setGroupingB] = useValidatedState('3+2', isText)
  const [volumeB, setVolumeB] = useValidatedState(1, isUnitValue)

  // Modos de Nivel 3
  const [mode, setMode] = useValidatedState('polirritmia', isMode)
  const [morphAmount, setMorphAmount] = useValidatedState(0.5, isUnitValue)
  const [claveIndex, setClaveIndex] = useState(0)

  // Preferencias UX / Accesibilidad
  const [safeMode, setSafeMode] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(true)
  const [metronome, setMetronome] = useState(true)

  // Modales
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false)
  const [isTestOpen, setIsTestOpen] = useState(false)
  const [testData, setTestData] = useState(null)
  const [testFeedback, setTestFeedback] = useState(null)

  // Estado Visual en Tiempo Real (vía rAF)
  const [currentBeatA, setCurrentBeatA] = useState(-1)
  const [currentBeatB, setCurrentBeatB] = useState(-1)
  const [progressA, setProgressA] = useState(0)
  const [progressB, setProgressB] = useState(0)

  const rafRef = useRef(null)
  const playbackRequestRef = useRef(0)
  const playbackRequestedRef = useRef(false)
  const visualConfigRef = useRef(null)

  // El motor recibe siempre un paso por unidad del numerador, incluso en el
  // render anterior al efecto que redimensiona permanentemente los acentos.
  const accentsA = useMemo(() => Array.from({ length: numA }, (_, i) => storedAccentsA[i] ?? 0), [storedAccentsA, numA])
  const accentsB = useMemo(() => Array.from({ length: numB }, (_, i) => storedAccentsB[i] ?? 0), [storedAccentsB, numB])

  // Normalizar array de acentos A cuando cambia numA
  useEffect(() => {
    setAccentsA(prev => {
      const copy = [...prev]
      if (copy.length < numA) {
        return [...copy, ...Array(numA - copy.length).fill(0)]
      }
      if (copy.length > numA) {
        return copy.slice(0, numA)
      }
      return copy
    })
  }, [numA])

  // Normalizar array de acentos B cuando cambia numB
  useEffect(() => {
    setAccentsB(prev => {
      const copy = [...prev]
      if (copy.length < numB) {
        return [...copy, ...Array(numB - copy.length).fill(0)]
      }
      if (copy.length > numB) {
        return copy.slice(0, numB)
      }
      return copy
    })
  }, [numB])

  // Sincronizar clave cuando el modo es 'clave'
  useEffect(() => {
    if (mode === 'clave') {
      const pattern = CLAVE_PATTERNS[claveIndex]?.pat || CLAVE_PATTERNS[0].pat
      setNumB(pattern.length)
      setAccentsB(pattern)
      setDenB(8)
    }
  }, [mode, claveIndex])

  // Cálculos de Teoría Musical
  const parsedGroupingA = useMemo(() => parseGrouping(groupingA), [groupingA])
  const parsedGroupingB = useMemo(() => parseGrouping(groupingB), [groupingB])

  const groupingStatusA = getGroupingStatus(groupingA, numA)
  const groupingStatusB = getGroupingStatus(groupingB, numB)
  const isValidGroupingA = groupingStatusA === 'valid'
  const isValidGroupingB = groupingStatusB === 'valid'
  const [lastGroupingA, setLastGroupingA] = useState([3, 2, 2])
  const [lastGroupingB, setLastGroupingB] = useState([3, 2])
  const activeGroupingA = isValidGroupingA ? parsedGroupingA :
    (isGroupingValid(lastGroupingA, numA) ? lastGroupingA : null)
  const activeGroupingB = isValidGroupingB ? parsedGroupingB :
    (isGroupingValid(lastGroupingB, numB) ? lastGroupingB : null)
  useEffect(() => {
    if (isValidGroupingA) setLastGroupingA(parsedGroupingA)
  }, [isValidGroupingA, parsedGroupingA])
  useEffect(() => {
    if (isValidGroupingB) setLastGroupingB(parsedGroupingB)
  }, [isValidGroupingB, parsedGroupingB])
  const groupingFeedbackA = groupingFeedback(groupingStatusA, numA, activeGroupingA)
  const groupingFeedbackB = groupingFeedback(groupingStatusB, numB, activeGroupingB)

  const timing = useMemo(() => {
    const claveMeasures = mode === 'clave'
      ? CLAVE_PATTERNS[claveIndex]?.cycleMeasures ?? 1
      : 1
    return calculateTiming({ bpm, numA, denA, numB, denB, mode, claveMeasures })
  }, [bpm, numA, denA, numB, denB, mode, claveIndex])
  visualConfigRef.current = { safeMode, bpm }

  const suggestionsA = useMemo(() => getGroupingSuggestions(numA), [numA])
  const suggestionsB = useMemo(() => getGroupingSuggestions(numB), [numB])

  // Sincronizar parámetros con el motor de audio en tiempo real
  useEffect(() => {
    audioEngine.setParams({
      level,
      mode,
      stepA: timing.stepA,
      stepB: timing.stepB,
      measureA: timing.measureA,
      measureB: timing.measureB,
      accentsA,
      accentsB,
      volumeA,
      volumeB,
      morph: morphAmount,
      metronome,
    })
  }, [level, mode, timing, accentsA, accentsB, volumeA, volumeB, morphAmount, metronome])

  // Loop de Animación Visual Sincronizado (rAF)
  const runAnimationLoop = useCallback(() => {
    const loop = () => {
      if (!audioEngine.isPlaying || !audioEngine.ctx) {
        setCurrentBeatA(-1)
        setCurrentBeatB(-1)
        setProgressA(0)
        setProgressB(0)
        rafRef.current = null
        return
      }

      const audioTime = audioEngine.getCurrentAudioTime()
      const { safeMode: currentSafeMode, bpm: currentBpm } = visualConfigRef.current
      const { accentsA: currentA, accentsB: currentB, stepA, stepB } = audioEngine.params
      const notes = audioEngine.scheduledNotes
      const visualA = getTrackVisualState(
        notes, 'A', audioTime, stepA, currentA.length, audioEngine.startTime,
        audioEngine.nextNoteTimeA, audioEngine.stepCountA,
      )
      const visualB = getTrackVisualState(
        notes, 'B', audioTime, stepB, currentB.length, audioEngine.startTime,
        audioEngine.nextNoteTimeB, audioEngine.stepCountB,
      )
      const beatA = currentSafeMode && currentBpm > 130 && notes
        .some(note => note.type === 'A' && note.time <= audioTime &&
          audioTime - note.time < 0.05 && note.accent !== 2)
        ? -1
        : visualA.beat
      const beatB = currentSafeMode && currentBpm > 130 && notes
        .some(note => note.type === 'B' && note.time <= audioTime &&
          audioTime - note.time < 0.05 && note.accent !== 2)
        ? -1
        : visualB.beat

      setProgressA(Math.max(0, Math.min(1, visualA.progress)))
      setProgressB(Math.max(0, Math.min(1, visualB.progress)))
      setCurrentBeatA(beatA)
      setCurrentBeatB(beatB)

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [])

  const startPlayback = useCallback(async () => {
    if (playbackRequestedRef.current) return
    playbackRequestedRef.current = true
    const request = ++playbackRequestRef.current
    try {
      await audioEngine.start({
        level,
        mode,
        stepA: timing.stepA,
        stepB: timing.stepB,
        measureA: timing.measureA,
        measureB: timing.measureB,
        accentsA,
        accentsB,
        volumeA,
        volumeB,
        morph: morphAmount,
        metronome,
      })
      if (request !== playbackRequestRef.current || !audioEngine.isPlaying) return
      setIsPlaying(true)
      runAnimationLoop()
    } catch (err) {
      if (request !== playbackRequestRef.current) return
      playbackRequestedRef.current = false
      console.error('Error al iniciar audio:', err)
    }
  }, [
    level, mode, timing, accentsA, accentsB, volumeA, volumeB, morphAmount, metronome,
    runAnimationLoop,
  ])

  const stopPlayback = useCallback(() => {
    playbackRequestRef.current++
    playbackRequestedRef.current = false
    audioEngine.stop()
    setIsPlaying(false)
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setCurrentBeatA(-1)
    setCurrentBeatB(-1)
    setProgressA(0)
    setProgressB(0)
  }, [])

  const togglePlayback = useCallback(() => {
    if (playbackRequestedRef.current) {
      stopPlayback()
    } else {
      startPlayback()
    }
  }, [startPlayback, stopPlayback])

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      playbackRequestRef.current++
      playbackRequestedRef.current = false
      const closing = audioEngine.dispose()
      closing?.catch(err => console.error('Error al cerrar audio:', err))
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  // Modales & Test de lectura
  const openTest = useCallback(() => {
    if (level === 1) {
      const q = `Si el compás es ${numA}/${denA} a ${bpm} BPM, ¿cuánto dura un compás?`
      const duration = ((60 / bpm) * numA * (4 / denA)).toFixed(2)
      setTestData({
        q,
        a: `${duration}s`,
        options: [
          `${duration}s`,
          `${(parseFloat(duration) * 1.5).toFixed(2)}s`,
          `${(parseFloat(duration) * 0.5).toFixed(2)}s`,
        ],
      })
    } else if (level === 2) {
      const desc = activeGroupingA ? activeGroupingA.join('+') : 'ninguna aplicada'
      const count = activeGroupingA?.length ?? 0
      setTestData({
        q: `Con agrupación ${desc} sobre ${numA}/${denA}, ¿cuántos grupos hay?`,
        a: `${count}`,
        options: [`${count}`, `${count + 1}`, `${count > 0 ? count - 1 : 2}`],
      })
    } else {
      const pDesc =
        mode === 'polimetria'
          ? `Polimetría ${numA}/${denA} vs ${numB}/${denB}: reencuentro cada ${timing.reunionA} compases de A`
          : `Modo ${mode}: frecuencia de pasos A:B ${timing.eventRatio.a}:${timing.eventRatio.b} en ciclo común`
      setTestData({
        q: `En modo ${mode}, ¿qué describe mejor este ritmo?`,
        a: pDesc,
        options: [pDesc, 'Un solo compás simétrico', 'Tempo rubato libre'],
      })
    }
    setTestFeedback(null)
    setIsTestOpen(true)
  }, [
    level, numA, denA, bpm, activeGroupingA, mode, timing, numB, denB,
  ])

  // Descripción sonora pedagógica "¿Qué escuchas?"
  const audioDescription = useMemo(() => {
    const accentsCountA = accentsA.filter(a => a > 0).length
    const strongA = accentsA
      .map((acc, i) => (acc === 2 ? i + 1 : null))
      .filter(Boolean)

    const durCompasA = ((60 / bpm) * numA * (4 / denA)).toFixed(2)
    const durNegra = (60 / bpm).toFixed(2)
    const noteNameA = NOTE_NAMES[denA] || `${denA}va`

    let desc = `Compás A: ${numA} pulsos de ${noteNameA}, ${accentsCountA} acentos${
      strongA.length ? ` en ${strongA.join(', ')}` : ''
    }. Duración de compás: ${durCompasA}s (negra: ${durNegra}s).`

    if (level === 3) {
      const accentsCountB = accentsB.filter(b => b > 0).length
      const canonicalClaveCycle = mode === 'clave' && CLAVE_PATTERNS[claveIndex]?.cycleMeasures === 2
      desc += canonicalClaveCycle
        ? ` | Ciclo de clave: ${numB} subdivisiones de ${NOTE_NAMES[denB] || denB}, ${accentsCountB} ataques; dura ocho negras (${timing.measureB.toFixed(2)}s).`
        : ` | Compás B: ${numB} de ${NOTE_NAMES[denB] || denB} con ${accentsCountB} acentos.`

      if (mode === 'polirritmia') {
        desc += ` Ambos compases encajan en ${durCompasA}s (frecuencia de pasos A:B ${timing.eventRatio.a}:${timing.eventRatio.b}, B estirado/comprimido; incluye silencios).`
      } else if (mode === 'polimetria') {
        desc += ` Duraciones métricas independientes (A:B ${timing.durationRatio.a}:${timing.durationRatio.b}); frecuencia de pasos A:B ${timing.eventRatio.a}:${timing.eventRatio.b}. A ${timing.measureA.toFixed(2)}s, B ${timing.measureB.toFixed(2)}s. Reencuentro cada ${timing.reunionA}×A / ${timing.reunionB}×B.`
      } else if (mode === 'morph') {
        desc += ` Morph ${Math.round(morphAmount * 100)}% A→B, modulación cruzada de ganancia sin desfase.`
      } else if (mode === 'clave') {
        desc += ` Clave tradicional ${CLAVE_PATTERNS[claveIndex]?.name} sobre base rítmica A.`
      }
    }

    if (safeMode && bpm > 130) {
      desc += ' [Modo seguro activo: solo acentos fuertes iluminan la visualización]'
    }

    return desc
  }, [
    numA,
    denA,
    accentsA,
    bpm,
    level,
    numB,
    denB,
    accentsB,
    mode,
    timing,
    morphAmount,
    claveIndex,
    safeMode,
  ])

  const value = useMemo(() => ({
    bpm,
    setBpm,
    isPlaying,
    togglePlayback,
    startPlayback,
    stopPlayback,
    level,
    setLevel,

    // Track A
    numA,
    setNumA,
    denA,
    setDenA,
    accentsA,
    setAccentsA,
    groupingA,
    setGroupingA,
    volumeA,
    setVolumeA,
    parsedGroupingA,
    isValidGroupingA,
    activeGroupingA,
    groupingStatusA,
    groupingFeedbackA,
    suggestionsA,

    // Track B
    numB,
    setNumB,
    denB,
    setDenB,
    accentsB,
    setAccentsB,
    groupingB,
    setGroupingB,
    volumeB,
    setVolumeB,
    parsedGroupingB,
    isValidGroupingB,
    activeGroupingB,
    groupingStatusB,
    groupingFeedbackB,
    suggestionsB,

    // Modes
    mode,
    setMode,
    morphAmount,
    setMorphAmount,
    claveIndex,
    setClaveIndex,

    // Settings
    safeMode,
    setSafeMode,
    reduceMotion,
    setReduceMotion,
    metronome,
    setMetronome,

    timing,
    audioDescription,

    // Modals
    isWelcomeOpen,
    setIsWelcomeOpen,
    isTestOpen,
    setIsTestOpen,
    testData,
    testFeedback,
    setTestFeedback,
    openTest,
  }), [
    bpm, setBpm, isPlaying, togglePlayback, startPlayback, stopPlayback, level, setLevel,
    numA, setNumA, denA, setDenA, accentsA, setAccentsA, groupingA, setGroupingA,
    volumeA, setVolumeA, parsedGroupingA, isValidGroupingA, activeGroupingA,
    groupingStatusA, groupingFeedbackA, suggestionsA, numB, setNumB, denB, setDenB,
    accentsB, setAccentsB, groupingB, setGroupingB, volumeB, setVolumeB, parsedGroupingB,
    isValidGroupingB, activeGroupingB, groupingStatusB, groupingFeedbackB, suggestionsB,
    mode, setMode, morphAmount, setMorphAmount, claveIndex, setClaveIndex, safeMode,
    setSafeMode, reduceMotion, setReduceMotion, metronome, setMetronome, timing,
    audioDescription, isWelcomeOpen, setIsWelcomeOpen, isTestOpen, setIsTestOpen,
    testData, testFeedback, setTestFeedback, openTest,
  ])

  const realtimeValue = useMemo(() => ({
    currentBeatA, currentBeatB, progressA, progressB,
  }), [currentBeatA, currentBeatB, progressA, progressB])

  return (
    <RitmiaContext.Provider value={value}>
      <RitmiaRealtimeContext.Provider value={realtimeValue}>
        {children}
      </RitmiaRealtimeContext.Provider>
    </RitmiaContext.Provider>
  )
}

export function useRitmia() {
  const context = useContext(RitmiaContext)
  if (!context) {
    throw new Error('useRitmia debe ser utilizado dentro de un RitmiaProvider')
  }
  return context
}

export function useRitmiaRealtime() {
  const context = useContext(RitmiaRealtimeContext)
  if (!context) {
    throw new Error('useRitmiaRealtime debe ser utilizado dentro de RitmiaProvider')
  }
  return context
}
