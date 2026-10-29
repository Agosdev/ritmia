import React, { useState } from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { TIME_SIGNATURES, MAX_NUM, DENOMINATORS } from '../../music/constants'
import { Panel2 } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

const BuilderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
    ${({ $isSelected, theme }) => ($isSelected ? '#ffffff' : theme.colors.border)};
  background: ${({ $isSelected }) => ($isSelected ? '#ffffff' : 'transparent')};
  color: ${({ $isSelected, theme }) => ($isSelected ? '#000000' : theme.colors.textDim)};
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
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textBright};
`

const SelectBox = styled.select`
  width: 5rem;
  height: 2rem;
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textBright};
`

const FreeTextRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
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

export function TimeSignatureBuilder() {
  const { numA, setNumA, denA, setDenA, volumeA, setVolumeA } = useRitmia()
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
    <BuilderSection>
      <HeaderRow>
        <SectionTitle>Compás A — MAX {MAX_NUM} pulsos</SectionTitle>
        <PresetsScroll>
          {TIME_SIGNATURES.map(sig => (
            <PresetBtn
              key={sig.label}
              type="button"
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
      </InputsGrid>

      <FreeTextRow>
        <FreeTextInput
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
          $variant="panel"
          $height="2.25rem"
          onClick={handleApplyFreeText}
          aria-label="Aplicar numerador de compás A"
        >
          Aplicar
        </Button>
      </FreeTextRow>

      {numA >= 12 && (
        <div>
          <Badge $variant="amber">
            Compás largo: usa scroll horizontal o reduce zoom — {numA} pulsos
          </Badge>
        </div>
      )}

      <VolumeRow>
        <span>Vol A</span>
        <input
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
    </BuilderSection>
  )
}
