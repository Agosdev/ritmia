import React, { useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { MAX_NUM, DENOMINATORS } from '../../music/constants'
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
    ${({ $isActive, theme }) => ($isActive ? theme.colors.selectedControl : theme.colors.border)};
  font-size: 11px;
  line-height: 1.35;
  background: ${({ $isActive, theme }) => ($isActive ? theme.colors.selectedControl : theme.colors.panel2)};
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
  border: 1px solid ${({ theme }) => `${theme.colors.cyan}55`};
  background: ${({ theme }) => `${theme.colors.cyan}1a`};
  color: ${({ theme }) => theme.colors.cyanSoft};
  font-family: ${({ theme }) => theme.fonts.mono};
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => `${theme.colors.cyan}33`};
  }
`

export function PolyrhythmControls() {
  const theme = useTheme()
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
    groupingFeedbackB,
    isValidGroupingB,
    mode,
    setMode,
    morphAmount,
    setMorphAmount,
    claveIndex,
    setClaveIndex,
    timing,
  } = useRitmia()
  const canonicalClaveCycle = mode === 'clave' && CLAVE_PATTERNS[claveIndex]?.cycleMeasures === 2

  const [freeTextB, setFreeTextB] = useState('')

  const handleApplyFreeTextB = () => {
    if (!/^\d+$/.test(freeTextB.trim())) return
    const val = Number(freeTextB.trim())
    if (Number.isInteger(val) && val >= 1 && val <= MAX_NUM) {
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
              if (!e.target.value.trim()) return
              const val = Number(e.target.value)
              if (Number.isInteger(val)) {
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
          placeholder="Texto libre B: 12, 15, 24, 32 + Enter"
          value={freeTextB}
          onChange={e => setFreeTextB(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleApplyFreeTextB()
          }}
          aria-label="Entrada libre pulsos B"
        />
        <Button
          $variant="panel"
          $height="2.25rem"
          onClick={handleApplyFreeTextB}
          aria-label="Aplicar numerador de compás B"
        >
          Aplicar
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
        aria-invalid={!isValidGroupingB}
      />

      <div role="status">{groupingFeedbackB}</div>

      {suggestionsB.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          <span style={{ fontSize: '10px', color: theme.colors.textDim, width: '100%' }}>
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
        <div style={{ gridColumn: 'span 2', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.colors.textDim, fontFamily: theme.fonts.mono }}>
          Modos con cálculo preciso
        </div>
        {modes.map(m => (
          <ModeButton
            key={m.id}
            type="button"
            $isActive={mode === m.id}
            aria-pressed={mode === m.id}
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
          <div style={{ fontSize: '10px', color: theme.colors.textDim }}>
            volA * (1 - morph) + volB * morph, sin cambio de tempo ni desfase métrico.
          </div>
        </MorphContainer>
      )}

      {mode === 'clave' && (
        <ClaveGrid>
          {CLAVE_PATTERNS.map((c, i) => (
            <ClaveButton
              key={c.name}
              type="button"
              $isActive={claveIndex === i}
              aria-pressed={claveIndex === i}
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
        <div>
          {canonicalClaveCycle
            ? 'Pasos A por compás / B por ciclo'
            : 'Pasos por compás propio A:B'} = {numA}:{numB}
          {' '}(reducido {timing.pulseRatio.a}:{timing.pulseRatio.b}; incluye silencios)
        </div>
        <div>Frecuencia de pasos A:B = {timing.eventRatio.a}:{timing.eventRatio.b}</div>
        <div>Duración efectiva A:B = {timing.durationRatio.a}:{timing.durationRatio.b}</div>
        <div>Duraciones escritas en fusas: A {timing.ticksA}, B {timing.ticksB}</div>
        {canonicalClaveCycle && <div>Ciclo de clave: ocho negras = {timing.measureB.toFixed(3)}s</div>}
        {mode === 'polimetria' && <div>MCM exacto = {timing.lcmTicks} fusas</div>}
        <div>
          {canonicalClaveCycle
            ? `Reencuentro A×${timing.reunionA} compases / B×${timing.reunionB} ciclos`
            : `Reencuentro A×${timing.reunionA} / B×${timing.reunionB}`}
          , ≈{timing.reunionSec.toFixed(3)}s (desde inicio conjunto)
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
