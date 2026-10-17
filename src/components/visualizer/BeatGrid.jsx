import React from 'react'
import styled from 'styled-components'
import { GROUP_COLORS } from '../../music/constants'
import { groupIndexForBeat } from '../../music/groupingSuggestions'
import { useRitmia } from '../../context/RitmiaContext'

const GridContainer = styled.div`
  display: flex;
  gap: 6px;
  width: 100%;
  ${({ $scrollable }) =>
    $scrollable &&
    `
    overflow-x: auto;
    padding-bottom: 0.5rem;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
  `}
`

const BeatBox = styled.button`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-radius: 10px;
  border: 1px solid ${({ $isActive, $accentColor, theme }) => ($isActive ? $accentColor : theme.colors.border)};
  background: ${({ $accent, $accentColor, $isTrackB }) => {
    if ($accent === 2) return `${$accentColor}25`
    if ($accent === 1) return $isTrackB ? '#111A28' : '#1A1A28'
    return $isTrackB ? '#0F141E' : '#0F0F18'
  }};
  box-shadow: ${({ $isActive, $accentColor }) =>
    $isActive ? `0 0 0 1px ${$accentColor}, 0 0 18px ${$accentColor}66` : 'none'};
  transform: ${({ $isActive, $reduceMotion }) =>
    $isActive && !$reduceMotion ? 'scale(1.05)' : 'scale(1)'};
  transition: all 120ms ease;
  cursor: pointer;
  user-select: none;
  z-index: ${({ $isActive }) => ($isActive ? 10 : 1)};

  height: ${({ $isCompact }) => ($isCompact ? '2.75rem' : '3rem')};
  min-width: ${({ $isCompact }) => ($isCompact ? '44px' : 'auto')};
  flex: ${({ $isCompact }) => ($isCompact ? 'none' : '1')};
  scroll-snap-align: start;

  &:hover {
    border-color: ${({ $accentColor }) => $accentColor}88;
  }
`

const BeatNumber = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ $isCompact }) => ($isCompact ? '9px' : '11px')};
  color: ${({ theme }) => theme.colors.text};
`

const AccentDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: ${({ $color }) => $color};
  opacity: ${({ $accent }) => ($accent === 2 ? 1 : $accent === 1 ? 0.6 : 0.2)};
  transition: opacity 120ms ease;
`

export function BeatGrid({
  numBeats,
  accents,
  onAccentsChange,
  currentBeat,
  parsedGrouping,
  isValidGrouping,
  trackType = 'A', // 'A' | 'B'
  label,
}) {
  const { reduceMotion } = useRitmia()
  const isScrollable = numBeats > 16
  const isTrackB = trackType === 'B'
  const defaultColor = isTrackB ? '#00E5FF' : '#FFB800'

  const handleBeatClick = index => {
    const nextAccents = [...accents]
    // Ciclo: 0 (silencio) -> 1 (suave) -> 2 (fuerte) -> 0
    nextAccents[index] = ((nextAccents[index] ?? 0) + 1) % 3
    onAccentsChange(nextAccents)
  }

  return (
    <div>
      <GridContainer $scrollable={isScrollable} role="group" aria-label={label}>
        {Array.from({ length: numBeats }).map((_, index) => {
          const accentVal = accents[index] ?? 0
          const isActive = currentBeat === index

          const grpIdx = parsedGrouping ? groupIndexForBeat(index, parsedGrouping) : 0
          const color =
            parsedGrouping && isValidGrouping
              ? GROUP_COLORS[grpIdx % GROUP_COLORS.length]
              : defaultColor

          return (
            <BeatBox
              key={`beat-${trackType}-${index}`}
              type="button"
              onClick={() => handleBeatClick(index)}
              $accent={accentVal}
              $accentColor={color}
              $isActive={isActive}
              $reduceMotion={reduceMotion}
              $isCompact={isScrollable}
              $isTrackB={isTrackB}
              aria-label={`Pulso ${index + 1}, acento: ${
                accentVal === 2 ? 'fuerte' : accentVal === 1 ? 'suave' : 'silencio'
              }`}
            >
              <BeatNumber $isCompact={isScrollable}>{index + 1}</BeatNumber>
              <AccentDot $color={color} $accent={accentVal} />
            </BeatBox>
          )
        })}
      </GridContainer>
    </div>
  )
}
