import React from 'react'
import styled from 'styled-components'
import { useRitmia, useRitmiaRealtime } from '../../context/RitmiaContext'

const Visualizer = styled.section`
  min-width: 0;
  padding: clamp(0.75rem, 3vw, 1.5rem);
  overflow: hidden;
  border: 1px solid rgba(217, 183, 219, 0.2);
  border-radius: 22px;
  background:
    radial-gradient(ellipse at 50% 45%, rgba(201, 111, 160, 0.11), transparent 58%),
    linear-gradient(145deg, rgba(21, 27, 37, 0.98), rgba(11, 13, 21, 0.98));
`

const VisualizerHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem 1rem;
  margin-bottom: 0.5rem;

  h2 {
    font: 500 clamp(1.05rem, 2.5vw, 1.4rem)/1.3 ${({ theme }) => theme.fonts.serif};
  }

  p {
    color: ${({ theme }) => theme.colors.textDim};
    font: 12px/1.5 ${({ theme }) => theme.fonts.mono};
  }
`

const Visual = styled.div`
  width: min(100%, 900px);
  margin: 0 auto;
  aspect-ratio: 1.52;

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
`

const TrackLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1.25rem;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 13px;
`

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;

  &::before {
    content: '';
    width: 0.75rem;
    height: 0.75rem;
    border: 2px ${({ $trackB }) => $trackB ? 'dashed' : 'solid'}
      ${({ $trackB, theme }) => $trackB ? theme.colors.cyan : theme.colors.amber};
    border-radius: ${({ $trackB }) => $trackB ? '2px' : '50%'};
    transform: ${({ $trackB }) => $trackB ? 'rotate(45deg)' : 'none'};
  }
`

const CycleSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
  gap: 0.5rem;
  margin-top: 0.75rem;
`

const CycleItem = styled.p`
  padding: 0.65rem 0.8rem;
  border-left: 3px ${({ $trackB }) => $trackB ? 'dashed' : 'solid'}
    ${({ $trackB, theme }) => $trackB ? theme.colors.cyan : theme.colors.amber};
  border-radius: 0 10px 10px 0;
  background: rgba(15, 20, 28, 0.72);
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 13px;

  strong {
    color: ${({ theme }) => theme.colors.text};
  }
`

const Relationship = styled.p`
  margin-top: 0.65rem;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 13px;
  line-height: 1.5;
`

const TAU = Math.PI * 2
const CX = 380
const CY = 250
const ART_DOTS = Array.from({ length: 42 }, (_, index) => ({
  x: (index * 149.7 + 37) % 760,
  y: (index * 83.2 + 19) % 500,
  r: 0.7 + (index % 3) * 0.3,
}))

function polar(radius, fraction) {
  const angle = fraction * TAU - Math.PI / 2
  return {
    x: CX + Math.cos(angle) * radius,
    y: CY + Math.sin(angle) * radius,
  }
}

