import React, { memo } from 'react'
import styled from 'styled-components'
import { useRitmia, useRitmiaRealtime } from '../../context/RitmiaContext'

const Surface = styled.section`
  min-width: 0;
  padding: clamp(0.75rem, 3vw, 1.25rem);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 28px;
  background: ${({ theme }) => theme.colors.panel};
  box-shadow: ${({ theme }) => theme.physical.shell};
  align-self: start;
  @media (max-width: 999px) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(100px, .7fr);
    align-items: center;
    column-gap: .75rem;
    > div:first-child { grid-column: 1 / -1; }
    > div:nth-child(2) { grid-column: 1; grid-row: 2 / 4; }
    > div:nth-child(3), > div:nth-child(4) { grid-column: 2; }
    > div:nth-child(3) { flex-direction: column; gap: .45rem; align-items: flex-start; }
    > div:nth-child(4) { grid-template-columns: 1fr; }
  }

  h2 {
    font-size: 13px;
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
  width: min(100%, 310px);
  margin: .5rem auto .8rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.panel};
  box-shadow: ${({ theme }) => theme.physical.inset};
  @media (max-width: 999px) { width: min(100%, 220px); }
  @media (max-width: 520px) { width: min(100%, 180px); }

  svg {
    display: block;
    width: 100%;
    height: 100%;
    .active-beat-a { filter: drop-shadow(0 0 2px #ff7b88); }
    .active-beat-b { filter: drop-shadow(0 0 2px #45dbe4); }
  }
`

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1rem;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 10px;
`

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;

  &::before {
    content: '';
    width: 0.7rem;
    height: 0.7rem;
    border: 2px solid ${({ theme }) => theme.colors.textDim};
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
  padding: 0.4rem 0.6rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
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
  A: { main: '#4c5b69', soft: '#75818c', neon: '#ff7b88' },
  B: { main: '#4c5b69', soft: '#75818c', neon: '#45dbe4' },
}

function pointAt(radius, progress) {
  const angle = progress * TAU - Math.PI / 2
  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  }
}

const BeatMark = memo(function BeatMark({ index, total, radius, track, accent, active }) {
  const point = pointAt(radius, index / total)
  const color = active && accent > 0 ? COLORS[track].neon : COLORS[track].main
  const size = accent === 2 ? 4.2 : accent === 1 ? 3.2 : 2.4
  const fill = active && accent > 0 ? color : accent === 2 ? color : accent === 1 ? COLORS[track].soft : '#e9edf0'
  const common = {
    fill,
    stroke: COLORS[track].main,
    strokeWidth: active ? 2.2 : accent === 0 ? 1.3 : 1,
  }

  return (
    <g className={active && accent > 0 ? `active-beat-${track.toLowerCase()}` : undefined}>
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
      <circle cx={CENTER} cy={CENTER + 1} r={radius} fill="none" stroke="#ffffff" strokeWidth="9" />
      <circle cx={CENTER} cy={CENTER - 1} r={radius} fill="none" stroke="#b8c3cd" strokeWidth="7" />
      <circle cx={CENTER} cy={CENTER} r={radius} fill="none" stroke="#dce2e7" strokeWidth="4" />
      <circle
        data-testid={`lite-track-${track}-progress`}
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
            fill="#f6f8fa"
            stroke={color}
            strokeWidth="2.5"
          />
        : <circle cx={marker.x} cy={marker.y} r="5" fill="#f6f8fa" stroke={color} strokeWidth="2.5" />}
    </g>
  )
})

export function LiteRhythmVisualizer({ showTrackB = false, showGrouping = true, reduceMotion = false }) {
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
          style={{ transition: reduceMotion ? 'none' : undefined }}
        >
          <title id="lite-cycle-title">Visualizador circular de los ciclos musicales</title>
          <desc id="lite-cycle-description">
            A tiene {numA} posiciones; {showTrackB ? `B tiene ${numB} posiciones. ` : ''}
            Los puntos vacíos son silencios, los puntos pequeños son acentos suaves y los llenos son fuertes.
          </desc>
          <defs>
            <radialGradient id="lite-center-fill">
              <stop offset="0%" stopColor="#f6f8fa" />
              <stop offset="100%" stopColor="#d5dde4" />
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
              grouping={showGrouping ? activeGroupingB : null}
            />
          )}
          <Track
            track="A"
            count={numA}
            accents={accentsA}
            currentBeat={currentBeatA}
            progress={progressA}
            radius={showTrackB ? RADIUS_A : RADIUS_B}
            grouping={showGrouping ? activeGroupingA : null}
          />
          <circle cx={CENTER} cy={CENTER} r="19" fill="url(#lite-center-fill)" stroke="#8a97a3" />
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
        <span>○ Silencio · ● suave · ▰ fuerte</span>
      </Legend>
      <Summary>
        <SummaryItem><strong>A</strong> · {numA}/{denA} · {timing.measureA.toFixed(2)} s</SummaryItem>
        {showTrackB && (
          <SummaryItem $trackB>
            <strong>B</strong> · {numB}/{denB} · {timing.measureB.toFixed(2)} s
          </SummaryItem>
        )}
      </Summary>
    </Surface>
  )
}
