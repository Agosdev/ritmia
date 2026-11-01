import React, { lazy, Suspense, useState } from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { useSystemReducedMotion } from '../../hooks/useSystemReducedMotion'
import { LiteRhythmVisualizer } from './LiteRhythmVisualizer'

const Bounce = lazy(() => import('./physical/BounceVisualizer'))
const Orbit = lazy(() => import('./physical/OrbitVisualizer'))
const Container = styled.div`
  min-width: 0;
  align-self: start;
`
const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: .6rem;
  padding: 0 .25rem .25rem;
  label { display: grid; gap: .125rem; font-size: 11px; color: ${({ theme }) => theme.colors.textDim}; flex: 1; }
  select { border-radius: 12px; padding: .5rem; width: 100%; }
  button { font-size: 11px; padding: .5rem .7rem; border-radius: 12px; }
`
const Stage = styled.section`
  min-width: 0;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: 28px;
  background: ${({ theme }) => theme.colors.panel};
  box-shadow: ${({ theme }) => theme.physical.shell};
  h2 { font-size: 14px; }
  > div:first-child { display: flex; justify-content: space-between; gap: .5rem; flex-wrap: wrap; }
  p { font-size: 11px; color: ${({ theme }) => theme.colors.textDim}; }
  canvas { display: block; width: 100%; height: auto; aspect-ratio: 3 / 2; border-radius: 20px; }
  footer { display: flex; flex-wrap: wrap; gap: .5rem 1rem; font-size: 11px; color: ${({ theme }) => theme.colors.textDim}; }
`
class VisualBoundary extends React.Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed
      ? <p role="alert">No se pudo cargar el visualizador. Selecciona Clásico para continuar.</p>
      : this.props.children
  }
}

export function OptionalMusicVisualizer({ showTrackB, showGrouping, reduceMotion }) {
  const [enabled, setEnabled] = useState(false)
  const [mode, setMode] = useState('bounce')
  const { numA, denA, numB, denB, transportState } = useRitmia()
  const systemReduced = useSystemReducedMotion()
  const reduced = reduceMotion || systemReduced
  const name = mode === 'orbit' ? 'Órbita 3D' : 'Rebote 2D'
  const View = mode === 'orbit' ? Orbit : Bounce
  return <Container>
    <Controls role="group" aria-label="Visualizadores musicales">
      <label>
        Visualizador
        <select aria-label="Tipo de visualizador" aria-controls="music-visual-stage" value={enabled ? mode : 'classic'} onChange={event => {
          if (event.target.value === 'classic') setEnabled(false)
          else { setMode(event.target.value); setEnabled(true) }
        }}>
          <option value="classic">Clásico</option>
          <option value="bounce">Rebote 2D</option>
          <option value="orbit">Órbita 3D</option>
        </select>
      </label>
      <button type="button" aria-pressed={enabled} aria-controls="music-visual-stage" onClick={() => setEnabled(value => !value)}>
        {enabled ? 'Desactivar visualizador especial' : 'Activar visualizador especial'}
      </button>
    </Controls>
    <div id="music-visual-stage">
      {!enabled ? <LiteRhythmVisualizer showTrackB={showTrackB} showGrouping={showGrouping} reduceMotion={reduced} />
        : <Stage aria-label={name}>
          <div><h2>{name}</h2><p role="status">{transportState === 'playing' ? 'Reproduciendo' : transportState === 'paused' ? 'En pausa' : 'Patrón en reposo'}</p></div>
          <VisualBoundary key={mode}>
            <Suspense fallback={<p role="status">Cargando {name}…</p>}>
              <View showTrackB={showTrackB} reduceMotion={reduced} />
            </Suspense>
          </VisualBoundary>
          <footer><span>A · {numA}/{denA}{mode === 'orbit' ? ' · anillo interior' : ''}</span>{showTrackB && <span>B · {numB}/{denB}{mode === 'orbit' ? ' · anillo exterior' : ''}</span>}<span>Impacto: golpe · sin impacto: silencio o volumen cero</span></footer>
          {reduced && <p>Movimiento reducido: escena estable, sin rebotes ni rotación decorativa.</p>}
        </Stage>}
    </div>
  </Container>
}
