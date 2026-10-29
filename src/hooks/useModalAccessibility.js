import { useLayoutEffect } from 'react'
import { useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useModalAccessibility(dialogRef, onClose, isOpen) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useLayoutEffect(() => {
    if (!isOpen) return undefined

    const dialog = dialogRef.current
    if (!dialog) return undefined

    const previouslyFocused = document.activeElement
    const background = []
    let current = dialog.parentElement
    while (current && current !== document.body) {
      const parent = current.parentElement
      if (!parent) break
      background.push(...[...parent.children].filter(element => element !== current))
      current = parent
    }
    const priorInert = background.map(element => element.hasAttribute('inert'))
    background.forEach(element => element.setAttribute('inert', ''))

    const focusable = () => [...dialog.querySelectorAll(FOCUSABLE)]
      .filter(element => !element.closest('[aria-hidden="true"]'))
    const initialTarget = focusable()[0] ?? dialog
    initialTarget.focus()

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const items = focusable()
      if (items.length === 0) {
        event.preventDefault()
        dialog.focus()
      } else if (event.shiftKey && document.activeElement === items[0]) {
        event.preventDefault()
        items.at(-1).focus()
      } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
        event.preventDefault()
        items[0].focus()
      }
    }

    const keepFocusInside = event => {
      if (!dialog.contains(event.target)) initialTarget.focus()
    }

    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('focusin', keepFocusInside, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('focusin', keepFocusInside, true)
      background.forEach((element, index) => {
        if (priorInert[index]) element.setAttribute('inert', '')
        else element.removeAttribute('inert')
      })
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus()
      }
    }
  }, [dialogRef, isOpen])
}
