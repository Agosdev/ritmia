import React from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { Button } from '../ui/Button'
import { Toggle } from '../ui/Toggle'

const ErrorPanel = styled.div`
  position: fixed; z-index: 55; inset-inline: 1rem;
  bottom: calc(12rem + env(safe-area-inset-bottom, 0px));
  width: min(calc(100% - 2rem), 26rem); margin-inline: auto;
  padding: .75rem; border-radius: 16px;
  background: ${({ theme }) => theme.colors.panel}; color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  box-shadow: ${({ theme }) => theme.physical.shell}; font-size: 12px;
  p { margin-bottom: .5rem; }
  @media (min-width: 901px) { bottom: 1rem; }
`

export function TransportActions({ id }) {
  const { transportState, togglePlayback, resetPlayback, metronome, setMetronome, audioError, startPlayback } = useRitmia()
  const playing = transportState === 'playing'
  return <>
    {audioError && <ErrorPanel role="alert"><p>{audioError}</p><Button onClick={startPlayback}>Reintentar audio</Button></ErrorPanel>}
    <Button type="button" $variant="accent" aria-label={playing ? 'Detener reproducción' : 'Reproducir'} aria-pressed={playing} onClick={togglePlayback}>
      {playing ? '■ Detener' : '▶ Reproducir'}
    </Button>
    <Button type="button" $variant="outline" aria-label="Reiniciar ciclo" onClick={resetPlayback}>↺ Reiniciar</Button>
    <Toggle id={`${id}-cycle-marker`} label="Marcar inicio de compás" checked={metronome} onChange={setMetronome} />
  </>
}
