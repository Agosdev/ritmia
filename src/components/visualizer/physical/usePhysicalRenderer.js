import { useEffect, useRef, useState } from 'react'
import { audioEngine } from '../../../audio/AudioEngine'
import { readMusicFrame } from './musicFrame'
import { createRenderLoop } from './renderLoop'

export function usePhysicalRenderer(factory, options) {
  // Configuration subscription only; no 60-Hz realtime React subscription.
  const canvasRef = useRef(null)
  const state = useRef(options)
  state.current = options
  const controller = useRef(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const abort = new AbortController()
    let renderer
    let loop
    let observer
    const stats = { frames: 0, disposed: false, time: 0, tracks: [], renderMs: 0 }
    canvas.__ritmiaVisual = stats
    const size = () => {
      const rect = canvas.getBoundingClientRect()
      renderer?.resize(Math.max(1, rect.width), Math.max(1, rect.height))
      loop?.refresh()
    }
    const lost = event => {
      event.preventDefault()
      loop?.dispose()
      setError('Se perdió el contexto gráfico. Se muestra el visualizador 2D.')
    }
    const visibility = () => loop?.refresh()
    canvas.addEventListener('webglcontextlost', lost)
    Promise.resolve().then(() => factory(canvas, abort.signal)).then(value => {
      if (!value) return
      if (abort.signal.aborted) { value.dispose(); return }
      renderer = value
      loop = createRenderLoop({
        draw() {
          const snapshot = readMusicFrame(audioEngine, state.current)
          const start = performance.now()
          try { renderer.draw(snapshot) }
          catch {
            loop?.dispose()
            setError('No se pudo dibujar la escena. Puedes volver al clásico o usar 2D.')
            return
          }
          stats.frames++
          stats.time = snapshot.time
          stats.tracks = snapshot.tracks
          stats.renderMs = performance.now() - start
          stats.resources = renderer.resources?.()
        },
        isPlaying: () => audioEngine.isPlaying,
        isReduced: () => state.current.reduceMotion,
      })
      controller.current = loop
      observer = new ResizeObserver(size)
      observer.observe(canvas)
      document.addEventListener('visibilitychange', visibility)
      size()
    }).catch(() => {
      if (!abort.signal.aborted) setError('El renderizador no está disponible. Puedes volver al clásico o usar 2D.')
    })
    return () => {
      abort.abort()
      observer?.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      canvas.removeEventListener('webglcontextlost', lost)
      loop?.dispose()
      renderer?.dispose()
      controller.current = null
      stats.disposed = true
      stats.resourcesDisposed = true
    }
  }, [factory])
  useEffect(() => { controller.current?.refresh() })
  return { canvasRef, error }
}
