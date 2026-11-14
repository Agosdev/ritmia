import React, { useState } from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { TIME_SIGNATURES, MAX_NUM, DENOMINATORS } from '../../music/constants'
import { Panel2 } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { RangeInput } from '../ui/RangeInput'

const BuilderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  &[data-compact] { gap: .65rem; }
  &[data-compact] > div:first-child > div {
    flex-wrap: nowrap; overflow-x: auto; padding: .4rem; gap: .55rem;
    button { flex: 0 0 auto; min-width: 44px; }
  }
`

const HeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`

const SectionTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`

const PresetsScroll = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  width: 100%;
  justify-content: flex-start;

  @media (max-width: 520px) {
    gap: 0.35rem;
  }
`

const PresetBtn = styled.button`
  min-height: 2.25rem;
  padding: 0 0.5rem;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: 10px;
  border: 1px solid
    ${({ $isSelected, theme }) => ($isSelected
      ? theme.variant === 'lite' ? theme.colors.amber : theme.colors.selectedControl
      : theme.colors.border)};
  background: ${({ $isSelected, theme }) => ($isSelected ? theme.colors.selectedControl : 'transparent')};
  color: ${({ $isSelected, theme }) => ($isSelected
    ? theme.variant === 'lite' ? theme.colors.textBright : '#000000'
    : theme.colors.textDim)};
  font-weight: ${({ $isSelected, theme }) => theme.variant === 'lite' && $isSelected ? 650 : 'inherit'};
  box-shadow: ${({ $isSelected, theme }) => $isSelected && theme.variant === 'lite'
    ? theme.physical.selected
    : 'none'};
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ $isSelected, theme }) => ($isSelected ? '#000000' : theme.colors.textBright)};
  }
`

const InputsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
`

const FieldBox = styled(Panel2)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
`

const FieldLabel = styled.span`
  font-size: 11px;
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.textDim};
`

const NumberBox = styled.input`
  width: 3.5rem;
  height: 2rem;
  border-radius: 6px;
  background: ${({ theme }) => theme.variant === 'lite' ? theme.colors.panel2 : theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textBright};
  box-shadow: ${({ theme }) => theme.variant === 'lite'
    ? theme.physical.inset
    : 'none'};
`

const SelectBox = styled.select`
  width: 5rem;
  height: 2rem;
  border-radius: 6px;
  background: ${({ theme }) => theme.variant === 'lite' ? theme.colors.panel2 : theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textBright};
  box-shadow: ${({ theme }) => theme.variant === 'lite'
    ? theme.physical.inset
    : 'none'};
`

const FreeTextRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.5rem;
`

const FreeTextInput = styled.input`
  height: 2.25rem;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 0 0.75rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textBright};
  min-width: 0;
  width: 100%;
  box-shadow: ${({ theme }) => theme.variant === 'lite' ? theme.physical.inset : 'none'};

  &::placeholder {
    font-size: 11px;
    color: ${({ theme }) => theme.colors.textDim};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.amber};
  }
`

const VolumeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textDim};
`

const Advanced = styled.div`
  summary { min-height: 44px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-size: 12px; color: ${({ theme }) => theme.colors.textDim}; }
  summary::after { content: '+'; }
  &[open] summary::after { content: '−'; }
`

export function TimeSignatureBuilder({ compact = false }) {
  const { numA, setNumA, denA, setDenA, volumeA, setVolumeA, presetLocked, subdivisionA, setSubdivisionA } = useRitmia()
  const [freeText, setFreeText] = useState('')

  const handleApplyFreeText = () => {
    if (!/^\d+$/.test(freeText.trim())) return
    const val = Number(freeText.trim())
    if (Number.isInteger(val) && val >= 1 && val <= MAX_NUM) {
      setNumA(val)
      setFreeText('')
    }
  }

  return (
    <BuilderSection data-compact={compact || undefined} aria-describedby={presetLocked ? 'preset-editing-help' : undefined}>
      <HeaderRow>
        <SectionTitle>Compás A — MAX {MAX_NUM} pulsos</SectionTitle>
        <PresetsScroll>
          {TIME_SIGNATURES.map(sig => (
            <PresetBtn
              key={sig.label}
              type="button"
              disabled={presetLocked}
              $isSelected={numA === sig.num && denA === sig.den}
              aria-pressed={numA === sig.num && denA === sig.den}
              onClick={() => {
                setNumA(sig.num)
                setDenA(sig.den)
              }}
            >
              {sig.label}
            </PresetBtn>
          ))}
        </PresetsScroll>
      </HeaderRow>

      <InputsGrid>
        <FieldBox>
          <FieldLabel>NUM</FieldLabel>
          <NumberBox
            disabled={presetLocked}
            type="number"
            min="1"
            max={MAX_NUM}
            value={numA}
            onChange={e => {
              if (!e.target.value.trim()) return
              const val = Number(e.target.value)
              if (Number.isInteger(val)) {
                setNumA(Math.min(MAX_NUM, Math.max(1, val)))
              }
            }}
            aria-label="Numerador compás A"
            aria-valuemin={1}
            aria-valuemax={MAX_NUM}
          />
        </FieldBox>

        <FieldBox>
          <FieldLabel>DEN</FieldLabel>
          <SelectBox
            disabled={presetLocked}
            value={denA}
            onChange={e => setDenA(parseInt(e.target.value, 10))}
            aria-label="Denominador compás A"
          >
            {DENOMINATORS.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </SelectBox>
        </FieldBox>
        <FieldBox>
          <FieldLabel>SUBDIVISIÓN</FieldLabel>
          <SelectBox aria-label="Subdivisiones por unidad del compás A" value={subdivisionA}
            disabled={presetLocked} onChange={e => setSubdivisionA(Number(e.target.value))}>
            {[1, 2, 3, 4].map(n => <option key={n} value={n} disabled={numA * n > 32 || denA * n > 32}>{n}</option>)}
          </SelectBox>
        </FieldBox>
      </InputsGrid>

      <Advanced as={compact ? 'details' : 'div'}>
        {compact && <summary>Entrada avanzada de pulsos</summary>}
        <FreeTextRow>
          <FreeTextInput
            disabled={presetLocked}
            type="text"
            inputMode="numeric"
            placeholder="Texto libre: escribe 12, 15, 24, 32 + Enter"
            value={freeText}
            onChange={e => setFreeText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleApplyFreeText()
            }}
            aria-label="Entrada libre de pulsos"
          />
          <Button
            disabled={presetLocked}
            $variant="panel"
            $height="2.25rem"
            onClick={handleApplyFreeText}
            aria-label="Aplicar numerador de compás A"
          >
            Aplicar
          </Button>
        </FreeTextRow>
      </Advanced>

      {numA >= 12 && (
        <div>
          <Badge $variant="amber">
            Compás largo: usa scroll horizontal o reduce zoom — {numA} pulsos
          </Badge>
        </div>
      )}

      <VolumeRow>
        <span>Vol A</span>
        <RangeInput
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volumeA}
          onChange={e => setVolumeA(parseFloat(e.target.value))}
          style={{ flex: 1 }}
          aria-label="Volumen pista A"
        />
      </VolumeRow>
      {volumeA === 0 && <small role="status">El volumen de esta pista está en cero.</small>}
    </BuilderSection>
  )
}
