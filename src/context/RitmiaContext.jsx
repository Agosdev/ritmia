import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { calculateTiming } from '../music/timingCalculator'
import { parseGrouping, isGroupingValid, getGroupingSuggestions } from '../music/groupingSuggestions'
import { CLAVE_PATTERNS } from '../music/clavePatterns'
import { NOTE_NAMES, MAX_NUM } from '../music/constants'
import { audioEngine } from '../audio/AudioEngine'

const RitmiaContext = createContext(null)

export function RitmiaProvider({ children }) {
  // Configuración de Tempo y Reproducción
  const [bpm, setBpm] = useState(92)
  const [isPlaying, setIsPlaying] = useState(false)
  const [level, setLevel] = useState(1)

  // Compás A
  const [numA, setNumA] = useState(7)
  const [denA, setDenA] = useState(8)
  const [accentsA, setAccentsA] = useState([2, 0, 1, 0, 1, 0, 0])
  const [groupingA, setGroupingA] = useState('3+2+2')
  const [volumeA, setVolumeA] = useState(1)

  // Compás B
  const [numB, setNumB] = useState(5)
  const [denB, setDenB] = useState(8)
  const [accentsB, setAccentsB] = useState([2, 0, 1, 0, 1])
  const [groupingB, setGroupingB] = useState('3+2')
  const [volumeB, setVolumeB] = useState(1)

  // Modos de Nivel 3
  const [mode, setMode] = useState('polirritmia')
  const [morphAmount, setMorphAmount] = useState(0.5)
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
  const audioStartTimeRef = useRef(0)

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

  const isValidGroupingA = useMemo(
    () => (parsedGroupingA ? isGroupingValid(parsedGroupingA, numA) : true),
    [parsedGroupingA, numA]
  )

  const isValidGroupingB = useMemo(
    () => (parsedGroupingB ? isGroupingValid(parsedGroupingB, numB) : true),
    [parsedGroupingB, numB]
  )

  const timing = useMemo(
    () => calculateTiming({ bpm, numA, denA, numB, denB, mode }),
    [bpm, numA, denA, numB, denB, mode]
  )

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
        return
      }

      const audioTime = audioEngine.getCurrentAudioTime()
      const elapsed = audioTime - audioStartTimeRef.current

      const progA = timing.measureA ? (elapsed % timing.measureA) / timing.measureA : 0
      const progB = timing.measureB ? (elapsed % timing.measureB) / timing.measureB : 0

      setProgressA(Math.max(0, Math.min(1, progA)))
      setProgressB(Math.max(0, Math.min(1, progB)))

      let beatA = -1
      let beatB = -1
      const hitWindow = 0.05 // 50ms ventana de impacto visual

      const notes = audioEngine.scheduledNotes
      for (let i = notes.length - 1; i >= 0; i--) {
        const n = notes[i]
        if (Math.abs(n.time - audioTime) < hitWindow) {
          // Si safeMode está activo y el tempo es alto (>130 BPM), solo iluminar acentos fuertes (2)
          if (safeMode && bpm > 130 && n.accent !== 2) continue

          if (n.type === 'A' && beatA === -1) beatA = n.pos
          if (n.type === 'B' && beatB === -1) beatB = n.pos
        }
      }

      setCurrentBeatA(beatA)
      setCurrentBeatB(beatB)

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [timing, safeMode, bpm])

  const startPlayback = async () => {
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
      audioStartTimeRef.current = audioEngine.startTime
      setIsPlaying(true)
      runAnimationLoop()
    } catch (err) {
      console.error('Error al iniciar audio:', err)
    }
  }

  const stopPlayback = () => {
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
  }

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback()
    } else {
      startPlayback()
    }
  }

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      audioEngine.stop()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Modales & Test de lectura
  const openTest = () => {
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
      const desc = parsedGroupingA ? parsedGroupingA.join('+') : '—'
      const count = parsedGroupingA?.length ?? 1
      setTestData({
        q: `Con agrupación ${desc} sobre ${numA}/${denA}, ¿cuántos grupos hay?`,
        a: `${count}`,
        options: [`${count}`, `${count + 1}`, `${Math.max(1, count - 1)}`],
      })
    } else {
      const pDesc =
        mode === 'polimetria'
          ? `Polimetría ${numA}/${denA} vs ${numB}/${denB}: reencuentro cada ${timing.reunionA} compases de A`
          : `Polirritmia ratio ${timing.ticksA}:${timing.ticksB}`
      setTestData({
        q: `En modo ${mode}, ¿qué describe mejor este ritmo?`,
        a: pDesc,
        options: [pDesc, 'Un solo compás simétrico', 'Tempo rubato libre'],
      })
    }
    setTestFeedback(null)
    setIsTestOpen(true)
  }

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
      desc += ` | Compás B: ${numB} de ${NOTE_NAMES[denB] || denB} con ${accentsCountB} acentos.`

      if (mode === 'polirritmia') {
        desc += ` Ambos compases encajan en ${durCompasA}s (ratio ${timing.ticksA}:${timing.ticksB}, B estirado/comprimido).`
      } else if (mode === 'polimetria') {
        desc += ` Duraciones métricas independientes: A ${timing.measureA.toFixed(2)}s, B ${timing.measureB.toFixed(2)}s. Reencuentro cada ${timing.reunionA}×A / ${timing.reunionB}×B.`
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

  const value = {
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

    // Realtime Visuals
    currentBeatA,
    currentBeatB,
    progressA,
    progressB,
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
  }

  return <RitmiaContext.Provider value={value}>{children}</RitmiaContext.Provider>
}

export function useRitmia() {
  const context = useContext(RitmiaContext)
  if (!context) {
    throw new Error('useRitmia debe ser utilizado dentro de un RitmiaProvider')
  }
  return context
}
