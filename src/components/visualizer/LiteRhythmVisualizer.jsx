import React, { memo } from 'react'
import styled from 'styled-components'
import { useRitmia, useRitmiaRealtime } from '../../context/RitmiaContext'
import { groupIndexForBeat } from '../../music/groupingSuggestions'

const Surface = styled.section`
  min-width: 0;
  padding: clamp(0.75rem, 3vw, 1.25rem);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.panel};
  box-shadow: ${({ theme }) => theme.shadows.md};

  h2 {
    font-size: 1.1rem;
    font-weight: 650;
  }
`

const HeaderLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem 1rem;
  margin-bottom: 0.5rem;

  p {
    color: ${({ theme }) => theme.colors.textDim};
    font: 12px/1.5 ${({ theme }) => theme.fonts.mono};
  }
`

const CircleFrame = styled.div`
  width: min(100%, 340px);
  margin: 0 auto;
  aspect-ratio: 1;

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
`

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1rem;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 12px;
`

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;

  &::before {
    content: '';
    width: 0.7rem;
    height: 0.7rem;
    border: 2px solid ${({ $trackB, theme }) => $trackB ? theme.colors.cyan : theme.colors.amber};
    border-radius: ${({ $trackB }) => $trackB ? '2px' : '50%'};
    transform: ${({ $trackB }) => $trackB ? 'rotate(45deg)' : 'none'};
  }
`

const Summary = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
  gap: 0.5rem;
  margin-top: 0.65rem;
`

const SummaryItem = styled.p`
  padding: 0.55rem 0.7rem;
  border: 1px solid ${({ $trackB, theme }) => $trackB ? `${theme.colors.cyan}88` : `${theme.colors.amber}88`};
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.panel2};
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 12px;
`

const TAU = Math.PI * 2
const CENTER = 120
const RADIUS_A = 60
const RADIUS_B = 88
const COLORS = {
  A: { main: '#a43e43', soft: '#d2756e' },
  B: { main: '#176a70', soft: '#4b9695' },
}

function pointAt(radius, progress) {
  const angle = progress * TAU - Math.PI / 2
  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  }
}

const BeatMark = memo(function BeatMark({ index, total, radius, track, accent, active, grouping, grouped }) {
  const point = pointAt(radius, index / total)
  const color = grouped && grouping
    ? `var(--group-color-${groupIndexForBeat(index, grouping) % 6})`
    : COLORS[track].main
  const size = accent === 2 ? 4.2 : accent === 1 ? 3.2 : 2.4
  const fill = accent === 2 ? color : accent === 1 ? COLORS[track].soft : '#eeece7'
  const common = {
    fill,
    stroke: color,
    strokeWidth: active ? 2.2 : accent === 0 ? 1.3 : 1,
  }

  return (
    <g>
      {active && <circle cx={point.x} cy={point.y} r={7} fill="none" stroke={color} strokeWidth="1.5" />}
      {track === 'B'
        ? <rect
            x={point.x - size / 1.4}
            y={point.y - size / 1.4}
            width={size * 1.4}
            height={size * 1.4}
            transform={`rotate(45 ${point.x} ${point.y})`}
            {...common}
          />
        : <circle cx={point.x} cy={point.y} r={size} {...common} />}
    </g>
  )
})

const GroupMarkers = memo(function GroupMarkers({ grouping, radius, color }) {
  if (!grouping) return null
  let beat = 0
  return grouping.slice(0, -1).map((count, index) => {
    beat += count
    const point = pointAt(radius, beat / grouping.reduce((sum, item) => sum + item, 0))
    return <circle key={index} cx={point.x} cy={point.y} r="1.7" fill={color} />
  })
})

const Track = memo(function Track({ track, count, accents, currentBeat, progress, radius, grouping }) {
  const color = COLORS[track].main
  const circumference = TAU * radius
  const marker = pointAt(radius, progress)

  return (
    <g>
      <circle cx={CENTER} cy={CENTER} r={radius} fill="none" stroke="#7b8588" strokeWidth="7" />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={`${circumference * progress} ${circumference}`}
        transform={`rotate(-90 ${CENTER} ${CENTER})`}
      />
      <GroupMarkers grouping={grouping} radius={radius + 7} color={color} />
      {Array.from({ length: count }, (_, index) => (
        <BeatMark
          key={`${track}-${index}`}
          index={index}
          total={count}
          radius={radius}
          track={track}
          accent={accents[index] ?? 0}
          active={currentBeat === index}
          grouping={grouping}
          grouped={!!grouping}
        />
      ))}
      {track === 'B'
        ? <rect
            x={marker.x - 4.5}
            y={marker.y - 4.5}
            width="9"
            height="9"
            transform={`rotate(45 ${marker.x} ${marker.y})`}
            fill="#f5f3ee"
            stroke={color}
            strokeWidth="2.5"
          />
        : <circle cx={marker.x} cy={marker.y} r="5" fill="#f5f3ee" stroke={color} strokeWidth="2.5" />}
    </g>
  )
})

