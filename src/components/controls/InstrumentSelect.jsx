import React, { useId } from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { INSTRUMENTS } from '../../audio/instrumentCatalog'

const Control = styled.div`
  margin: .6rem 0;
  min-width: 0;
  label { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem .7rem; font-size: 12px; }
  select { flex: 1 1 180px; width: 100%; max-width: 100%; min-width: 0; border-radius: 12px; padding: .4rem; font: inherit; }
  small { display: block; margin-top: .3rem; color: ${({ theme }) => theme.colors.textDim}; font-size: 11px; line-height: 1.5; }
  a { color: inherit; text-decoration: underline; }
  p { font-size: 12px; }
`

export function InstrumentSelect({ track }) {
  const id = useId()
  const context = useRitmia()
  const choice = context[`instrumentChoice${track}`]
  const setChoice = context[`setInstrumentChoice${track}`]
  const recommended = context[`recommendedInstrument${track}`]
  const kit = INSTRUMENTS[context[`instrument${track}`]]
  const status = context.instrumentStatus[track]
  return <Control>
    <label htmlFor={id}>Instrumento pista {track}
      <select id={id} aria-label={`Instrumento pista ${track}`} value={choice}
        onChange={e => setChoice(e.target.value)} aria-describedby={`${id}-status`}>
        <option value="auto">Automático (recomendado) · {INSTRUMENTS[recommended].name}</option>
        {Object.entries(INSTRUMENTS).map(([key, instrument]) => <option key={key} value={key}>{instrument.name}</option>)}
      </select>
    </label>
    <small id={`${id}-status`} role="status" aria-label={`Estado instrumento ${track}`}>
      {status?.error ?? (status?.loading ? `Preparando ${kit.name}; continúa el instrumento anterior.` : `${choice === 'auto' ? 'Automático' : 'Manual'} · ${kit.name}`)}
    </small>
    {status?.error && <button type="button" onClick={() => context.retryInstrument(track)}>Reintentar instrumento {track}</button>}
    {track === 'A' && context.bassPatternA && <>
      <label htmlFor={`${id}-bass`}>Acompañamiento A
        <select id={`${id}-bass`} aria-label="Acompañamiento de bajo pista A" value={context.bassChoiceA}
          onChange={event => context.setBassChoiceA(event.target.value)} aria-describedby={`${id}-bass-status`}>
          <option value="auto">Automático (recomendado)</option>
          <option value="on">Batería + bajo eléctrico</option>
          <option value="off">Solo percusión</option>
        </select>
      </label>
      <small id={`${id}-bass-status`} role="status" aria-label="Estado bajo pista A">
        {status?.bassError ?? (status?.bassLoading ? 'Preparando bajo eléctrico…' : context.bassEnabledA
          ? `Bajo en ${context.bassPatternA.key}; patrón independiente del bombo.`
          : `Solo percusión; bajo disponible en ${context.bassPatternA.key}.`)}
      </small>
    </>}
    {kit.attribution && <small>
      Hi-hat/platillos: Lars Muldjord · <a href="https://freepats.zenvoid.org/Percussion/acoustic-drum-kit.html">FreePats</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Mono, recorte y nivel ajustados. Drum samples provided by DrumGizmo.org.
    </small>}
    {kit.note && <small>{kit.note}</small>}
  </Control>
}
