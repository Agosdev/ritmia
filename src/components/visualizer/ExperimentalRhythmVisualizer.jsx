import React from 'react'
import styled from 'styled-components'
import { useRitmia, useRitmiaRealtime } from '../../context/RitmiaContext'

const CENTER_X = 350
const CENTER_Y = 280
const NODE_RADIUS = 172
const PROGRESS_RADIUS = 207
const TAU = Math.PI * 2
const CIRCUMFERENCE = TAU * PROGRESS_RADIUS

const Section = styled.section`
  min-width: 0;
  padding: clamp(0.75rem, 3vw, 1.5rem);
  overflow: hidden;
  border: 1px solid rgba(221, 175, 212, 0.18);
  border-radius: 22px;
  background:
    radial-gradient(ellipse at 50% 34%, rgba(119, 62, 111, 0.12), transparent 58%),
    linear-gradient(145deg, rgba(17, 22, 32, 0.97), rgba(11, 13, 21, 0.98));
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
`

const Intro = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem 1rem;
  color: #e8dfeb;

  h2 {
    margin: 0;
    font: 500 clamp(1.05rem, 2.5vw, 1.35rem)/1.3 Georgia, 'Times New Roman', serif;
  }

  p {
    margin: 0;
    color: #bec1cf;
    font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
  }
`

const Visual = styled.div`
  width: min(100%, 760px);
  margin: 0 auto;
  aspect-ratio: 1.25;

  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
`

const PulseGrid = styled.div`
  display: flex;
  justify-content: center;
  min-width: 0;
  overflow-x: ${({ $scrollable }) => $scrollable ? 'auto' : 'visible'};
  margin: 0.15rem auto 0;
  max-width: 760px;
  padding: 0.2rem 0;

  ${({ $scrollable }) => $scrollable && `
    justify-content: flex-start;
    overscroll-behavior-inline: contain;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
  `}
`

const PulseTrack = styled.div`
  display: flex;
  flex-wrap: ${({ $scrollable }) => $scrollable ? 'nowrap' : 'wrap'};
  justify-content: center;
  gap: 0.45rem;
  width: ${({ $scrollable }) => $scrollable ? 'max-content' : '100%'};
  min-width: ${({ $scrollable }) => $scrollable ? 'max-content' : '0'};
  margin: 0 auto;

  ${({ $scrollable }) => $scrollable && 'margin-left: 0;'}
