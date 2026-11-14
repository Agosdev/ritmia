import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { Button } from '../ui/Button'

const ErrorPanel = styled.div`
  position: fixed; z-index: 55; inset-inline: 1rem;
  bottom: calc(8.5rem + env(safe-area-inset-bottom, 0px) + var(--lite-keyboard-inset, 0px));
  width: min(calc(100% - 2rem), 26rem); margin-inline: auto;
  padding: .75rem; border-radius: 16px;
  background: ${({ theme }) => theme.colors.panel}; color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  box-shadow: ${({ theme }) => theme.physical.shell}; font-size: 12px;
  max-height: min(42vh, 20rem); overflow-y: auto;
  p { margin: 0 0 .5rem; }
  details { margin-top: .5rem; }
  summary { min-height: 40px; display: flex; align-items: center; cursor: pointer; }
  ul { margin: .2rem 0; padding-inline-start: 1.25rem; }
  li { margin: .25rem 0; }
`

const CloseNotice = styled.button`
  position: absolute; inset-inline-end: .55rem; inset-block-start: .4rem;
  width: 40px; height: 40px; border: 0; border-radius: 50%;
  color: inherit; background: transparent; font: inherit; font-size: 20px; cursor: pointer;
`

export function TransportActions() {
  const { transportState, togglePlayback, resetPlayback, audioError, startPlayback,
    audioInterrupted } = useRitmia()
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => setDismissed(false), [audioError, audioInterrupted])
  const playing = transportState === 'playing'
  const showIssue = Boolean(audioError || audioInterrupted)
  return <>
    {showIssue && !dismissed && <ErrorPanel role="alert" aria-live="assertive">
      <CloseNotice type="button" aria-label="Cerrar aviso de audio" onClick={() => setDismissed(true)}>×</CloseNotice>
      <p>{audioInterrupted ? 'El sonido se interrumpió.' : audioError}</p>
      {audioInterrupted
        ? <Button type="button" $variant="accent" onClick={startPlayback}>Reanudar sonido</Button>
        : <Button type="button" $variant="accent" onClick={startPlayback}>Volver a intentar</Button>}
      <details>
        <summary>¿No escuchás el ritmo?</summary>
        <ul>
          <li>Revisá los volúmenes de las pistas en Ritmia.</li>
          <li>Revisá el volumen físico del dispositivo.</li>
          <li>Usá «Reanudar sonido» si el navegador interrumpió el audio.</li>
          <li>Si falla un instrumento, usá «Reintentar» junto a su selector.</li>
        </ul>
        <p>Si lo anterior no funciona, podés recargar la página. Podrías perder cambios que todavía no guardaste.</p>
      </details>
    </ErrorPanel>}
    <Button data-action="play" type="button" $variant="accent" aria-label={playing ? 'Detener reproducción' : 'Reproducir'} aria-pressed={playing} onClick={togglePlayback}>
      <span className="transport-symbol" aria-hidden="true">{playing ? '■' : '▶'}</span>
      <span className="transport-text">{playing ? 'Detener' : 'Reproducir'}</span>
    </Button>
    <Button data-action="reset" type="button" $variant="outline" aria-label="Reiniciar ciclo" onClick={resetPlayback}><span className="transport-symbol" aria-hidden="true">↺</span><span className="transport-text">Reiniciar</span></Button>
  </>
}