function TrackCycle({
  track,
  num,
  accents,
  grouping,
  progress,
  currentBeat,
  reduceMotion,
  duration,
  playing,
  transportState,
}) {
  const trackB = track === 'B'
  const color = trackB ? '#69d8f2' : '#ff806f'
  const radius = trackB ? 112 : 163
  const clampedProgress = Math.max(0, Math.min(1, progress))
  const markerProgress = playing && reduceMotion
    ? (currentBeat >= 0 ? currentBeat : Math.floor(clampedProgress * num)) / num
    : clampedProgress
  const marker = polar(radius, markerProgress)

  let groupBoundary = 0
  const boundaries = grouping?.slice(0, -1).map(groupSize => {
    groupBoundary += groupSize
    return groupBoundary
  }) ?? []

  return (
    <g data-track={track} aria-label={`Pista ${track}, ciclo de ${num} posiciones`}>
      <circle
        cx={CX}
        cy={CY}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={trackB ? 1.5 : 2}
        strokeOpacity={0.45}
        strokeDasharray={trackB ? '5 7' : undefined}
        data-testid={`art-cycle-${track.toLowerCase()}`}
      />
      {boundaries.map((position, index) => {
        const inner = polar(radius - 7, position / num)
        const outer = polar(radius + 8, position / num)
        return (
          <line
            key={`group-${track}-${index}`}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke={['#ffb86b', '#e889b5', '#b8a0ff', '#75d5c5', '#8fb8ff'][index % 5]}
            strokeWidth="2"
            strokeLinecap="round"
            data-group-boundary={position}
          />
        )
      })}
      {Array.from({ length: num }, (_, index) => {
        const point = polar(radius, index / num)
        const accent = accents[index] ?? 0
        const active = currentBeat === index &&
          (playing || transportState === 'paused')
        const size = accent === 2 ? 8 : accent === 1 ? 6 : 5
        const stroke = active ? '#f4f2f5' : color
        return (
          <g
            key={`position-${track}-${index}`}
            data-position={index + 1}
            data-accent={['silencio', 'suave', 'fuerte'][accent]}
          >
            {trackB ? (
              <rect
                x={point.x - size / 1.4}
                y={point.y - size / 1.4}
                width={size * 1.4}
                height={size * 1.4}
                rx="1.5"
                transform={`rotate(45 ${point.x} ${point.y})`}
                fill={accent === 0 ? '#101820' : color}
                fillOpacity={accent === 2 ? 1 : accent === 1 ? 0.6 : 1}
                stroke={stroke}
                strokeWidth={active ? 2.6 : 1.5}
                strokeDasharray={accent === 0 ? '2 2' : undefined}
              />
            ) : (
              <circle
                cx={point.x}
                cy={point.y}
                r={size}
                fill={accent === 0 ? '#101520' : color}
                fillOpacity={accent === 2 ? 1 : accent === 1 ? 0.62 : 1}
                stroke={stroke}
                strokeWidth={active ? 2.6 : 1.5}
                strokeDasharray={accent === 0 ? '2 2' : undefined}
              />
            )}
            {accent > 0 && (
              <text
                x={point.x}
                y={point.y + 3}
                textAnchor="middle"
                fill="#090b10"
                fontSize="8"
                fontWeight="700"
                aria-hidden="true"
              >
                {index + 1}
              </text>
            )}
            {accent === 0 && (
              <text
                x={point.x}
                y={point.y + 3}
                textAnchor="middle"
                fill="#f4f2f5"
                fontSize="8"
                fontWeight="700"
                aria-hidden="true"
              >
                {index + 1}
              </text>
            )}
          </g>
        )
      })}
      {trackB
        ? <rect
          x={marker.x - 5}
          y={marker.y - 5}
          width="10"
          height="10"
          transform={`rotate(45 ${marker.x} ${marker.y})`}
          fill={color}
          stroke="#090b10"
          strokeWidth="2"
          data-testid={`art-phase-${track.toLowerCase()}`}
        />
        : <circle
          cx={marker.x}
          cy={marker.y}
          r="5"
          fill={color}
          stroke="#090b10"
          strokeWidth="2"
          data-testid={`art-phase-${track.toLowerCase()}`}
        />
      }
      <text
        x={CX}
        y={CY - radius - 19}
        textAnchor="middle"
        fill={color}
        fontSize="13"
        fontFamily="ui-monospace, monospace"
        fontWeight="700"
      >
        {track} · {num} · {duration.toFixed(2)}s
      </text>
    </g>
  )
}

