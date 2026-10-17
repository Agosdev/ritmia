import React, { useState } from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { MAX_NUM, MAX_LCM } from '../../music/constants'
import { CLAVE_PATTERNS } from '../../music/clavePatterns'
import { Panel2 } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

const PolyrhythmContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const SectionTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`

const InputsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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

  &:focus {
    border-color: ${({ theme }) => theme.colors.cyan};
  }
`

const VolumeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textDim};
`

const ModesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  padding-top: 0.5rem;
`

const ModeButton = styled.button`
  text-align: left;
  padding: 0.75rem;
  border-radius: 10px;
  border: 1px solid
    ${({ $isActive, theme }) => ($isActive ? '#ffffff' : theme.colors.border)};
  font-size: 11px;
  line-height: 1.35;
  background: ${({ $isActive, theme }) => ($isActive ? '#ffffff' : theme.colors.panel2)};
  color: ${({ $isActive, theme }) => ($isActive ? '#000000' : theme.colors.textDim)};
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ $isActive, theme }) => ($isActive ? '#000000' : theme.colors.textBright)};
  }
`

const MorphContainer = styled(Panel2)`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const ClaveGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
`

const ClaveButton = styled.button`
  height: 2.75rem;
  border-radius: 10px;
  border: 1px solid
    ${({ $isActive, theme }) => ($isActive ? theme.colors.cyan : theme.colors.border)};
  background: ${({ $isActive, theme }) => ($isActive ? theme.colors.cyan : theme.colors.panel2)};
  color: ${({ $isActive }) => ($isActive ? '#000000' : 'inherit')};
  font-size: 11px;
  font-weight: 500;
  transition: ${({ theme }) => theme.transitions.fast};
`

const StatsBox = styled(Panel2)`
  font-size: 11px;
  font-family: ${({ theme }) => theme.fonts.mono};
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textDim};
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const SuggestionPill = styled.button`
  font-size: 11px;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid rgba(0, 229, 255, 0.3);
  background: rgba(0, 229, 255, 0.1);
  color: ${({ theme }) => theme.colors.cyanSoft};
  font-family: ${({ theme }) => theme.fonts.mono};
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(0, 229, 255, 0.2);
  }
