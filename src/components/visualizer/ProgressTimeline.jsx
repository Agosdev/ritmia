import React from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'

const TimelineContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const LabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textDim};
`

const BarTrack = styled.div`
  position: relative;
  height: 10px;
  border-radius: 9999px;
  background: ${({ $isB }) => ($isB ? '#0F141A' : '#0F0F18')};
  border: 1px solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
`

const BarFill = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: ${({ $color }) => $color};
  width: ${({ $progress }) => `${$progress * 100}%`};
  transition: none;
`

const DividersGrid = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
`

const Divider = styled.div`
  flex: 1;
  border-right: 1px solid rgba(10, 10, 15, 0.6);
  &:last-child {
    border-right: none;
  }
`

const PolymeterInfo = styled.div`
  font-size: 11px;
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.textDim};
  margin-top: 0.25rem;

  b {
    color: ${({ theme }) => theme.colors.textBright};
  }
`

export function ProgressTimeline() {
  const {
    level,
    numA,
    numB,
    progressA,
    progressB,
    timing,
    mode,
  } = useRitmia()

  return (
    <TimelineContainer>
      <LabelRow>
        <span>Timeline continua — locked a AudioContext.currentTime</span>
        <span>
          {progressA.toFixed(3)} — {timing.measureA.toFixed(2)}s
        </span>
      </LabelRow>

      {/* Barra de progreso Track A */}
      <BarTrack>
        <BarFill $color="#FFB800" $progress={progressA} />
        <DividersGrid>
          {Array.from({ length: numA }).map((_, i) => (
            <Divider key={`div-a-${i}`} />
          ))}
        </DividersGrid>
      </BarTrack>

      {/* Barra de progreso Track B (Nivel 3) */}
      {level === 3 && (
        <BarTrack $isB>
          <BarFill $color="#00E5FF" $progress={progressB} />
          <DividersGrid>
            {Array.from({ length: numB }).map((_, i) => (
              <Divider key={`div-b-${i}`} />
            ))}
          </DividersGrid>
        </BarTrack>
      )}

      {level === 3 && mode === 'polimetria' && (
        <PolymeterInfo>
          Reencuentro cada <b>{timing.reunionA}</b> compases de A y{' '}
          <b>{timing.reunionB}</b> de B — mcm de ticks: {timing.lcmTicks}
        </PolymeterInfo>
      )}
    </TimelineContainer>
  )
}
