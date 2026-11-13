import React from 'react'
import styled, { useTheme } from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { Badge } from '../ui/Badge'

const GroupingContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const TitleRow = styled.div`
  ${({ theme }) => theme.variant === 'lite' && 'flex-wrap: wrap; gap: .5rem;'}
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Title = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`

const GroupingTextInput = styled.input`
  width: 100%;
  height: 2.75rem;
  border-radius: 10px;
  background: ${({ theme }) => theme.variant === 'lite' ? theme.colors.panel2 : theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 0 0.75rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textBright};
  box-shadow: ${({ theme }) => theme.variant === 'lite' ? theme.physical.inset : 'none'};

  &:focus {
    border-color: ${({ theme }) => theme.colors.amber};
  }

  &::placeholder {
    font-size: 11px;
    color: ${({ theme }) => theme.colors.textDim};
  }
`

const SuggestionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
`

const SuggestionLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textDim};
  width: 100%;
`

const SuggestionPill = styled.button`
  font-size: 11px;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid ${({ theme }) => `${theme.colors.amber}55`};
  background: ${({ theme }) => `${theme.colors.amber}1a`};
  color: ${({ theme }) => theme.colors.amberSoft};
  font-family: ${({ theme }) => theme.fonts.mono};
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => `${theme.colors.amber}33`};
  }
`

const ColorSegmentsBar = styled.div`
  display: flex;
  gap: 4px;
  height: 8px;
  width: 100%;
`

const Segment = styled.div`
  flex: 1;
  height: 100%;
  border-radius: 9999px;
  background: ${({ $color }) => $color};
`

const InfoLegend = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textDim};
  max-height: 60px;
  overflow-y: auto;
  line-height: 1.4;
`

export function GroupingInput() {
  const theme = useTheme()
  const {
    numA, subdivisionA,
    presetLocked,
    accentsA,
    setAccentsA,
    beatLabelsA,
    groupingA,
    setGroupingA,
    activeGroupingA,
    isValidGroupingA,
    groupingFeedbackA,
    suggestionsA,
  } = useRitmia()

  return (
    <GroupingContainer aria-describedby={presetLocked ? 'preset-editing-help' : undefined}>
      <p>{presetLocked ? 'Agrupación del preset. Elegí Compás libre para cambiar los grupos o aplicar otros acentos.' : 'Los grupos son marcas visuales. Para cambiar el sonido, reforzá sus comienzos con la acción de abajo.'}</p>
      <TitleRow>
        <Title>Agrupación A — &ldquo;3+2+2&rdquo; hasta 32</Title>
        <Badge $variant={isValidGroupingA ? 'emerald' : 'red'}>
          {groupingFeedbackA.split(';')[0]}
        </Badge>
      </TitleRow>

      <GroupingTextInput
        disabled={presetLocked}
        value={groupingA}
        onChange={e => setGroupingA(e.target.value)}
        placeholder="ej: 3+2+2 o 3+3+3+3 para 12"
        aria-label="Agrupación métrica pista A"
        aria-invalid={!isValidGroupingA}
      />

      {!isValidGroupingA && <InfoLegend role="status">{groupingFeedbackA}</InfoLegend>}

      {suggestionsA.length > 0 && (
        <SuggestionsRow>
          <SuggestionLabel>Sugerencias auto para {numA}:</SuggestionLabel>
          {suggestionsA.map(sug => (
            <SuggestionPill
              key={sug}
              type="button"
              disabled={presetLocked}
              onClick={() => setGroupingA(sug)}
            >
              {sug}
            </SuggestionPill>
          ))}
        </SuggestionsRow>
      )}

      {activeGroupingA && (
        <ColorSegmentsBar>
          {activeGroupingA.map((_, i) => (
            <Segment
              key={`seg-${i}`}
              $color={theme.accent.groupColors[i % theme.accent.groupColors.length]}
            />
          ))}
        </ColorSegmentsBar>
      )}

      <button type="button" disabled={presetLocked || !isValidGroupingA} onClick={() => {
        const starts = new Set(); let position = 0
        activeGroupingA.forEach(size => { starts.add(position * subdivisionA); position += size })
        setAccentsA(accentsA.map((accent, index) => starts.has(index) && accent > 0 ? 2 : accent))
      }}>Aplicar acentos a los grupos</button>
      <p>Convierte en fuertes los comienzos que ya suenan. Conserva silencios y otros acentos; podés seguir editándolos en el secuenciador.</p>
      <InfoLegend>
        {theme.variant === 'lite' ? 'Silencio ○ · suave ● · fuerte ▰. ' : ''}Conteo: {Array.from({ length: accentsA.length }).map((_, i) => beatLabelsA?.[i] ?? i + 1).join(' ')} —
        {theme.variant === 'lite' ? 'cada grupo comienza con una marca lateral.' : 'acentos: 0 silencio, 1 suave, 2 fuerte; percusión acústica'}
      </InfoLegend>
    </GroupingContainer>
  )
}
