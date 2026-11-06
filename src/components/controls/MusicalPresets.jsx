import React from 'react'
import styled from 'styled-components'
import { MUSICAL_PRESETS } from '../../music/presets'
import { useRitmia } from '../../context/RitmiaContext'

const Explanation = styled.div`
  min-width: 0;
  font-size: 12px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textDim};
  p + p { margin-top: .5rem; }
  strong { color: ${({ theme }) => theme.colors.text}; }
`
const Select = styled.select`
  width: 100%;
  min-width: 0;
  height: 52px;
  padding: .4rem 1.6rem .4rem ${({ $hasPreset }) => $hasPreset ? '3rem' : '.75rem'};
  appearance: none;
  -webkit-appearance: none;
  text-align: right;
  text-align-last: right;
  border-radius: 16px;
  font-size: clamp(12px, 2.7vw, 13px);
  text-overflow: ellipsis;
  cursor: pointer;
`

const SelectControl = styled.div`
  position: relative;
  min-width: 0;
  min-height: 52px;
  select { font-weight: ${({ $free }) => $free ? 800 : 500}; }
  option { font-weight: 400; text-align: left; }
  option[value=''] { font-weight: 800; }
  &::after {
    content: '';
    position: absolute;
    right: .7rem;
    top: calc(50% - 4px);
    width: 6px;
    height: 6px;
    border: solid currentColor;
    border-width: 0 1.5px 1.5px 0;
    transform: rotate(45deg);
    pointer-events: none;
  }
  && button[data-select-clear] {
    position: absolute;
    inset: 4px auto auto 4px;
    --control-surface: transparent;
    background: transparent;
    border: 0;
    box-shadow: none;
    transform: none;
  }
  && button[data-select-clear]:hover {
    background: #ffffff66;
    box-shadow: inset 0 1px 1px #ffffffdd;
  }
`
const ClearButton = styled.button`
  flex: 0 0 44px;
  width: 44px;
  min-height: 44px;
  border-radius: 50%;
  &[aria-label] { min-height: 44px; font-size: 18px; padding: 0; }
  font-size: 18px;
  line-height: 1;
`
const Chip = styled.div`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  max-width: 100%;
  gap: .3rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 999px;
  padding: .2rem .85rem .2rem ${({ $free }) => $free ? '.85rem' : '.2rem'};
  background: ${({ theme }) => theme.gradients.secondary};
  box-shadow: ${({ theme }) => theme.physical.elevated};
  scroll-margin-top: 7rem;
  color: ${({ theme }) => theme.colors.text};
  font-size: 12px;
  strong { overflow-wrap: anywhere; }
  span { white-space: nowrap; font-family: ${({ theme }) => theme.fonts.mono}; }
`

function clearAndFocus(clearPreset) {
  clearPreset()
  document.getElementById('musical-preset')?.focus()
}

export function PresetChip() {
  const { presetId, clearPreset, numA, denA } = useRitmia()
  const preset = MUSICAL_PRESETS.find(p => p.id === presetId)
  return <Chip role="group" aria-label="Compás elegido" $free={!preset}>
    {preset && <ClearButton type="button" aria-label="Quitar preset desde el chip"
      title="Volver a Compás libre" onClick={() => clearAndFocus(clearPreset)}>×</ClearButton>}
    <strong>{preset?.name ?? 'Compás libre'}</strong><span>· {numA}/{denA}</span>
  </Chip>
}

export function PresetSelect() {
  const { applyPreset, clearPreset, presetId } = useRitmia()
  const preset = MUSICAL_PRESETS.find(p => p.id === presetId)
  return <SelectControl data-preset-control $free={!preset}>
    <Select $hasPreset={!!preset} id="musical-preset" aria-label="Preset" value={presetId}
    title={preset?.name ?? 'Compás libre'} aria-describedby="preset-editing-help"
    onChange={e => e.target.value ? applyPreset(e.target.value) : clearPreset()}>
    <option value="">Compás libre</option>
    {MUSICAL_PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
    </Select>
    {preset && <ClearButton data-select-clear type="button" aria-label="Quitar preset desde el selector"
      title="Volver a Compás libre" onClick={() => clearAndFocus(clearPreset)}>×</ClearButton>}
  </SelectControl>
}

export function PresetExplanation() {
  const { presetId, presetModified } = useRitmia()
  const preset = MUSICAL_PRESETS.find(p => p.id === presetId)
  return <Explanation>
    <p id="preset-editing-help" role="status">
      {preset
        ? <><strong>Patrón A bloqueado · {preset.name}.</strong> Elegí Compás libre en la barra inferior para editar compás, acentos y grupos. BPM y volumen disponibles.{presetModified ? ' Tempo ajustado.' : ''}</>
        : <><strong>Edición libre de A.</strong> Cambiá compás, acentos y grupos. Elegir un preset en la barra inferior carga su patrón y tempo; conserva B y el modo.</>}
    </p>
    {preset && <p>{preset.description}</p>}
  </Explanation>
}