`

export function PolyrhythmControls() {
  const {
    numA,
    numB,
    setNumB,
    denB,
    setDenB,
    volumeB,
    setVolumeB,
    groupingB,
    setGroupingB,
    suggestionsB,
    mode,
    setMode,
    morphAmount,
    setMorphAmount,
    claveIndex,
    setClaveIndex,
    timing,
  } = useRitmia()

  const [freeTextB, setFreeTextB] = useState('')

  const handleApplyFreeTextB = () => {
    const val = parseInt(freeTextB.trim(), 10)
    if (!isNaN(val) && val >= 1 && val <= MAX_NUM) {
      setNumB(val)
      setFreeTextB('')
    }
  }

  const modes = [
    { id: 'polirritmia', label: 'Polirritmia — B se estira/comprime' },
    { id: 'polimetria', label: 'Polimetría — corchea=corchea' },
    { id: 'morph', label: 'Morph — crossfade de ganancia' },
    { id: 'clave', label: 'Clave — 6 patrones tradicionales' },
  ]

  return (
    <PolyrhythmContainer>
      <SectionTitle>Compás B — polirritmia / polimetría hasta {MAX_NUM}</SectionTitle>

      <InputsGrid>
        <FieldBox>
          <FieldLabel>NUM B</FieldLabel>
          <NumberBox
            type="number"
            min="1"
            max={MAX_NUM}
            value={numB}
            onChange={e => {
              const val = parseInt(e.target.value, 10)
              if (!isNaN(val)) {
                setNumB(Math.min(MAX_NUM, Math.max(1, val)))
              }
            }}
            aria-label="Numerador compás B"
          />
        </FieldBox>

        <FieldBox>
          <FieldLabel>DEN B</FieldLabel>
          <SelectBox
            value={denB}
            onChange={e => setDenB(parseInt(e.target.value, 10))}
            aria-label="Denominador compás B"
          >
            {[1, 2, 4, 8, 16].map(d => (
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
          placeholder="Texto libre B: 12, 15, 24, 32 + Enter"
          value={freeTextB}
          onChange={e => setFreeTextB(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleApplyFreeTextB()
          }}
          aria-label="Entrada libre pulsos B"
        />
        <Button $variant="panel" $height="2.25rem" onClick={handleApplyFreeTextB}>
          Set
        </Button>
      </FreeTextRow>

      {numB >= 12 && (
        <div>
          <Badge $variant="cyan">Compás largo B: scroll horizontal activo</Badge>
        </div>
      )}

      <VolumeRow>
        <span>Vol B</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volumeB}
          onChange={e => setVolumeB(parseFloat(e.target.value))}
          style={{ flex: 1 }}
          aria-label="Volumen pista B"
        />
      </VolumeRow>

      <FreeTextInput
        value={groupingB}
        onChange={e => setGroupingB(e.target.value)}
        placeholder="agrupación B ej: 3+2 o 3+3+3+3"
        aria-label="Agrupación pista B"
      />

      {suggestionsB.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          <span style={{ fontSize: '10px', color: '#9a9ab0', width: '100%' }}>
            Sugerencias B para {numB}:
          </span>
          {suggestionsB.map(sug => (
            <SuggestionPill
              key={sug}
              type="button"
              onClick={() => setGroupingB(sug)}
            >
              {sug}
            </SuggestionPill>
          ))}
        </div>
      )}

      <ModesGrid>
        <div style={{ gridColumn: 'span 2', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9a9ab0', fontFamily: 'monospace' }}>
          Modos con cálculo preciso
        </div>
        {modes.map(m => (
          <ModeButton
            key={m.id}
            $isActive={mode === m.id}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </ModeButton>
        ))}
      </ModesGrid>

      {mode === 'morph' && (
        <MorphContainer>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span>Morphing Ganancia Cruzada</span>
            <span style={{ fontFamily: 'monospace' }}>{Math.round(morphAmount * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={morphAmount}
            onChange={e => setMorphAmount(parseFloat(e.target.value))}
            aria-label="Porcentaje de morphing"
          />
          <div style={{ fontSize: '10px', color: '#9a9ab0' }}>
            volA * (1 - morph) + volB * morph, sin cambio de tempo ni desfase métrico.
          </div>
        </MorphContainer>
      )}

      {mode === 'clave' && (
        <ClaveGrid>
          {CLAVE_PATTERNS.map((c, i) => (
            <ClaveButton
              key={c.name}
              $isActive={claveIndex === i}
              onClick={() => setClaveIndex(i)}
            >
              {c.name}
            </ClaveButton>
          ))}
        </ClaveGrid>
      )}

      <StatsBox>
        <div>measureSecA = (60/bpm)*numA*(4/denA) = {timing.measureA.toFixed(3)}s</div>
        <div>stepA = {timing.stepA.toFixed(4)}s, stepB = {timing.stepB.toFixed(4)}s</div>
        <div>ticksA = {timing.ticksA}, ticksB = {timing.ticksB}, ratio = {timing.ratio.toFixed(3)}</div>
        <div>
          lcm = {timing.lcmTicks}
          {timing.capped ? ` (capado a ${MAX_LCM} para evitar lag)` : ''}, reencuentro A×{timing.reunionA.toFixed(2)} / B×{timing.reunionB.toFixed(2)}
        </div>
        {(numA >= 12 || numB >= 12) && (
          <div style={{ color: '#ffd88a', marginTop: '2px' }}>
            Compás largo: usa scroll horizontal en la grilla
          </div>
        )}
      </StatsBox>
    </PolyrhythmContainer>
  )
}
