import React, { memo } from 'react'
import styled from 'styled-components'
import { useRitmia, useRitmiaRealtime } from '../../context/RitmiaContext'

const Visualizer = styled.section`
  min-width: 0;
  padding: clamp(0.75rem, 3vw, 1.5rem);
  overflow: hidden;
  border: 1px solid rgba(217, 183, 219, 0.24);
  border-radius: 22px;
  background:
    radial-gradient(ellipse at 14% 20%, rgba(245, 82, 124, 0.09), transparent 34%),
    radial-gradient(ellipse at 83% 26%, rgba(61, 194, 198, 0.08), transparent 36%),
    radial-gradient(ellipse at 53% 85%, rgba(148, 87, 206, 0.08), transparent 38%),
    linear-gradient(145deg, #12151d, #090b10 72%);
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
  position: relative;
  width: min(100%, 900px);
  margin: 0 auto;
  aspect-ratio: 1.52;
  isolation: isolate;

  svg {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }

  .artwork-plane {
    z-index: 0;
  }

  .structure-plane {
    z-index: 1;
  }

  .phase-plane {
    z-index: 2;
  }

  @media (max-width: 520px) {
    .fine-grain,
    .secondary-filaments {
      display: none;
    }
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
const GROUP_COLORS = ['#ffc56e', '#e889b5', '#b8a0ff', '#75d5c5', '#8fb8ff']

function trackPoint(track, fraction, radius = 1) {
  const angle = fraction * TAU - Math.PI / 2
  const phase = track === 'B' ? 1.12 : 0.42
  const wobble = 1
    + 0.064 * Math.sin(3 * angle + phase)
    + 0.036 * Math.cos(5 * angle - phase * 0.7)
    + 0.019 * Math.sin(2 * angle + phase * 1.8)
  const baseX = track === 'B' ? 107 : 158
  const baseY = track === 'B' ? 96 : 145
  return {
    x: CX + Math.cos(angle) * baseX * radius * wobble,
    y: CY + Math.sin(angle) * baseY * radius * wobble,
  }
}

function pathThroughPoints(points) {
  const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
  const start = midpoint(points.at(-1), points[0])
  let path = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)}`
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]
    const next = points[(index + 1) % points.length]
    const end = midpoint(point, next)
    path += ` Q ${point.x.toFixed(2)} ${point.y.toFixed(2)} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
  }
  return `${path} Z`
}

function createTrackPath(track, scale = 1) {
  return pathThroughPoints(Array.from({ length: 72 }, (_, index) =>
    trackPoint(track, index / 72, scale)
  ))
}

const TRACK_STYLES = {
  A: { color: '#ff806f', soft: '#ffb08a', strong: '#ffc56e', center: '#090b10' },
  B: { color: '#69d8f2', soft: '#a3eaf5', strong: '#ffc56e', center: '#090b10' },
}

const TRACK_CONTOURS = {
  A: Array.from({ length: 17 }, (_, index) => ({
    path: createTrackPath('A', 1 - index * 0.009),
    opacity: 0.42 - index * 0.013,
    width: index % 4 === 0 ? 1.15 : 0.68,
  })),
  B: Array.from({ length: 13 }, (_, index) => ({
    path: createTrackPath('B', 1 - index * 0.013),
    opacity: 0.48 - index * 0.022,
    width: index % 4 === 0 ? 1 : 0.65,
  })),
}

const ORGANIC_REGIONS = [
  { id: 'coral', cx: 205, cy: 188, rx: 126, ry: 153, phase: 0.35, color: '#ff527f', fill: 'url(#art-coral-volume)', contours: 17 },
  { id: 'tide', cx: 536, cy: 176, rx: 151, ry: 114, phase: 1.8, color: '#55d6c7', fill: 'url(#art-tide-volume)', contours: 16 },
  { id: 'violet', cx: 385, cy: 348, rx: 178, ry: 95, phase: 2.55, color: '#b175ee', fill: 'url(#art-violet-volume)', contours: 15 },
  { id: 'ember', cx: 112, cy: 360, rx: 71, ry: 105, phase: 4.1, color: '#ffc56e', fill: 'url(#art-ember-volume)', contours: 10 },
]

function regionPoint(region, angle, scale) {
  const modulation = 1
    + 0.13 * Math.sin(3 * angle + region.phase)
    + 0.065 * Math.cos(5 * angle - region.phase * 0.8)
    + 0.035 * Math.sin(2 * angle + region.phase * 1.4)
  const drift = 0.07 * Math.sin(2 * angle + region.phase)
  return {
    x: region.cx + Math.cos(angle) * region.rx * scale * modulation + drift * region.rx,
    y: region.cy + Math.sin(angle) * region.ry * scale * modulation - drift * region.ry * 0.55,
  }
}

const REGION_LAYERS = ORGANIC_REGIONS.map(region => {
  const contours = Array.from({ length: region.contours }, (_, index) => {
    const scale = 1 - index * 0.038
    const points = Array.from({ length: 56 }, (_, pointIndex) =>
      regionPoint(region, (pointIndex / 56) * TAU, scale)
    )
    return {
      path: pathThroughPoints(points),
      opacity: index === 0 ? 0.48 : 0.28 + (index % 4) * 0.035,
      width: index % 5 === 0 ? 1.3 : 0.72,
    }
  })
  const outline = pathThroughPoints(Array.from({ length: 56 }, (_, index) =>
    regionPoint(region, (index / 56) * TAU, 1)
  ))
  return { ...region, contours, outline }
})

function createSpecks(region, count, phase, scaleX, scaleY) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  return Array.from({ length: count }, (_, index) => {
    const radial = Math.sqrt((index + 0.5) / count)
    const angle = index * goldenAngle + phase
    const edge = 0.84 + 0.12 * Math.sin(index * 2.31 + phase)
    return {
      x: region.cx + Math.cos(angle) * region.rx * scaleX * radial * edge,
      y: region.cy + Math.sin(angle) * region.ry * scaleY * radial * edge,
      r: 0.55 + (index % 5) * 0.28,
      color: ['#ffb86b', '#ef79bb', '#b8a0ff', '#72ddd2', '#8fb8ff'][index % 5],
      opacity: 0.18 + (index % 4) * 0.06,
    }
  })
}

const SPECKS = [
  ...createSpecks(ORGANIC_REGIONS[0], 38, 0.6, 1.13, 1.08),
  ...createSpecks(ORGANIC_REGIONS[1], 42, 2.1, 1.08, 1.18),
  ...createSpecks(ORGANIC_REGIONS[2], 34, 3.6, 1.12, 0.92),
  ...createSpecks(ORGANIC_REGIONS[3], 18, 5.2, 1.32, 1.12),
]

const DUST = Array.from({ length: 56 }, (_, index) => ({
  x: (index * 173.3 + 41) % 760,
  y: (index * 97.7 + 23) % 500,
  r: 0.45 + (index % 3) * 0.25,
  opacity: 0.1 + (index % 5) * 0.025,
}))

const FILAMENTS = [
  { d: 'M 38 335 C 103 274 136 291 177 326 C 218 361 255 355 286 317 C 321 274 355 264 399 291 C 453 324 486 371 547 341 C 599 315 641 269 721 292', color: '#ff806f', width: 2.1, opacity: 0.47 },
  { d: 'M 41 351 C 108 290 139 307 180 341 C 218 374 251 370 282 332 C 320 286 357 279 401 306 C 453 339 488 387 550 358 C 605 331 649 284 720 309', color: '#ffc56e', width: 0.8, opacity: 0.54 },
  { d: 'M 77 113 C 149 74 190 101 220 145 C 249 187 285 194 316 164 C 348 133 379 109 420 125 C 475 146 490 207 544 219 C 602 233 647 191 694 150', color: '#b8a0ff', width: 2, opacity: 0.44 },
  { d: 'M 77 126 C 150 87 187 116 216 158 C 247 201 285 208 319 177 C 351 147 380 123 419 139 C 469 159 490 221 542 233 C 597 247 646 207 688 165', color: '#69d8f2', width: 0.82, opacity: 0.52 },
  { d: 'M 146 438 C 190 406 226 421 252 449 C 282 482 316 477 340 446 C 369 407 399 393 435 411 C 473 430 492 469 535 467 C 569 465 596 441 620 416', color: '#e889b5', width: 1.9, opacity: 0.4 },
  { d: 'M 238 73 C 286 99 301 137 290 171 C 280 203 295 223 323 230 C 356 238 377 258 374 286', color: '#75d5c5', width: 1.1, opacity: 0.48 },
]

const OrganicArtwork = memo(function OrganicArtwork() {
  return (
    <g aria-hidden="true" focusable="false" pointerEvents="none">
      <defs>
        <radialGradient id="art-coral-volume" cx="38%" cy="36%" r="74%">
          <stop offset="0%" stopColor="#ff8c9f" stopOpacity="0.28" />
          <stop offset="60%" stopColor="#ee4380" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#641d58" stopOpacity="0.015" />
        </radialGradient>
        <radialGradient id="art-tide-volume" cx="41%" cy="38%" r="72%">
          <stop offset="0%" stopColor="#8ce7ce" stopOpacity="0.24" />
          <stop offset="58%" stopColor="#36bfc7" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#263c85" stopOpacity="0.015" />
        </radialGradient>
        <radialGradient id="art-violet-volume" cx="49%" cy="35%" r="78%">
          <stop offset="0%" stopColor="#e18cda" stopOpacity="0.2" />
          <stop offset="59%" stopColor="#9b67eb" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#452561" stopOpacity="0.01" />
        </radialGradient>
        <radialGradient id="art-ember-volume" cx="43%" cy="47%" r="75%">
          <stop offset="0%" stopColor="#ffdd86" stopOpacity="0.17" />
          <stop offset="60%" stopColor="#ff916d" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#8a3d4c" stopOpacity="0.01" />
        </radialGradient>
        <linearGradient id="art-filament-warm" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ff806f" stopOpacity="0" />
          <stop offset="48%" stopColor="#ffc56e" stopOpacity="0.62" />
          <stop offset="100%" stopColor="#e889b5" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="760" height="500" fill="url(#art-filament-warm)" opacity="0.04" />

      {REGION_LAYERS.map(region => (
        <g key={`region-${region.id}`}>
          <path d={region.outline} fill={region.fill} />
          {region.contours.map((contour, index) => (
            <path
              key={`${region.id}-contour-${index}`}
              d={contour.path}
              fill="none"
              stroke={index % 4 === 0 ? '#ffc56e' : region.color}
              strokeWidth={contour.width}
              strokeOpacity={contour.opacity}
            />
          ))}
        </g>
      ))}

      <g className="secondary-filaments" fill="none" strokeLinecap="round">
        {FILAMENTS.map((filament, index) => (
          <path
            key={`filament-${index}`}
            d={filament.d}
            stroke={filament.color}
            strokeWidth={filament.width}
            strokeOpacity={filament.opacity}
          />
        ))}
        <path d="M 28 193 C 99 220 113 257 98 296 C 82 338 104 374 151 390" stroke="#75d5c5" strokeWidth="0.8" strokeOpacity="0.42" />
        <path d="M 621 76 C 585 118 579 150 602 179 C 627 209 675 213 733 192" stroke="#b8a0ff" strokeWidth="0.9" strokeOpacity="0.45" />
        <path d="M 311 454 C 357 424 395 430 423 458 C 444 480 475 490 511 478" stroke="#ff806f" strokeWidth="0.9" strokeOpacity="0.44" />
      </g>

      <g className="fine-grain">
        {DUST.map((dot, index) => (
          <circle
            key={`dust-${index}`}
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
            fill={index % 2 ? '#f5e1cf' : '#b8a0ff'}
            opacity={dot.opacity}
          />
        ))}
        {SPECKS.map((dot, index) => (
          <circle
            key={`speck-${index}`}
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
            fill={dot.color}
            opacity={dot.opacity}
          />
        ))}
      </g>
      <g fill="none" strokeLinecap="round">
        <path d="M 83 92 C 176 115 205 203 271 226 C 332 248 402 203 466 231 C 538 263 578 335 689 371" stroke="#f1bdd5" strokeOpacity="0.33" strokeWidth="1.05" />
        <path d="M 52 401 C 140 352 199 369 257 403 C 315 437 377 442 433 403 C 498 357 571 340 706 393" stroke="#88e3d3" strokeOpacity="0.4" strokeWidth="1.15" />
        <path d="M 95 166 C 129 135 151 132 179 153" stroke="#ffc56e" strokeOpacity="0.58" strokeWidth="0.85" />
        <path d="M 586 280 C 621 252 656 249 698 267" stroke="#d7a2ff" strokeOpacity="0.48" strokeWidth="0.9" />
      </g>
    </g>
  )
})

const TrackStructure = memo(function TrackStructure({
  track,
  num,
  accents,
  grouping,
  duration,
}) {
  const style = TRACK_STYLES[track]
  const innerRadius = track === 'B' ? 0.91 : 0.91
  const outerRadius = 1.105
  const boundaries = []
  let groupBoundary = 0
  if (grouping) {
    for (let index = 0; index < grouping.length - 1; index += 1) {
      groupBoundary += grouping[index]
      boundaries.push(groupBoundary)
    }
  }

  return (
    <g data-track={track} aria-label={`Pista ${track}, ciclo de ${num} posiciones`}>
      <path
        d={createTrackPath(track, outerRadius)}
        fill="none"
        stroke={style.color}
        strokeWidth="1.25"
        strokeOpacity="0.75"
        strokeDasharray={track === 'B' ? '4 5' : undefined}
        data-testid={`art-cycle-${track.toLowerCase()}`}
      />
      {TRACK_CONTOURS[track].map((contour, index) => (
        <path
          key={`track-${track}-contour-${index}`}
          d={contour.path}
          fill="none"
          stroke={index % 5 === 0 ? style.soft : style.color}
          strokeWidth={contour.width}
          strokeOpacity={contour.opacity}
          strokeDasharray={track === 'B' && index % 2 === 0 ? '3 5' : undefined}
        />
      ))}
      {boundaries.map((position, index) => {
        const inner = trackPoint(track, position / num, innerRadius)
        const outer = trackPoint(track, position / num, outerRadius + 0.045)
        return (
          <line
            key={`group-${track}-${index}`}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke={GROUP_COLORS[index % GROUP_COLORS.length]}
            strokeWidth="2"
            strokeLinecap="round"
            data-group-boundary={position}
          />
        )
      })}
      {Array.from({ length: num }, (_, index) => {
        const point = trackPoint(track, index / num, 1)
        const accent = accents[index] ?? 0
        const size = accent === 2 ? 8.4 : accent === 1 ? 6.4 : 5.6
        const activeFill = accent === 2 ? style.strong : accent === 1 ? style.soft : '#0b0e14'
        return (
          <g
            key={`position-${track}-${index}`}
            data-position={index + 1}
            data-accent={['silencio', 'suave', 'fuerte'][accent]}
          >
            {track === 'B' ? (
              <rect
                x={point.x - size / 1.4}
                y={point.y - size / 1.4}
                width={size * 1.4}
                height={size * 1.4}
                rx="1.5"
                transform={`rotate(45 ${point.x} ${point.y})`}
                fill={activeFill}
                stroke={style.color}
                strokeWidth={accent === 0 ? 1.2 : 1}
                strokeDasharray={accent === 0 ? '2.5 2' : undefined}
              />
            ) : (
              <circle
                cx={point.x}
                cy={point.y}
                r={size}
                fill={activeFill}
                stroke={style.color}
                strokeWidth={accent === 0 ? 1.2 : 1}
                strokeDasharray={accent === 0 ? '2.5 2' : undefined}
              />
            )}
            <text
              x={point.x}
              y={point.y + 3}
              textAnchor="middle"
              fill={accent === 0 ? '#f4f2f5' : '#101017'}
              fontSize="8"
              fontWeight="700"
              aria-hidden="true"
            >
              {index + 1}
            </text>
          </g>
        )
      })}
      <text
        x={CX}
        y={track === 'B' ? CY - 116 : CY - 165}
        textAnchor="middle"
        fill={style.soft}
        fontSize="12"
        fontFamily="ui-monospace, monospace"
        fontWeight="700"
        letterSpacing="0.08em"
      >
        {track} · {num} · {duration.toFixed(2)}s
      </text>
    </g>
  )
})

function PhaseMarker({ track, progress, num, currentBeat, reduceMotion, transportState }) {
  const pointProgress = reduceMotion && transportState === 'playing'
    ? (currentBeat >= 0 ? currentBeat : Math.floor(progress * num)) / num
    : progress
  const point = trackPoint(track, pointProgress)
  const style = TRACK_STYLES[track]
  const activeBeat = currentBeat >= 0 &&
    (transportState === 'playing' || transportState === 'paused')
    ? trackPoint(track, currentBeat / num)
    : null

  return (
    <g aria-hidden="true" pointerEvents="none">
      {activeBeat && (track === 'B'
        ? <rect
          x={activeBeat.x - 8}
          y={activeBeat.y - 8}
          width="16"
          height="16"
          transform={`rotate(45 ${activeBeat.x} ${activeBeat.y})`}
          fill="none"
          stroke="#fff1d3"
          strokeWidth="1.6"
          strokeDasharray="3 2"
        />
        : <circle
          cx={activeBeat.x}
          cy={activeBeat.y}
          r="9.5"
          fill="none"
          stroke="#fff1d3"
          strokeWidth="1.6"
        />)}
      {track === 'B'
        ? <rect
          x={point.x - 4.7}
          y={point.y - 4.7}
          width="9.4"
          height="9.4"
          transform={`rotate(45 ${point.x} ${point.y})`}
          fill={style.color}
          stroke="#090b10"
          strokeWidth="1.8"
          data-testid={`art-phase-${track.toLowerCase()}`}
        />
        : <circle
          cx={point.x}
          cy={point.y}
          r="4.8"
          fill={style.strong}
          stroke="#090b10"
          strokeWidth="1.8"
          data-testid={`art-phase-${track.toLowerCase()}`}
        />}
    </g>
  )
}

const StaticMusicStructure = memo(({
  showB,
  num,
  numB,
  denA,
  denB,
  accentsA,
  accentsB,
  groupingA,
  groupingB,
  durationA,
  durationB,
}) => (
  <svg
    className="structure-plane"
    viewBox="0 0 760 500"
    role="img"
    aria-labelledby="art-cycle-title art-cycle-description"
  >
    <title id="art-cycle-title">Ciclo rítmico A{showB ? ' y B' : ''}</title>
    <desc id="art-cycle-description">
      A tiene {num} posiciones de {denA}.{showB ? ` B tiene ${numB} posiciones de ${denB}. Las formas circulares identifican A y las formas de rombo identifican B. El contorno discontinuo representa silencio; punto pequeño, acento suave; punto lleno y cálido, fuerte.` : ''}
      {' '}La posición y el avance se derivan del reloj de audio; una posición en silencio no indica que haya sonado un golpe.
    </desc>
    <TrackStructure
      track="A"
      num={num}
      accents={accentsA}
      grouping={groupingA}
      duration={durationA}
    />
    {showB && (
      <TrackStructure
        track="B"
        num={numB}
        accents={accentsB}
        grouping={groupingB}
        duration={durationB}
      />
    )}
    <circle cx={CX} cy={CY} r="18" fill="#12151d" stroke="#8d7a9c" strokeOpacity="0.66" />
    <circle cx={CX} cy={CY} r="11" fill="none" stroke="#ffc56e" strokeOpacity="0.58" strokeWidth="1.1" />
  </svg>
))

const PhaseOverlay = memo(function PhaseOverlay({
  numA,
  numB,
  progressA,
  progressB,
  currentBeatA,
  currentBeatB,
  showB,
  reduceMotion,
  transportState,
}) {
  return (
    <svg
      className="phase-plane"
      viewBox="0 0 760 500"
      aria-hidden="true"
      focusable="false"
      pointerEvents="none"
    >
      <PhaseMarker
        track="A"
        progress={progressA}
        num={numA}
        currentBeat={currentBeatA}
        reduceMotion={reduceMotion}
        transportState={transportState}
      />
      {showB && (
        <PhaseMarker
          track="B"
          progress={progressB}
          num={numB}
          currentBeat={currentBeatB}
          reduceMotion={reduceMotion}
          transportState={transportState}
        />
      )}
      <circle cx={CX} cy={CY} r="12" fill="#12151d" stroke="#8d7a9c" />
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
  )
})

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
          : 'Cada ciclo sigue su propia fase a partir del reloj de audio.'

  return (
    <Visualizer aria-labelledby="art-visualizer-title">
      <VisualizerHeader>
        <h2 id="art-visualizer-title">El ritmo, en pantalla</h2>
        <p role="status">{status}</p>
      </VisualizerHeader>
      <Visual>
        <svg
          className="artwork-plane"
          viewBox="0 0 760 500"
          aria-hidden="true"
          focusable="false"
          pointerEvents="none"
        >
          <OrganicArtwork />
        </svg>
        <StaticMusicStructure
          showB={showB}
          num={numA}
          numB={numB}
          denA={denA}
          denB={denB}
          accentsA={accentsA}
          accentsB={accentsB}
          groupingA={activeGroupingA}
          groupingB={activeGroupingB}
          durationA={timing.measureA}
          durationB={timing.measureB}
        />
        <PhaseOverlay
          numA={numA}
          numB={numB}
          progressA={progressA}
          progressB={progressB}
          currentBeatA={currentBeatA}
          currentBeatB={currentBeatB}
          showB={showB}
          reduceMotion={reduceMotion}
          transportState={transportState}
        />
      </Visual>
      <TrackLegend aria-label="Leyenda del visualizador rítmico">
        <LegendItem>A · ciclo irregular continuo</LegendItem>
        {showB && <LegendItem $trackB>B · ciclo irregular discontinuo</LegendItem>}
        <span>Vacío: silencio · punto: suave · relleno cálido: fuerte</span>
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
