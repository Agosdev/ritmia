import React from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { Panel2 } from '../ui/Card'
import { Badge } from '../ui/Badge'

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`

const SectionTitle = styled.span`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.textDim};
  font-weight: 600;
`

const DescriptionText = styled.p`
  font-size: 13px;
  line-height: 1.55;
  color: #d8d8e2;
  font-weight: 450;
`

const FormulaRow = styled.div`
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 10px;
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.textDim};
`

export function AudioInfoBadge() {
  const { audioDescription, level, mode } = useRitmia()

  return (
    <Panel2>
      <HeaderRow>
        <SectionTitle>¿Qué escuchas?</SectionTitle>
        <Badge $variant="pill">Gain (0.6) → Compressor (-20dB, 6:1) → Master</Badge>
      </HeaderRow>
      <DescriptionText>{audioDescription}</DescriptionText>
      <FormulaRow>
        <span>paso A = (60/bpm) * (4/denA)</span>
        {level === 3 && <span>{mode === 'polimetria'
          ? 'paso B = (60/bpm) * (4/denB)'
          : 'paso B = duración A / numB'}</span>}
        <span>•</span>
        <span>ticks escritos = num * (32/den)</span>
        <span>•</span>
        <span>osc.start(atTime) con cero drift</span>
      </FormulaRow>
    </Panel2>
  )
}