export function LiteRhythmVisualizer({ showTrackB = false, reduceMotion = false }) {
  const {
    accentsA,
    accentsB,
    activeGroupingA,
    activeGroupingB,
    denA,
    denB,
    numA,
    numB,
    timing,
    transportState,
  } = useRitmia()
  const { currentBeatA, currentBeatB, progressA, progressB } = useRitmiaRealtime()
  const status = transportState === 'playing'
    ? 'Reproduciendo'
    : transportState === 'paused'
      ? 'En pausa'
      : 'Patrón en reposo'

  return (
    <Surface aria-labelledby="lite-visualizer-title">
      <HeaderLine>
        <h2 id="lite-visualizer-title">El ritmo, en pantalla</h2>
        <p role="status">{status}</p>
      </HeaderLine>
      <CircleFrame>
        <svg
          viewBox="0 0 240 240"
          role="img"
          aria-labelledby="lite-cycle-title lite-cycle-description"
          data-testid="lite-cycle-title"
          style={{
            '--group-color-0': '#9a5522',
            '--group-color-1': '#a43e43',
            '--group-color-2': '#65549a',
            '--group-color-3': '#176a70',
            '--group-color-4': '#365f88',
            '--group-color-5': '#815273',
            transition: reduceMotion ? 'none' : undefined,
          }}
        >
          <title id="lite-cycle-title">Visualizador circular de los ciclos musicales</title>
          <desc id="lite-cycle-description">
            A tiene {numA} posiciones; {showTrackB ? `B tiene ${numB} posiciones. ` : ''}
            Los puntos vacíos son silencios, los puntos pequeños son acentos suaves y los llenos son fuertes.
          </desc>
          <defs>
            <radialGradient id="lite-center-fill">
              <stop offset="0%" stopColor="#f5f3ee" />
              <stop offset="100%" stopColor="#e2e0db" />
            </radialGradient>
          </defs>
          {showTrackB && (
            <Track
              track="B"
              count={numB}
              accents={accentsB}
              currentBeat={currentBeatB}
              progress={progressB}
              radius={RADIUS_B}
              grouping={activeGroupingB}
            />
          )}
          <Track
            track="A"
            count={numA}
            accents={accentsA}
            currentBeat={currentBeatA}
            progress={progressA}
            radius={RADIUS_A}
            grouping={activeGroupingA}
          />
          <circle cx={CENTER} cy={CENTER} r="19" fill="url(#lite-center-fill)" stroke="#cbc9c3" />
          <text
            x={CENTER}
            y={CENTER + 3}
            textAnchor="middle"
            fill="#29343d"
            fontSize="7"
            fontFamily="system-ui, sans-serif"
            fontWeight="600"
          >
            {transportState === 'playing' ? 'PLAY' : transportState === 'paused' ? 'PAUSA' : 'LISTO'}
          </text>
        </svg>
      </CircleFrame>
      <Legend aria-label="Leyenda del visualizador rítmico">
        <LegendItem>A · ciclo y progreso</LegendItem>
        {showTrackB && <LegendItem $trackB>B · ciclo y progreso</LegendItem>}
        <span>Vacío: silencio · pequeño: suave · lleno: fuerte</span>
      </Legend>
      <Summary>
        <SummaryItem><strong>A</strong> · {numA}/{denA} · {timing.measureA.toFixed(2)} s · avance {Math.round(progressA * 100)}%</SummaryItem>
        {showTrackB && (
          <SummaryItem $trackB>
            <strong>B</strong> · {numB}/{denB} · {timing.measureB.toFixed(2)} s · avance {Math.round(progressB * 100)}%
          </SummaryItem>
        )}
      </Summary>
    </Surface>
  )
}
