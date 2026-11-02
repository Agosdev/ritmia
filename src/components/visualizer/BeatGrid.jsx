import React from 'react'
import styled, { useTheme } from 'styled-components'
import { litePressable } from '../../styles/liteSurfaces'
import { groupIndexForBeat } from '../../music/groupingSuggestions'
import { useRitmia, useRitmiaRealtime } from '../../context/RitmiaContext'

const GridContainer = styled.div`
  display: flex;
  min-width: 0;
  gap: 6px;
  width: 100%;
  ${({ theme }) => theme.variant === 'lite' && 'padding: .4rem; scroll-padding: .4rem;'}
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
  background: ${({ $accent, $accentColor, $isTrackB, theme }) => {
    if ($accent === 2) return `${$accentColor}25`
    if ($accent === 1) return $isTrackB ? theme.colors.inactiveBeatSoftB : theme.colors.inactiveBeatSoft
    return $isTrackB ? theme.colors.inactiveBeatB : theme.colors.inactiveBeat
  }};
  box-shadow: ${({ $isActive, $accentColor, theme }) => {
    if (!$isActive) return theme.variant === 'lite' ? theme.shadows.sm : 'none'
    return theme.variant === 'lite'
      ? `inset 2px 2px 5px rgba(41, 52, 61, 0.2), inset -2px -2px 5px #ffffff, 0 0 0 1px ${$accentColor}`
      : `0 0 0 1px ${$accentColor}, 0 0 18px ${$accentColor}66`
  }};
  transform: ${({ $isActive, $reduceMotion }) =>
    $isActive && !$reduceMotion ? 'scale(1.05)' : 'scale(1)'};
  transition: ${({ $reduceMotion }) => ($reduceMotion ? 'none' : 'all 120ms ease')};
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
  ${({ theme, $isActive }) => theme.variant === 'lite' && `
    background: ${theme.colors.panel};
    border-color: ${$isActive ? theme.colors.borderStrong : theme.colors.borderLight};
    box-shadow: ${$isActive ? theme.physical.selected : theme.physical.elevated};
    transform: none;
    min-width: 44px;
    flex: 1 0 44px;
    height: 58px;
    border-radius: 14px;
    &[data-group-start='true'] { border-left: 3px solid ${theme.colors.textDim}; }
  `}
  ${({ theme }) => theme.variant === 'lite' && litePressable}

`

const BeatNumber = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.text};
`

const AccentDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: ${({ $color }) => $color};
  opacity: ${({ $accent }) => ($accent === 2 ? 1 : $accent === 1 ? 0.6 : 0.2)};
  transition: ${({ $reduceMotion }) => ($reduceMotion ? 'none' : 'opacity 120ms ease')};
  ${({ theme, $accent, $active, $trackB }) => theme.variant === 'lite' && `
    opacity: 1;
    width: ${$accent === 2 ? '13px' : '7px'};
    height: ${$accent === 2 ? '5px' : '7px'};
    border-radius: ${$accent === 2 ? '2px' : '50%'};
    border: 1px solid ${theme.colors.textDim};
    background: ${$accent === 0 ? 'transparent' : theme.colors.textDim};
    ${$active && $accent > 0 ? `
      background: ${$trackB ? theme.colors.cyanNeon : theme.colors.amberNeon};
      border-color: ${theme.colors.textDim};
      box-shadow: 0 0 3px #fff, 0 0 7px ${$trackB ? theme.colors.cyanGlow : theme.colors.amberGlow};
    ` : ''}
  `}

`

export function BeatGrid({
  beatLabels,
  numBeats,
  accents,
  onAccentsChange,
  parsedGrouping,
  isValidGrouping,
  trackType = 'A', // 'A' | 'B'
  label,
  reduceMotionOverride,
}) {
  const { reduceMotion: contextReduceMotion } = useRitmia()
  const theme = useTheme()
  const reduceMotion = reduceMotionOverride ?? contextReduceMotion
  const { currentBeatA, currentBeatB } = useRitmiaRealtime()
  const isScrollable = numBeats >= (theme.variant === 'lite' ? 6 : 16)
  const isTrackB = trackType === 'B'
  const currentBeat = isTrackB ? currentBeatB : currentBeatA
  const defaultColor = isTrackB ? theme.colors.cyan : theme.colors.amber

  const handleBeatClick = index => {
    const nextAccents = [...accents]
    // Ciclo: 0 (silencio) -> 1 (suave) -> 2 (fuerte) -> 0
    nextAccents[index] = ((nextAccents[index] ?? 0) + 1) % 3
    onAccentsChange(nextAccents)
  }

  return (
    <div>
      <GridContainer
        $scrollable={isScrollable}
        role="group"
        aria-label={label}
        tabIndex={isScrollable ? 0 : undefined}
        aria-describedby={isScrollable ? `${label.replace(/\s+/g, '-')}-scroll-help` : undefined}
      >
        {Array.from({ length: numBeats }).map((_, index) => {
          const accentVal = accents[index] ?? 0
          const isActive = currentBeat === index

          const grpIdx = parsedGrouping ? groupIndexForBeat(index, parsedGrouping) : 0
          const color =
            theme.variant !== 'lite' && parsedGrouping && isValidGrouping
              ? theme.accent.groupColors[grpIdx % theme.accent.groupColors.length]
              : defaultColor

          return (
            <BeatBox
              data-playing={isActive || undefined}
              data-accent={accentVal}
              data-track={trackType}
              key={`beat-${trackType}-${index}`}
              type="button"
              onClick={() => handleBeatClick(index)}
              $accent={accentVal}
              $accentColor={color}
              $isActive={isActive}
              $reduceMotion={reduceMotion}
              $isCompact={isScrollable}
              $isTrackB={isTrackB}
              data-group-start={parsedGrouping && isValidGrouping && (index === 0 || groupIndexForBeat(index, parsedGrouping) !== groupIndexForBeat(index - 1, parsedGrouping)) || undefined}
              aria-label={`Pulso ${beatLabels?.[index] ?? index + 1}, acento: ${
                accentVal === 2 ? 'fuerte' : accentVal === 1 ? 'suave' : 'silencio'
              }`}
            >
              <BeatNumber $isCompact={isScrollable}>{beatLabels?.[index] ?? index + 1}</BeatNumber>
              <AccentDot $active={isActive} $trackB={isTrackB} $color={color} $accent={accentVal} $reduceMotion={reduceMotion} />
            </BeatBox>
          )
        })}
      </GridContainer>
      {isScrollable && (
        <span id={`${label.replace(/\s+/g, '-')}-scroll-help`} className="sr-only">
          Grilla desplazable horizontalmente con teclado o gesto táctil.
        </span>
      )}
    </div>
  )
}
