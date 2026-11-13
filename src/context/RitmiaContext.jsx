import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { calculateTiming } from '../music/timingCalculator'
import { parseGrouping, isGroupingValid, getGroupingSuggestions, getGroupingStatus, groupingFeedback } from '../music/groupingSuggestions'
import { CLAVE_PATTERNS } from '../music/clavePatterns'
import { NOTE_NAMES } from '../music/constants'
import { isNumerator, isDenominator, isBpm, isMode, isUnitValue, isAccentArray, isLevel, isText } from '../music/validation'
import { useSystemReducedMotion } from '../hooks/useSystemReducedMotion'
import { MUSICAL_PRESETS } from '../music/presets'
import { BASS_PATTERNS } from '../music/bassPatterns'
import { isInstrumentChoice, recommendedInstrument } from '../audio/instrumentCatalog'
import { audioEngine } from '../audio/AudioEngine'

const RitmiaContext = createContext(null)
const RitmiaRealtimeContext = createContext(null)
const isBassChoice = choice => ['auto', 'on', 'off'].includes(choice)

// Preserva la API de setter de React, incluidos los actualizadores funcionales.
function useValidatedState(initial, validate) {
  const [value, setValue] = useState(initial)
  const setValidated = useCallback(update => setValue(previous => {
    const next = typeof update === 'function' ? update(previous) : update
    return validate(next) ? next : previous
  }), [validate])
  return [value, setValidated]
}

// Manual pattern edits require Compás libre; preset application uses the validated setters.
function useManualPatternSetter(setter, locked) {
  return useCallback(update => {
    if (!locked) setter(update)
  }, [setter, locked])
}

