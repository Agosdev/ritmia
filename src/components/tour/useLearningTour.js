import { useCallback, useEffect, useRef, useState } from 'react'
import { MAIN_TOUR_STEPS, TOUR_STORAGE_KEYS, TWO_TRACK_TOUR_STEPS } from './tourSteps'

const getStorage = key => {
  try { return window.localStorage.getItem(key) } catch { return '1' }
}
const setStorage = key => {
  try { window.localStorage.setItem(key, '1') } catch { /* Private browsing may disable storage. */ }
}

export function useLearningTour({ level, setLevel }) {
  const [invitation, setInvitation] = useState(false)
  const [offerTwoTracks, setOfferTwoTracks] = useState(false)
  const [flow, setFlow] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [position, setPosition] = useState(null)
  const panelRef = useRef(null)
  const openerRef = useRef(null)
  const restoreOnCloseRef = useRef(false)
  const targetRef = useRef(null)
  const active = flow !== null
  const steps = flow === 'main' ? MAIN_TOUR_STEPS : flow === 'two-tracks' ? TWO_TRACK_TOUR_STEPS : []
  const currentStep = steps[stepIndex]

  useEffect(() => {
    if (getStorage(TOUR_STORAGE_KEYS.dismissed) || getStorage(TOUR_STORAGE_KEYS.completed)) return
    setInvitation(true)
  }, [])

  const close = useCallback(({ remember = true, restoreFocus = true } = {}) => {
    if (remember) setStorage(TOUR_STORAGE_KEYS.dismissed)
    restoreOnCloseRef.current = restoreFocus
    setFlow(null)
    setInvitation(false)
    setOfferTwoTracks(false)
    setPosition(null)
  }, [])

  const startMain = useCallback(event => {
    const trigger = event?.currentTarget
    openerRef.current = trigger?.closest('[role="region"]')
      ? document.querySelector('[aria-label="Ayuda"]')
      : trigger ?? document.activeElement
    restoreOnCloseRef.current = true
    setInvitation(false)
    setOfferTwoTracks(false)
    setStepIndex(0)
    setFlow('main')
  }, [])

  const startTwoTracks = useCallback(() => {
    openerRef.current = document.activeElement
    restoreOnCloseRef.current = true
    setOfferTwoTracks(false)
    setStepIndex(0)
    // This is an explicit user choice; the tour never changes levels on its own.
    setLevel(2)
    setFlow('two-tracks')
  }, [setLevel])

  const next = useCallback(() => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(index => index + 1)
      return
    }
    if (flow === 'main') {
      setStorage(TOUR_STORAGE_KEYS.completed)
      setFlow(null)
      setOfferTwoTracks(true)
      setPosition(null)
      return
    }
    setStorage(TOUR_STORAGE_KEYS.completed)
    close({ remember: false })
  }, [close, flow, stepIndex, steps.length])

  const previous = useCallback(() => setStepIndex(index => Math.max(0, index - 1)), [])

  const dismissInvitation = useCallback(() => {
    setStorage(TOUR_STORAGE_KEYS.dismissed)
    setInvitation(false)
  }, [])

  const acceptOffer = useCallback(() => {
    setOfferTwoTracks(false)
  }, [])

  useEffect(() => {
    // Only the active tour owns Escape. The first-visit invitation and the
    // optional follow-up remain non-modal regions and must not steal shortcuts.
    if (!active) return undefined
    const onKeyDown = event => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      close()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [active, close])

  useEffect(() => {
    if (active || invitation || offerTwoTracks) return undefined
    if (!restoreOnCloseRef.current) return undefined
    restoreOnCloseRef.current = false
    const opener = openerRef.current
    requestAnimationFrame(() => {
      const destination = opener?.isConnected ? opener : document.querySelector('[aria-label="Ayuda"]')
      destination?.focus({ preventScroll: true })
    })
    return undefined
  }, [active, invitation, offerTwoTracks])

  useEffect(() => {
    if (!active || !currentStep) return undefined
    let frame = 0
    let cancelled = false
    const place = () => {
      if (cancelled) return
      const target = document.querySelector(`[data-tour-target="${currentStep.target}"]`)
      const panel = panelRef.current
      if (!target || !panel) {
        if (frame < 8) {
          frame += 1
          requestAnimationFrame(place)
        } else if (stepIndex < steps.length - 1) setStepIndex(index => index + 1)
        else {
          setStorage(TOUR_STORAGE_KEYS.completed)
          close({ remember: false })
        }
        return
      }
      targetRef.current?.removeAttribute('data-tour-highlight')
      target.setAttribute('data-tour-highlight', 'true')
      targetRef.current = target
      target.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'auto' })

      const viewport = window.visualViewport
      const width = viewport?.width ?? window.innerWidth
      const height = viewport?.height ?? window.innerHeight
      const offsetTop = viewport?.offsetTop ?? 0
      const targetRect = target.getBoundingClientRect()
      const panelRect = panel.getBoundingClientRect()
      const dockRect = document.querySelector('[data-testid="lite-mobile-transport"]')?.getBoundingClientRect()
      if (width <= 600) {
        const headerBottom = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0
        const availableBottom = Math.min(dockRect?.top ?? height, height + offsetTop) - 12
        const availableTop = Math.max(headerBottom + offsetTop + 8, offsetTop + 8)
        const freeTop = availableBottom - panelRect.height
        const desiredTargetCenter = (availableTop + Math.max(availableTop, freeTop)) / 2
        if (targetRect.top < availableTop || targetRect.bottom > freeTop) {
          window.scrollBy({ top: targetRect.top + targetRect.height / 2 - desiredTargetCenter, behavior: 'instant' })
        }
        setPosition({ left: 12, right: 12, top: Math.max(availableTop, freeTop), mobile: true })
      } else {
        const panelWidth = panelRect.width || 352
        const panelHeight = panelRect.height || 220
        const gap = 16
        const left = targetRect.right + gap + panelWidth <= width
          ? targetRect.right + gap
          : Math.max(12, targetRect.left - panelWidth - gap)
        const top = Math.min(Math.max(16, targetRect.top), Math.max(16, height - panelHeight - 16))
        setPosition({ left, top, right: 'auto', mobile: false })
      }
    }
    const timeout = window.setTimeout(() => requestAnimationFrame(place), 0)
    const reposition = () => requestAnimationFrame(place)
    window.addEventListener('resize', reposition)
    window.visualViewport?.addEventListener('resize', reposition)
    window.visualViewport?.addEventListener('scroll', reposition)
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
      window.removeEventListener('resize', reposition)
      window.visualViewport?.removeEventListener('resize', reposition)
      window.visualViewport?.removeEventListener('scroll', reposition)
      if (targetRef.current) {
        targetRef.current.removeAttribute('data-tour-highlight')
        targetRef.current = null
      }
    }
  }, [active, close, currentStep, level, stepIndex, steps.length])

  return {
    active, currentStep, flow, invitation, offerTwoTracks, panelRef, position, stepIndex, steps,
    startMain, startTwoTracks, next, previous, close, dismissInvitation, acceptOffer,
  }
}