export function RitmiaArtVisualizer({ showTrackB = false, reduceMotion = false }) {
  const {
    accentsA,
    accentsB,
    activeGroupingA,
    activeGroupingB,
    denA,
    denB,
    mode,
    numA,
    numB,
    timing,
    transportState,
  } = useRitmia()
  const { currentBeatA, currentBeatB, progressA, progressB } = useRitmiaRealtime()
  const showB = showTrackB
  const status = transportState === 'playing'
    ? 'Reproduciendo'
    : transportState === 'paused'
      ? 'En pausa'
      : 'Patrón en reposo'
  const relation = mode === 'polimetria'
    ? 'En polimetría, cada pista conserva el valor temporal de su unidad; sus ciclos pueden terminar en momentos distintos. Las trayectorias muestran fases independientes.'
    : mode === 'polirritmia'
      ? `En polirritmia, los ciclos comparten duración (${timing.measureA.toFixed(2)} s); cada pista conserva su propio número de posiciones y fase.`
      : mode === 'morph'
        ? 'Morph cambia el balance de volumen entre A y B, no sus patrones ni sus fases.'
        : mode === 'clave'
          ? 'El ciclo de clave usa las posiciones configuradas en B; su trayectoria permanece independiente de A.'
          : `Cada ciclo sigue su propia fase a partir del reloj de audio.`

  return (
    <Visualizer aria-labelledby="art-visualizer-title">
      <VisualizerHeader>
        <h2 id="art-visualizer-title">El ritmo, en pantalla</h2>
        <p role="status">{status}</p>
      </VisualizerHeader>
      <Visual>
        <svg
          viewBox="0 0 760 500"
          role="img"
          aria-labelledby="art-cycle-title art-cycle-description"
        >
          <title id="art-cycle-title">
            Ciclo rítmico A{showB ? ' y B' : ''}
          </title>
          <desc id="art-cycle-description">
            A tiene {numA} posiciones de {denA}.{showB ? ` B tiene ${numB} posiciones de ${denB}. Las formas circulares identifican A y las formas de rombo identifican B. El contorno discontinuo representa silencio; punto pequeño, acento suave; punto lleno, fuerte.` : ''}
            {' '}La posición y el avance se derivan del reloj de audio; una posición en silencio no indica que haya sonado un golpe.
          </desc>
          <defs>
            <radialGradient id="art-core" cx="50%" cy="50%" r="62%">
              <stop offset="0%" stopColor="#713957" stopOpacity="0.22" />
              <stop offset="70%" stopColor="#3a294c" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#090b10" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx={CX} cy={CY} rx="250" ry="205" fill="url(#art-core)" />
          {ART_DOTS.map((dot, index) => (
            <circle
              key={`art-dot-${index}`}
              cx={dot.x}
              cy={dot.y}
              r={dot.r}
              fill={index % 2 ? '#c39cf4' : '#83d9d4'}
              opacity="0.13"
            />
          ))}
          <path
            d="M 214 270 C 274 194 316 230 372 248 S 470 306 545 228"
            fill="none"
            stroke="#c39cf4"
            strokeOpacity="0.2"
            strokeWidth="1.2"
          />
          <path
            d="M 242 322 C 292 362 352 315 393 282 S 483 197 520 230"
            fill="none"
            stroke="#83d9d4"
            strokeOpacity="0.18"
            strokeWidth="1.2"
          />
          <TrackCycle
            track="A"
            num={numA}
            accents={accentsA}
            grouping={activeGroupingA}
            progress={progressA}
            currentBeat={currentBeatA}
            reduceMotion={reduceMotion}
            duration={timing.measureA}
            playing={transportState === 'playing'}
            transportState={transportState}
          />
          {showB && (
            <TrackCycle
              track="B"
              num={numB}
              accents={accentsB}
              grouping={activeGroupingB}
              progress={progressB}
              currentBeat={currentBeatB}
              reduceMotion={reduceMotion}
              duration={timing.measureB}
              playing={transportState === 'playing'}
              transportState={transportState}
            />
          )}
          <circle cx={CX} cy={CY} r="12" fill="#151b25" stroke="#394555" />
          <text
            x={CX}
            y={CY + 4}
            textAnchor="middle"
            fill="#f4f2f5"
            fontSize="9"
            fontFamily="ui-monospace, monospace"
          >
            {transportState === 'playing' ? '▶' : transportState === 'paused' ? 'Ⅱ' : 'R'}
          </text>
        </svg>
      </Visual>
      <TrackLegend aria-label="Leyenda del visualizador rítmico">
        <LegendItem>A · ciclo circular</LegendItem>
        {showB && <LegendItem $trackB>B · ciclo de rombos discontinuado</LegendItem>}
        <span>Vacío: silencio · punto: suave · relleno: fuerte</span>
      </TrackLegend>
      <CycleSummary>
        <CycleItem><strong>A:</strong> {numA}/{denA} · ciclo {timing.measureA.toFixed(2)} s · avance {Math.round(progressA * 100)}%</CycleItem>
        {showB && (
          <CycleItem $trackB>
            <strong>B:</strong> {numB}/{denB} · ciclo {timing.measureB.toFixed(2)} s · avance {Math.round(progressB * 100)}%
          </CycleItem>
        )}
      </CycleSummary>
      {showB && <Relationship>{relation}</Relationship>}
    </Visualizer>
  )
}