function getTrackVisualState(
  notes, track, audioTime, step, length, startTime, nextTime, nextIndex, preservePendingInterval = false,
) {
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
    const interval = nextTime - previous.time
    position = previous.pos + (audioTime - previous.time) /
      (preservePendingInterval && interval > 0 ? interval : step)
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
  const [transportState, setTransportState] = useState('stopped')
  const isPlaying = transportState === 'playing'
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

  // Modos de Nivel 2
  const [mode, setMode] = useValidatedState('polirritmia', isMode)
  const [morphAmount, setMorphAmount] = useValidatedState(0.5, isUnitValue)
  const [claveIndex, setClaveIndex] = useState(0)

  // Preferencias UX / Accesibilidad
  const reduceMotion = useSystemReducedMotion()
  const [metronome, setMetronome] = useState(false)
  const [audioError, setAudioError] = useState(null)
  const [presetId, setPresetId] = useState('')
  const [instrumentChoiceA, setInstrumentChoiceA] = useValidatedState('auto', isInstrumentChoice)
  const [instrumentChoiceB, setInstrumentChoiceB] = useValidatedState('auto', isInstrumentChoice)
  const [bassChoiceA, setBassChoiceA] = useValidatedState('auto', isBassChoice)
  const selectedPreset = MUSICAL_PRESETS.find(item => item.id === presetId)
  const bassPatternA = BASS_PATTERNS[presetId] ?? null
  const bassEnabledA = !!bassPatternA && (bassChoiceA === 'auto' ? bassPatternA.defaultEnabled : bassChoiceA === 'on')
  const bassEventsA = bassEnabledA ? bassPatternA.events : null
  const recommendedInstrumentA = recommendedInstrument(selectedPreset)
  // B has no preset selector: its free/Clave pattern retains the current kit by default.
  const recommendedInstrumentB = 'acoustic'
  const instrumentA = instrumentChoiceA === 'auto' ? recommendedInstrumentA : instrumentChoiceA
  const instrumentB = instrumentChoiceB === 'auto' ? recommendedInstrumentB : instrumentChoiceB
  const [instrumentStatus, setInstrumentStatus] = useState({})
  useEffect(() => audioEngine.subscribeInstrumentStatus(setInstrumentStatus), [])
  const retryInstrument = useCallback(track => audioEngine.retryInstrument(track), [])
  const [storedStrokesA, setStrokesA] = useState(null)

  const [storedSubdivisionA, setSubdivisionA] = useState(1)
  const subdivisionA = numA * storedSubdivisionA <= 32 && denA * storedSubdivisionA <= 32 ? storedSubdivisionA : 1
  const gridCountA = numA * subdivisionA
  const strokesA = useMemo(() => storedStrokesA
    ? Array.from({ length: gridCountA }, (_, i) => storedStrokesA[i] ?? null)
    : null, [storedStrokesA, gridCountA])
  useEffect(() => {
    if (subdivisionA !== storedSubdivisionA) setSubdivisionA(1)
  }, [subdivisionA, storedSubdivisionA])

  // Estado Visual en Tiempo Real (vía rAF)
  const [currentBeatA, setCurrentBeatA] = useState(-1)
  const [currentBeatB, setCurrentBeatB] = useState(-1)
  const [progressA, setProgressA] = useState(0)
  const [progressB, setProgressB] = useState(0)
  const [audioTime, setAudioTime] = useState(0)

  const rafRef = useRef(null)
  const playbackRequestRef = useRef(0)
  const playbackRequestedRef = useRef(false)
  const scheduledNotesRef = useRef(audioEngine.scheduledNotes)

  // Una posición por subdivisión, sin cambiar la métrica escrita.
  const accentsA = useMemo(() => Array.from({ length: gridCountA }, (_, i) => storedAccentsA[i] ?? 0), [storedAccentsA, gridCountA])
  const accentsB = useMemo(() => Array.from({ length: numB }, (_, i) => storedAccentsB[i] ?? 0), [storedAccentsB, numB])

  // Normalizar array de acentos A cuando cambia numA
  useEffect(() => {
    setAccentsA(prev => {
      const copy = [...prev]
      if (copy.length < gridCountA) {
        return [...copy, ...Array(gridCountA - copy.length).fill(0)]
      }
      if (copy.length > gridCountA) {
        return copy.slice(0, gridCountA)
      }
      return copy
    })
  }, [gridCountA])

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

  const beforeClaveRef = useRef(null)
  useEffect(() => {
    if (mode === 'clave') {
      if (!beforeClaveRef.current) beforeClaveRef.current = { numB, denB, accentsB: [...accentsB] }
      const pattern = CLAVE_PATTERNS[claveIndex]?.pat || CLAVE_PATTERNS[0].pat
      setNumB(pattern.length)
      setAccentsB([...pattern])
      setDenB(8)
    } else if (mode !== 'clave' && beforeClaveRef.current) {
      const saved = beforeClaveRef.current
      beforeClaveRef.current = null
      setNumB(saved.numB); setDenB(saved.denB); setAccentsB(saved.accentsB)
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
    return calculateTiming({ bpm, numA, denA, numB, denB, mode, claveMeasures, subdivisionA })
  }, [bpm, numA, denA, numB, denB, mode, claveIndex, subdivisionA])

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
      instrumentA, instrumentB, strokesA,
      bassEventsA, bassEventsB: null,
    })
  }, [level, mode, timing, accentsA, accentsB, volumeA, volumeB, morphAmount, metronome, instrumentA, instrumentB, strokesA, bassEventsA])

  // Loop de Animación Visual Sincronizado (rAF)
  const updateRealtimeState = useCallback(() => {
    if (!audioEngine.ctx) return
    const audioTime = audioEngine.getCurrentAudioTime()
    setAudioTime(audioTime)
    scheduledNotesRef.current = audioEngine.scheduledNotes
    const { accentsA: currentA, accentsB: currentB, stepA, stepB } = audioEngine.params
    const notes = audioEngine.scheduledNotes
    const preserveA = audioEngine.transportState === 'paused' ||
      (audioEngine.resumePhaseUntilA !== null && audioTime < audioEngine.resumePhaseUntilA)
    const preserveB = audioEngine.transportState === 'paused' ||
      (audioEngine.resumePhaseUntilB !== null && audioTime < audioEngine.resumePhaseUntilB)
    const visualA = getTrackVisualState(
      notes, 'A', audioTime, stepA, currentA.length, audioEngine.startTime,
      audioEngine.nextNoteTimeA, audioEngine.stepCountA, preserveA,
    )
    const visualB = getTrackVisualState(
      notes, 'B', audioTime, stepB, currentB.length, audioEngine.startTime,
      audioEngine.nextNoteTimeB, audioEngine.stepCountB, preserveB,
    )
    setProgressA(Math.max(0, Math.min(1, visualA.progress)))
    setProgressB(Math.max(0, Math.min(1, visualB.progress)))
    setCurrentBeatA(visualA.beat)
    setCurrentBeatB(visualB.beat)
  }, [])

  const runAnimationLoop = useCallback(() => {
    let lastVisualTime = -Infinity
    const loop = () => {
      if (!audioEngine.isPlaying || !audioEngine.ctx) {
        rafRef.current = null
        return
      }

      // Presentation only: at most 30 React updates/s, positioned by the audio clock.
      const now = audioEngine.getCurrentAudioTime()
      if (!document.hidden && now - lastVisualTime >= 1 / 30 - 0.001) {
        lastVisualTime = now
        updateRealtimeState()
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [updateRealtimeState])

  const startPlayback = useCallback(async () => {
    if (playbackRequestedRef.current) return
    playbackRequestedRef.current = true
    const request = ++playbackRequestRef.current
    try {
      setAudioError(null)
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
        instrumentA, instrumentB, strokesA,
        bassEventsA, bassEventsB: null,
      })
      if (request !== playbackRequestRef.current || !audioEngine.isPlaying) return
      setTransportState('playing')
      runAnimationLoop()
    } catch (err) {
      if (request !== playbackRequestRef.current) return
      playbackRequestedRef.current = false
      setTransportState(audioEngine.transportState)
      setAudioError('No se pudo iniciar la percusión acústica. Comprobá la conexión y volvé a intentar.')
    }
  }, [
    level, mode, timing, accentsA, accentsB, volumeA, volumeB, morphAmount, metronome, instrumentA, instrumentB, strokesA, bassEventsA,
    runAnimationLoop,
  ])

  const stopPlayback = useCallback(() => {
    playbackRequestRef.current++
    playbackRequestedRef.current = false
    audioEngine.stop()
    setTransportState('stopped')
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setCurrentBeatA(-1)
    setCurrentBeatB(-1)
    setProgressA(0)
    setProgressB(0)
    setAudioTime(audioEngine.getCurrentAudioTime())
    scheduledNotesRef.current = audioEngine.scheduledNotes
  }, [])

  const pausePlayback = useCallback(async () => {
    if (audioEngine.transportState !== 'playing') return
    const request = ++playbackRequestRef.current
    playbackRequestedRef.current = false
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    try {
      await audioEngine.pause()
      if (request !== playbackRequestRef.current || audioEngine.transportState !== 'paused') return
      updateRealtimeState()
      setTransportState('paused')
    } catch (err) {
      if (request !== playbackRequestRef.current) return
      if (audioEngine.isPlaying) {
        playbackRequestedRef.current = true
        setTransportState('playing')
        runAnimationLoop()
      }
      console.error('Error al pausar audio:', err)
    }
  }, [runAnimationLoop, updateRealtimeState])

  const togglePlayback = useCallback(() => {
    if (playbackRequestedRef.current) {
      if (audioEngine.isPlaying) pausePlayback()
      else stopPlayback()
    } else {
      startPlayback()
    }
  }, [pausePlayback, startPlayback, stopPlayback])

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

  // Reset preserves running/stopped intent, but cancels all old voices first.
  const resetPlayback = useCallback(() => {
    const resume = playbackRequestedRef.current
    stopPlayback()
    if (resume) startPlayback()
  }, [stopPlayback, startPlayback])

  const applyPreset = useCallback(id => {
    const preset = MUSICAL_PRESETS.find(item => item.id === id)
    if (!preset) return
    setPresetId(id)
    setStrokesA(preset.events ? preset.events.map((events, i) => ({ events, referenceAccent: preset.accents[i] })) : preset.strokes ?? null)
    setSubdivisionA(preset.subdivision ?? 1)
    setNumA(preset.num)
    setDenA(preset.den)
    setAccentsA([...preset.accents])
    setGroupingA(preset.grouping)
    setBpm(preset.bpm)
  }, [setNumA, setDenA, setAccentsA, setGroupingA, setBpm])
  const preset = MUSICAL_PRESETS.find(item => item.id === presetId)
  const presetLocked = !!preset
  const clearPreset = useCallback(() => setPresetId(''), [])
  const editSubdivisionA = useCallback(value => {
    if (!presetLocked && [1, 2, 3, 4].includes(value) && numA * value <= 32 && denA * value <= 32) setSubdivisionA(value)
  }, [presetLocked, numA, denA])
  const gridGroupingA = useMemo(() => activeGroupingA?.map(size => size * subdivisionA) ?? null, [activeGroupingA, subdivisionA])
  const editNumA = useManualPatternSetter(setNumA, presetLocked)
  const editDenA = useManualPatternSetter(setDenA, presetLocked)
  const editAccentsA = useManualPatternSetter(setAccentsA, presetLocked)
  const editGroupingA = useManualPatternSetter(setGroupingA, presetLocked)
  const beatLabelsA = useMemo(() => subdivisionA > 1
    ? Array.from({ length: gridCountA }, (_, i) => `${Math.floor(i / subdivisionA) + 1}${i % subdivisionA ? (subdivisionA === 2 ? '&' : (subdivisionA === 3 ? ['', '-ta', '-la'] : ['', 'e', '&', 'a'])[i % subdivisionA]) : ''}`)
    : preset?.labels?.length === numA && denA === preset.den ? preset.labels : null,
  [subdivisionA, gridCountA, preset, numA, denA])
  const presetModified = !!preset && (numA !== preset.num || denA !== preset.den || bpm !== preset.bpm ||
    groupingA !== preset.grouping || accentsA.some((value, index) => value !== preset.accents[index]))

  // Descripción sonora pedagógica "¿Qué escuchas?"
  const audioDescription = useMemo(() => {
    const accentsCountA = accentsA.filter(a => a > 0).length
    const strongA = accentsA
      .map((acc, i) => (acc === 2 ? beatLabelsA?.[i] ?? i + 1 : null))
      .filter(Boolean)

    const durCompasA = ((60 / bpm) * numA * (4 / denA)).toFixed(2)
    const durNegra = (60 / bpm).toFixed(2)
    const noteNameA = NOTE_NAMES[denA] || `${denA}va`

    let desc = `Compás A: ${numA} pulsos de ${noteNameA}, ${accentsCountA} acentos${
      strongA.length ? ` en ${strongA.join(', ')}` : ''
    }. Duración de compás: ${durCompasA}s (negra: ${durNegra}s).`

    if (subdivisionA > 1) desc += ` Rejilla A: ${gridCountA} posiciones iguales (${subdivisionA} por unidad de 1/${denA}).`
    if (level === 2) {
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

    return desc
  }, [
    numA,
    denA,
    subdivisionA, gridCountA,
    accentsA,
    beatLabelsA,
    bpm,
    level,
    numB,
    denB,
    accentsB,
    mode,
    timing,
    morphAmount,
    claveIndex,
  ])

  const value = useMemo(() => ({
    instrumentChoiceA, setInstrumentChoiceA, instrumentChoiceB, setInstrumentChoiceB,
    bassChoiceA, setBassChoiceA, bassPatternA, bassEnabledA,
    instrumentA, instrumentB, recommendedInstrumentA, recommendedInstrumentB,
    instrumentStatus, retryInstrument, strokesA,
    bpm,
    setBpm,
    isPlaying,
    transportState,
    togglePlayback,
    startPlayback,
    pausePlayback,
    stopPlayback,
    resetPlayback, audioError, applyPreset, clearPreset, presetId, presetLocked, presetModified, beatLabelsA,
    level,
    setLevel,

    // Track A
    subdivisionA, setSubdivisionA: editSubdivisionA, gridCountA, gridGroupingA,
    numA,
    setNumA: editNumA,
    denA,
    setDenA: editDenA,
    accentsA,
    setAccentsA: editAccentsA,
    groupingA,
    setGroupingA: editGroupingA,
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
    reduceMotion,
    metronome,
    setMetronome,

    timing,
    audioDescription,

  }), [
    instrumentChoiceA, setInstrumentChoiceA, instrumentChoiceB, setInstrumentChoiceB,
    bassChoiceA, setBassChoiceA, bassPatternA, bassEnabledA,
    instrumentA, instrumentB, recommendedInstrumentA, recommendedInstrumentB,
    instrumentStatus, retryInstrument, strokesA,
    bpm, setBpm, isPlaying, transportState, togglePlayback, startPlayback, pausePlayback, stopPlayback, level, setLevel,
    subdivisionA, editSubdivisionA, gridCountA, gridGroupingA, numA, editNumA, denA, editDenA, accentsA, editAccentsA, groupingA, editGroupingA,
    volumeA, setVolumeA, parsedGroupingA, isValidGroupingA, activeGroupingA,
    groupingStatusA, groupingFeedbackA, suggestionsA, numB, setNumB, denB, setDenB,
    accentsB, setAccentsB, groupingB, setGroupingB, volumeB, setVolumeB, parsedGroupingB,
    isValidGroupingB, activeGroupingB, groupingStatusB, groupingFeedbackB, suggestionsB,
    mode, setMode, morphAmount, setMorphAmount, claveIndex, setClaveIndex,
    reduceMotion, metronome, setMetronome, timing,
    audioDescription, resetPlayback, audioError, applyPreset, clearPreset, presetId, presetLocked, presetModified, beatLabelsA,
  ])

  const realtimeValue = useMemo(() => ({
    currentBeatA,
    currentBeatB,
    progressA,
    progressB,
    audioTime,
    scheduledNotes: scheduledNotesRef.current,
  }), [currentBeatA, currentBeatB, progressA, progressB, audioTime])

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