`

const PulseButton = styled.button`
  display: grid;
  place-items: center;
  gap: 0.1rem;
  min-width: 0;
  flex: 0 0 2.75rem;
  min-height: 2.8rem;
  padding: 0.25rem;
  border: 1px solid ${({ $accent }) =>
    $accent === 2 ? 'rgba(255, 197, 110, 0.68)' :
      $accent === 1 ? 'rgba(197, 168, 255, 0.58)' : 'rgba(161, 174, 193, 0.36)'};
  border-radius: 10px;
  color: #f4f2f5;
  background: ${({ $accent }) =>
    $accent === 2 ? 'rgba(255, 128, 111, 0.15)' :
      $accent === 1 ? 'rgba(197, 168, 255, 0.1)' : 'rgba(12, 16, 24, 0.85)'};
  cursor: pointer;
  scroll-snap-align: start;

  &:hover { background-color: rgba(255, 128, 111, 0.2); }
  &:focus-visible { outline: 3px solid #fff0a8; outline-offset: 2px; }

  span:first-child {
    font: 600 13px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  span:last-child {
    color: ${({ $accent }) => $accent === 2 ? '#ffd59b' : $accent === 1 ? '#d9c8ff' : '#b4bdcb'};
    font: 9px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    text-transform: uppercase;
  }
`

const Summary = styled.p`
  margin: 0.7rem 0 0;
  color: #c8c6d1;
  text-align: center;
  font-size: 13px;
  line-height: 1.5;

  strong { color: #fff0d4; font-weight: 600; }
`

function pointAt(radius, fraction) {
  const angle = fraction * TAU - Math.PI / 2
  return {
    x: CENTER_X + radius * Math.cos(angle),
    y: CENTER_Y + radius * Math.sin(angle),
  }
}

function makeOrganicContour(radius, phase, amplitude) {
  const points = Array.from({ length: 96 }, (_, index) => {
    const angle = (index / 96) * TAU
    const ripple =
      Math.sin(angle * 3 + phase) * amplitude +
      Math.sin(angle * 5 - phase * 0.7) * amplitude * 0.42 +
      Math.cos(angle * 2 + phase * 0.45) * amplitude * 0.28
    const r = radius + ripple
    return `${(CENTER_X + Math.cos(angle) * r).toFixed(1)},${(CENTER_Y + Math.sin(angle) * r).toFixed(1)}`
  })

  return `M ${points.join(' L ')} Z`
}

const CONTOURS = [
  { d: makeOrganicContour(160, 0.35, 7), color: '#ff806f', width: 1.5, opacity: 0.5 },
  { d: makeOrganicContour(147, 1.6, 5), color: '#ed8fcb', width: 1.1, opacity: 0.43 },
  { d: makeOrganicContour(134, 2.7, 4), color: '#b8a0ff', width: 1.25, opacity: 0.42 },
  { d: makeOrganicContour(121, 0.9, 3), color: '#75d5c5', width: 0.8, opacity: 0.28 },
]

const FIBERS = [
  'M 192 221 C 240 170 291 174 333 202 S 419 238 476 192',
  'M 188 320 C 242 365 280 354 326 336 S 419 310 482 359',
  'M 244 140 C 257 196 292 211 328 236 S 370 303 388 412',
  'M 453 144 C 414 195 409 223 420 268 S 388 343 344 418',
  'M 210 267 C 261 242 297 259 336 285 S 403 314 477 279',
  'M 283 130 C 319 190 356 197 386 223 S 425 280 432 328',
  'M 202 354 C 250 318 278 305 319 309 S 392 351 444 389',
  'M 267 397 C 292 352 315 326 356 292 S 408 228 412 172',
]

const GRAIN = Array.from({ length: 76 }, (_, index) => {
  const x = (index * 137.508 + 31) % 700
  const y = (index * 89.173 + 17) % 560
  const radius = 0.45 + ((index * 17) % 5) * 0.16
  return { x, y, radius, opacity: 0.08 + ((index * 13) % 5) * 0.018 }
})

const ACCENT_LABELS = ['silencio', 'suave', 'fuerte']

const StaticArtwork = React.memo(function StaticArtwork() {
  return (
    <>
      <defs>
        <radialGradient id="rhythm-core" cx="48%" cy="45%" r="62%">
          <stop offset="0%" stopColor="#713957" stopOpacity="0.35" />
          <stop offset="48%" stopColor="#3a294c" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#101521" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rhythm-halo" cx="44%" cy="42%" r="58%">
          <stop offset="0%" stopColor="#ff806f" stopOpacity="0.14" />
          <stop offset="60%" stopColor="#bd66bd" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#69d8f2" stopOpacity="0" />
        </radialGradient>
        <filter id="rhythm-soft-glow" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="13" />
        </filter>
        <linearGradient id="rhythm-progress" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff806f" />
          <stop offset="52%" stopColor="#ed8fcb" />
          <stop offset="100%" stopColor="#b8a0ff" />
        </linearGradient>
      </defs>
      <ellipse cx="350" cy="280" rx="245" ry="220" fill="url(#rhythm-core)" />
      <ellipse
        cx="349"
        cy="278"
        rx="148"
        ry="112"
        fill="url(#rhythm-halo)"
        filter="url(#rhythm-soft-glow)"
      />
      {GRAIN.map((dot, index) => (
        <circle
          key={`grain-${index}`}
          cx={dot.x}
          cy={dot.y}
          r={dot.radius}
          fill={index % 4 === 0 ? '#e5c4ed' : '#b5c8e5'}
          opacity={dot.opacity}
        />
      ))}
      {CONTOURS.map((contour, index) => (
        <path
          key={`contour-${index}`}
          d={contour.d}
          fill="none"
          stroke={contour.color}
          strokeWidth={contour.width}
          strokeOpacity={contour.opacity}
        />
      ))}
      {FIBERS.map((path, index) => (
        <g key={`fiber-${index}`}>
          <path
            d={path}
            fill="none"
            stroke={index % 3 === 0 ? '#ff9caa' : index % 3 === 1 ? '#c39cf4' : '#83d9d4'}
            strokeWidth={index % 2 === 0 ? 1.25 : 0.8}
            strokeOpacity={index % 2 === 0 ? 0.38 : 0.25}
            strokeLinecap="round"
          />
          <path
            d={path}
            fill="none"
            stroke="#f4c8eb"
            strokeWidth="0.5"
            strokeOpacity="0.17"
            transform="translate(2 -1)"
          />
        </g>
      ))}
      <circle cx={CENTER_X} cy={CENTER_Y} r="2" fill="#f3c1dc" opacity="0.72" />
      <circle cx={CENTER_X} cy={CENTER_Y} r="20" fill="none" stroke="#ad8dc4" strokeOpacity="0.23" />
    </>
  )
})

const PulseNodes = React.memo(function PulseNodes({ numA, accentsA }) {
  return Array.from({ length: numA }, (_, index) => {
    const node = pointAt(NODE_RADIUS, index / numA)
    const accent = accentsA[index] ?? 0
    const nodeRadius = accent === 2 ? 11 : accent === 1 ? 9.5 : 8
    const color = accent === 2 ? '#ff806f' : accent === 1 ? '#c5a8ff' : '#9da9ba'

    return (
      <g key={`pulse-${index}`} data-position={index + 1} data-accent={ACCENT_LABELS[accent]}>
        <circle
          cx={node.x}
          cy={node.y}
          r={nodeRadius}
          fill={accent === 0 ? '#101520' : color}
          fillOpacity={accent === 2 ? 0.93 : accent === 1 ? 0.67 : 0.88}
          stroke={color}
          strokeWidth={accent === 2 ? 1.8 : accent === 1 ? 1.4 : 1.1}
          strokeDasharray={accent === 0 ? '2 2' : undefined}
        />
        {accent === 2 && (
          <circle cx={node.x} cy={node.y} r="3" fill="#ffd59b" opacity="0.9" />
        )}
        {accent === 1 && (
          <circle cx={node.x} cy={node.y} r="2" fill="#f5ecff" opacity="0.9" />
        )}
        <text
          x={node.x}
          y={node.y + 3.5}
          textAnchor="middle"
          fill="#fff9f7"
          fontSize={numA > 20 ? 9 : 11}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontWeight="700"
          stroke="#11131b"
          strokeWidth="2.4"
          paintOrder="stroke"
        >
          {index + 1}
        </text>
      </g>
    )
  })
})

const RealtimeIndicators = React.memo(function RealtimeIndicators({
  transportState,
  reduceMotion,
  numA,
  accentsA,
  currentBeatA,
  progressA,
  stepA,
}) {
  const progress = Math.max(0, Math.min(1, progressA))
  const phasePosition = Math.min(numA - 1, Math.floor(progress * numA))
  const isPlaying = transportState === 'playing'
  const activePosition = transportState !== 'stopped'
    ? currentBeatA >= 0 ? Math.min(currentBeatA, numA - 1) : phasePosition
    : -1
  const canAnimateAccent = isPlaying && !reduceMotion && stepA >= 0.12
  const accent = activePosition >= 0 ? accentsA[activePosition] ?? 0 : 0
  const strongAttack = canAnimateAccent && currentBeatA === activePosition && accent === 2
  const softAttack = canAnimateAccent && stepA >= 0.18 &&
    currentBeatA === activePosition && accent === 1
  const marker = pointAt(PROGRESS_RADIUS, progress)

  return (
    <>
      {!reduceMotion && transportState !== 'stopped' && (
        <>
          <circle
            cx={CENTER_X}
            cy={CENTER_Y}
            r={PROGRESS_RADIUS}
            fill="none"
            stroke="url(#rhythm-progress)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            transform={`rotate(-90 ${CENTER_X} ${CENTER_Y})`}
            data-testid="cycle-progress"
          />
          <circle cx={marker.x} cy={marker.y} r="4.2" fill="#ffd7d0" opacity="0.92" />
          <circle cx={marker.x} cy={marker.y} r="8" fill="#ff806f" opacity="0.13" />
        </>
      )}
      {activePosition >= 0 && (() => {
        const node = pointAt(NODE_RADIUS, activePosition / numA)
        const activeRadius = strongAttack ? 22 : softAttack ? 19 : 17
        return (
          <g>
            {strongAttack && (
              <circle cx={node.x} cy={node.y} r="16" fill="#ff806f" opacity="0.12" />
            )}
            <circle
              cx={node.x}
              cy={node.y}
              r={activeRadius}
              fill="none"
              stroke={strongAttack ? '#ffc56e' : '#fff0d4'}
              strokeWidth={strongAttack ? 1.8 : 1.2}
              strokeOpacity={strongAttack ? 0.76 : 0.62}
            />
          </g>
        )
      })()}
    </>
  )
})

const PulseControls = React.memo(function PulseControls({ accentsA, numA, setAccentsA }) {
  const isScrollable = numA >= 16

  const toggleAccent = index => {
    setAccentsA(previous => previous.map((accent, position) =>
      position === index ? (accent + 1) % 3 : accent
    ))
  }

  return (
    <>
      <PulseGrid
        key={numA}
        $scrollable={isScrollable}
        role="group"
        aria-label="Acentos de la pista A"
        aria-describedby={isScrollable ? 'experimental-grid-scroll-help' : undefined}
      >
        <PulseTrack $scrollable={isScrollable}>
          {Array.from({ length: numA }, (_, index) => {
            const accent = accentsA[index] ?? 0
            return (
              <PulseButton
                key={`accent-control-${index}`}
                type="button"
                $accent={accent}
                onClick={() => toggleAccent(index)}
                aria-label={`Posición ${index + 1}: ${ACCENT_LABELS[accent]}. Cambiar acento`}
                title={`Posición ${index + 1}: ${ACCENT_LABELS[accent]}`}
              >
                <span>{index + 1}</span>
                <span>{accent === 2 ? 'F' : accent === 1 ? 'S' : '—'}</span>
              </PulseButton>
            )
          })}
        </PulseTrack>
      </PulseGrid>
      {isScrollable && (
        <span id="experimental-grid-scroll-help" className="sr-only">
          Grilla desplazable horizontalmente. Al avanzar con el teclado, los pulsos se desplazan a la vista.
        </span>
      )}
    </>
  )
})

export function ExperimentalRhythmVisualizer({ reduceMotion }) {
  const { accentsA, numA, denA, setAccentsA, transportState, timing } = useRitmia()
  const { currentBeatA, progressA } = useRitmiaRealtime()
  const isPlaying = transportState === 'playing'
  const progress = Math.max(0, Math.min(1, progressA))
  const phasePosition = Math.min(numA - 1, Math.floor(progress * numA))
  const activePosition = transportState !== 'stopped'
    ? currentBeatA >= 0 ? Math.min(currentBeatA, numA - 1) : phasePosition
    : -1
  const transportLabel = isPlaying
    ? `posición ${activePosition + 1} de ${numA}`
    : transportState === 'paused'
      ? `en pausa · posición ${activePosition + 1} de ${numA}`
      : 'patrón en reposo'
  return (
    <Section aria-labelledby="experimental-visualizer-title">
      <Intro>
        <h2 id="experimental-visualizer-title">Ciclo rítmico · A {numA}/{denA}</h2>
        <p>{transportLabel}</p>
      </Intro>

      <Visual>
        <svg
          viewBox="0 0 700 560"
          role="img"
          aria-labelledby="rhythm-art-title rhythm-art-description"
        >
          <title id="rhythm-art-title">Visualización del ciclo rítmico A</title>
          <desc id="rhythm-art-description">
            {numA} posiciones distribuidas en un ciclo. El contorno de cada posición indica
            si está en silencio, tiene acento suave o fuerte. La posición temporal no implica sonido.
          </desc>
          <StaticArtwork />

          <circle
            cx={CENTER_X}
            cy={CENTER_Y}
            r={PROGRESS_RADIUS}
            fill="none"
            stroke="#8990a7"
            strokeOpacity="0.34"
            strokeWidth="1.5"
            data-testid="cycle-trajectory"
          />
          <RealtimeIndicators
            transportState={transportState}
            reduceMotion={reduceMotion}
            numA={numA}
            accentsA={accentsA}
            currentBeatA={currentBeatA}
            progressA={progressA}
            stepA={timing.stepA}
          />
          <PulseNodes numA={numA} accentsA={accentsA} />
        </svg>
      </Visual>

      <PulseControls accentsA={accentsA} numA={numA} setAccentsA={setAccentsA} />

      <Summary>
        {transportState !== 'stopped'
          ? <>{transportState === 'paused' ? 'Pausa en' : 'Posición actual:'} <strong>{activePosition + 1} de {numA}</strong>. Su contorno indica fase, no confirma un sonido.</>
          : <>Silencio, suave y fuerte permanecen visibles en reposo. Activa una posición para recorrer sus tres estados.</>}
      </Summary>
    </Section>
  )
}
