import React from 'react'
import styled from 'styled-components'
import { useRitmia, useRitmiaRealtime } from '../../context/RitmiaContext'
import { GROUP_COLORS } from '../../music/constants'
import { groupIndexForBeat } from '../../music/groupingSuggestions'

const VisualizerWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem 0;
`

const SvgContainer = styled.div`
  position: relative;
  width: min(100%, 280px);
  aspect-ratio: 1;

  @media (min-width: 640px) {
    width: min(100%, 320px);
  }
`

const BadgesRow = styled.div`
  position: absolute;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
  z-index: 5;
`

const RingBadge = styled.span`
  font-size: 10px;
  padding: 0.25rem 0.65rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $color }) => $color};
  color: #000000;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
`

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
}

export function CircularVisualizer() {
  const {
    level,
    numA,
    denA,
    numB,
    denB,
    activeGroupingA,
    activeGroupingB,
    reduceMotion,
    transportState,
  } = useRitmia()
  const { currentBeatA, currentBeatB } = useRitmiaRealtime()
  const isPlaying = transportState === 'playing'

  const radiusA = 58
  const radiusB = 82

  return (
    <VisualizerWrapper>
      <SvgContainer>
        <svg
          viewBox="0 0 200 200"
          width="100%"
          height="100%"
          style={{ display: 'block' }}
          aria-label="Visualizador circular rítmico"
        >
          <defs>
            <filter id="glowA" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="blurA" />
              <feMerge>
                <feMergeNode in="blurA" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowB" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="blurB" />
              <feMerge>
                <feMergeNode in="blurB" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Anillos de fondo */}
          <circle
            cx="100"
            cy="100"
            r={radiusA}
            fill="none"
            stroke="#1E1E2C"
            strokeWidth="12"
          />
          {level === 3 && (
            <circle
              cx="100"
              cy="100"
              r={radiusB}
              fill="none"
              stroke="#16202A"
              strokeWidth="12"
            />
          )}

          {/* Arcos Compás A */}
          {Array.from({ length: numA }).map((_, i) => {
            const gapRatio = numA > 16 ? 0.68 : 0.86
            const strokeWidthBase = numA > 24 ? 1.2 : numA > 16 ? 1.6 : 2.2
            const strokeWidthActive = numA > 16 ? 3.4 : 4.6
            const startAngle = (i / numA) * 360
            const endAngle = ((i + gapRatio) / numA) * 360

            const grpIdx = activeGroupingA ? groupIndexForBeat(i, activeGroupingA) : 0
            const color =
              level >= 2 && activeGroupingA
                ? GROUP_COLORS[grpIdx % GROUP_COLORS.length]
                : '#FFB800'

            const isActive = currentBeatA === i

            return (
              <path
                key={`arc-a-${i}`}
                d={describeArc(100, 100, radiusA, startAngle, endAngle)}
                fill="none"
                stroke={color}
                strokeWidth={isActive ? strokeWidthActive : strokeWidthBase}
                strokeLinecap="round"
                opacity={isActive ? 1 : 0.55}
                filter={isActive ? 'url(#glowA)' : undefined}
                style={{
                  transition: reduceMotion ? 'none' : 'all 120ms ease',
                  transformOrigin: '100px 100px',
                  transform: isActive && !reduceMotion ? 'scale(1.04)' : 'scale(1)',
                }}
              />
            )
          })}

          {/* Arcos Compás B (Nivel 3) */}
          {level === 3 &&
            Array.from({ length: numB }).map((_, i) => {
              const gapRatio = numB > 16 ? 0.68 : 0.86
              const strokeWidthBase = numB > 24 ? 1.2 : numB > 16 ? 1.6 : 2.2
              const strokeWidthActive = numB > 16 ? 3.4 : 4.6
              const startAngle = (i / numB) * 360
              const endAngle = ((i + gapRatio) / numB) * 360

              const grpIdx = activeGroupingB ? groupIndexForBeat(i, activeGroupingB) : 0
              const color =
                activeGroupingB
                  ? GROUP_COLORS[grpIdx % GROUP_COLORS.length]
                  : '#00E5FF'

              const isActive = currentBeatB === i

              return (
                <path
                  key={`arc-b-${i}`}
                  d={describeArc(100, 100, radiusB, startAngle, endAngle)}
                  fill="none"
                  stroke={color}
                  strokeWidth={isActive ? strokeWidthActive : strokeWidthBase}
                  strokeLinecap="round"
                  opacity={isActive ? 1 : 0.5}
                  filter={isActive ? 'url(#glowB)' : undefined}
                  style={{
                    transition: reduceMotion ? 'none' : 'all 120ms ease',
                    transformOrigin: '100px 100px',
                    transform: isActive && !reduceMotion ? 'scale(1.03)' : 'scale(1)',
                  }}
                />
              )
            })}

          {/* Centro del reloj */}
          <circle cx="100" cy="100" r="7" fill="#F5F5F7" opacity="0.95" />
          <text
            x="100"
            y="103"
            textAnchor="middle"
            fontSize="6"
            fontFamily="monospace"
            fill="#0A0A0F"
            fontWeight="bold"
          >
            {isPlaying ? '●' : transportState === 'paused' ? 'Ⅱ' : '○'}
          </text>
        </svg>

        <BadgesRow>
          <RingBadge $color="#FFB800">
            A {numA}/{denA}
          </RingBadge>
          {level === 3 && (
            <RingBadge $color="#00E5FF">
              B {numB}/{denB}
            </RingBadge>
          )}
        </BadgesRow>
      </SvgContainer>
    </VisualizerWrapper>
  )
}
