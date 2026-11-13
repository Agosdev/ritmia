import React, { useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { MAX_NUM, DENOMINATORS } from '../../music/constants'
import { CLAVE_PATTERNS } from '../../music/clavePatterns'
import { Panel2 } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { RangeInput } from '../ui/RangeInput'

const PolyrhythmContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  > p, details > p { font-size: 12px; line-height: 1.5; color: ${({ theme }) => theme.colors.textDim}; }
  input:disabled, select:disabled { opacity: .6; cursor: not-allowed; }
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
  background: ${({ theme }) => theme.variant === 'lite' ? theme.colors.panel2 : theme.colors.bg};
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
  background: ${({ theme }) => theme.variant === 'lite' ? theme.colors.panel2 : theme.colors.bg};
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
    ${({ $isActive, theme }) => ($isActive
      ? theme.variant === 'lite' ? theme.colors.amber : theme.colors.selectedControl
      : theme.colors.border)};
  font-size: 11px;
  line-height: 1.35;
  background: ${({ $isActive, theme }) => ($isActive ? theme.colors.selectedControl : theme.colors.panel2)};
  color: ${({ $isActive, theme }) => ($isActive ? '#000000' : theme.colors.textDim)};
  transition: ${({ theme }) => theme.transitions.fast};
  box-shadow: ${({ $isActive, theme }) => theme.variant === 'lite'
    ? ($isActive ? theme.shadows.glowAmber : theme.shadows.sm)
    : 'none'};

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
  background: ${({ $isActive, theme }) => ($isActive
    ? theme.variant === 'lite' ? theme.colors.cyanControl : theme.colors.cyan
    : theme.colors.panel2)};
  color: ${({ $isActive, theme }) => ($isActive && theme.variant !== 'lite' ? '#000000' : 'inherit')};
  font-size: 11px;
  font-weight: 500;
  transition: ${({ theme }) => theme.transitions.fast};
  box-shadow: ${({ $isActive, theme }) => theme.variant === 'lite'
    ? ($isActive ? theme.shadows.glowCyan : theme.shadows.sm)
    : 'none'};
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
    { id: 'polirritmia', label: 'Polirritmia — distintos pasos en un ciclo común' },
    { id: 'polimetria', label: 'Polimetría — compases independientes, mismo BPM' },
    { id: 'morph', label: 'Morph — mezcla A y B en un ciclo común' },
    { id: 'clave', label: 'Clave — carga un patrón tradicional en B' },
  ]

  return (
    <PolyrhythmContainer>
      <ModesGrid data-tour-target="modes">
        <div style={{ gridColumn: 'span 2', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.colors.textDim, fontFamily: theme.fonts.mono }}>
          Modo · relación entre A y B
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

      <SectionTitle>Configuración de la pista B</SectionTitle>

      {mode === 'clave' && <p>Al entrar se carga la clave elegida en B. Al salir recuperás tu patrón B anterior. Podés editar sus golpes. {CLAVE_PATTERNS[claveIndex]?.cycleMeasures === 2 ? 'Esta clave dura ocho negras (dos compases de 4/4).' : 'Esta clave se adapta al ciclo de A.'}</p>}
      {mode === 'polirritmia' && <p>B reparte sus pasos dentro del ciclo de A. Su denominador escrito no cambia la duración audible.</p>}
      {mode === 'polimetria' && <p>Cada compás dura según su numerador y denominador; los ciclos vuelven a encontrarse después.</p>}
      {mode === 'morph' && <p>Desplazá la mezcla entre A y B. Ambos completan el mismo ciclo; los extremos silencian una pista.</p>}
      <InputsGrid>
        <FieldBox>
          <FieldLabel>NUM B</FieldLabel>
          <NumberBox
            disabled={mode === 'clave'}
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
            disabled={mode !== 'polimetria'}
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

      {mode !== 'polimetria' && <p>El denominador B solo se edita en Polimetría; los otros modos fijan su duración.</p>}
      {mode !== 'clave' && <details><summary>Entrada avanzada de pulsos B</summary>      <FreeTextRow>
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

</details>}
      <VolumeRow>
        <span>Vol B</span>
        <RangeInput
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volumeB}
          onChange={e => setVolumeB(parseFloat(e.target.value))}
          style={{ flex: 1, '--range-from': '#d85abf', '--range-to': '#f0b182' }}
          aria-label="Volumen pista B"
        />
      </VolumeRow>

      <details><summary>Marcas visuales de grupos B (opcional)</summary><p>No modifican los golpes audibles.</p>      <FreeTextInput
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

</details>
      {mode === 'morph' && (
        <MorphContainer>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span>Morphing Ganancia Cruzada</span>
            <span style={{ fontFamily: 'monospace' }}>{Math.round(morphAmount * 100)}%</span>
          </div>
          <RangeInput
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={morphAmount}
            onChange={e => setMorphAmount(parseFloat(e.target.value))}
            aria-label="Porcentaje de morphing"
          />
          <div style={{ fontSize: '10px', color: theme.colors.textDim }}>
            0%: solo A. 100%: solo B. El punto medio mezcla ambas pistas.
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

    </PolyrhythmContainer>
  )
}
