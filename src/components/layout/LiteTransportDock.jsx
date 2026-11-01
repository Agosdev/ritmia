import React, { useEffect } from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { MAX_BPM, MIN_BPM } from '../../music/constants'
import { Button } from '../ui/Button'

const Dock = styled.div`
  display: none;

  @media (max-width: 900px) {
    position: fixed;
    z-index: 45;
    inset-inline: 0;
    bottom: var(--lite-keyboard-inset, 0px);
    display: block;
    padding: 0.55rem 0.75rem calc(0.55rem + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.panel};
    box-shadow: 0 -4px 14px rgba(41, 52, 61, 0.12), 0 1px 0 #fff inset;
  }
`

const DockInner = styled.div`
  width: min(100%, 38rem);
  margin: 0 auto;
  display: grid;
  gap: 0.5rem;
`

const BpmControl = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(4rem, 1fr) 3.25rem;
  align-items: center;
  gap: 0.65rem;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`

const BpmRange = styled.input`
  width: 100%;
  min-width: 0;
`

const BpmNumber = styled.input`
  width: 3.25rem;
  height: 2rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.6rem;
  background: ${({ theme }) => theme.colors.panel2};
  box-shadow: inset 2px 2px 4px rgba(41, 52, 61, 0.12), inset -2px -2px 4px #fff;
  color: ${({ theme }) => theme.colors.textBright};
  text-align: center;
  font: 600 13px ${({ theme }) => theme.fonts.mono};
`

const Actions = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.45rem;

  button {
    min-width: 0;
    min-height: 2.75rem;
    padding: 0.4rem 0.5rem;
    white-space: nowrap;
    font-size: 11px;
  }
`

export function LiteTransportDock() {
  const { bpm, setBpm, transportState, startPlayback, pausePlayback, stopPlayback } = useRitmia()
  const isPlaying = transportState === 'playing'

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return undefined

    const updateKeyboardInset = () => {
      const bottom = Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height)
      document.documentElement.style.setProperty('--lite-keyboard-inset', `${bottom}px`)
    }

    updateKeyboardInset()
    viewport.addEventListener('resize', updateKeyboardInset)
    viewport.addEventListener('scroll', updateKeyboardInset)
    return () => {
      viewport.removeEventListener('resize', updateKeyboardInset)
      viewport.removeEventListener('scroll', updateKeyboardInset)
      document.documentElement.style.removeProperty('--lite-keyboard-inset')
    }
  }, [])

  return (
    <Dock data-testid="lite-mobile-transport">
      <DockInner role="group" aria-label="Controles de reproducción">
        <BpmControl>
          <span>BPM</span>
          <BpmRange
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={event => setBpm(parseInt(event.target.value, 10))}
            aria-label="Ajustar tempo BPM"
          />
          <BpmNumber
            type="number"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={event => {
              if (!event.target.value.trim()) return
              const value = Number(event.target.value)
              if (Number.isInteger(value)) setBpm(Math.min(MAX_BPM, Math.max(MIN_BPM, value)))
            }}
            aria-label="Valor numérico BPM"
          />
        </BpmControl>
        <Actions>
          <Button
            type="button"
            $variant="accent"
            onClick={startPlayback}
            aria-label={transportState === 'paused' ? 'Reanudar reproducción' : 'Iniciar reproducción'}
            aria-pressed={isPlaying}
          >
            {transportState === 'paused' ? '▶ Reanudar' : '▶ Reproducir'}
          </Button>
          <Button
            type="button"
            $variant="outline"
            onClick={pausePlayback}
            disabled={!isPlaying}
            aria-label="Pausar reproducción"
          >
            Ⅱ Pausar
          </Button>
          <Button
            type="button"
            $variant="outline"
            onClick={stopPlayback}
            disabled={transportState === 'stopped'}
            aria-label="Reiniciar ciclo"
          >
            ↺ Reiniciar
          </Button>
        </Actions>
      </DockInner>
    </Dock>
  )
}
