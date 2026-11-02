import React, { useState } from 'react'
import styled from 'styled-components'
import { MUSICAL_PRESETS } from '../../music/presets'
import { useRitmia } from '../../context/RitmiaContext'
const Box = styled.div`
  min-width: 0; flex: 1 1 20rem; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: .4rem; font-size: 11px;
  select { max-width: 100%; min-width: 0; width: 100%; border-radius: 12px; padding: .35rem; }
  button { font-size: 12px; padding: .35rem .6rem; }
  p { grid-column: 1 / -1; font-size: 11px; color: ${({theme}) => theme.colors.textDim}; }
`
export function MusicalPresets() {
  const { applyPreset, presetId, presetModified } = useRitmia()
  const [choice, setChoice] = useState('')
  const preset = MUSICAL_PRESETS.find(p => p.id === presetId)
  return <Box>
    <label htmlFor="musical-preset">Preset</label>
    <select id="musical-preset" value={choice} onChange={e => setChoice(e.target.value)}>
      <option value="">Elegir un ritmo…</option>
      {MUSICAL_PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
    <button type="button" disabled={!choice} onClick={() => applyPreset(choice)}>Aplicar</button>
    <p>Inicio editable: configura A (compás, acentos y grupos) y el BPM compartido. Conserva el patrón B y el modo.</p>
    {preset && <p role="status">{preset.name}{presetModified ? ' · editado' : ' · activo'}. {preset.description}</p>}
  </Box>
}
