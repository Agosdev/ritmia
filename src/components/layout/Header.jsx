import React from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { Button, IconButton } from '../ui/Button'
import { MIN_BPM, MAX_BPM } from '../../music/constants'
import { Badge } from '../ui/Badge'

const HeaderContainer = styled.header`
  position: sticky;
  top: var(--safe-top);
  z-index: 30;
  backdrop-filter: ${({ theme }) => theme.variant === 'lite' ? 'none' : 'blur(20px)'};
  -webkit-backdrop-filter: ${({ theme }) => theme.variant === 'lite' ? 'none' : 'blur(20px)'};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgGlass};
  box-shadow: ${({ theme }) => theme.variant === 'lite' ? theme.shadows.sm : 'none'};
`

const HeaderInner = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0.75rem 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;

  @media (min-width: 768px) {
    padding: 0.75rem 1.5rem;
  }
`

const BrandSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const VersionBadge = styled.div`
  width: 2.25rem;
  height: 2.25rem;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.amber};
  color: ${({ theme }) => theme.variant === 'lite' ? '#ffffff' : '#000000'};
  display: grid;
  place-items: center;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: 700;
  font-size: 11px;
`

const Titles = styled.div`
  display: flex;
  flex-direction: column;
`

const Title = styled.h1`
  font-family: ${({ theme }) => theme.fonts.serif};
  font-size: 18px;
  line-height: 1.1;
  letter-spacing: -0.02em;

  @media (min-width: 768px) {
    font-size: 20px;
  }
`

const Subtitle = styled.p`
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textDim};
`

const TechBadges = styled.div`
  display: none;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1.25rem;

  @media (min-width: 880px) {
    display: flex;
  }
`

const ControlsSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 520px) {
    width: 100%;
    flex-wrap: wrap;
  }
`

const BpmBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: ${({ theme }) => theme.colors.panel};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 0 0.85rem;
  height: 2.75rem;
  box-shadow: ${({ theme }) => theme.variant === 'lite' ? theme.shadows.glowAmber : 'none'};

  @media (max-width: 520px) {
    flex: 1 1 190px;
    min-width: 0;
    gap: 0.4rem;
    padding: 0 0.55rem;
  }
`

const BpmLabel = styled.span`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.colors.textDim};
  font-weight: 600;
`

const BpmRange = styled.input`
  width: 80px;

  @media (min-width: 768px) {
    width: 120px;
  }

  @media (max-width: 520px) {
    width: auto;
    min-width: 48px;
    flex: 1;
  }
`

const BpmNumber = styled.input`
  width: 52px;
  height: 2rem;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.variant === 'lite' ? theme.colors.panel2 : theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  text-align: center;
  font-size: 13px;
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.textBright};
  box-shadow: ${({ theme }) => theme.variant === 'lite' ? 'inset 2px 2px 4px #d1cfca, inset -2px -2px 4px #ffffff' : 'none'};
`

const PresentationSwitch = styled.div`
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.panel2};
  box-shadow: ${({ theme }) => theme.variant === 'lite' ? theme.shadows.glowAmber : 'none'};
`

const PresentationButton = styled.button`
  min-height: 2.25rem;
  padding: 0.35rem 0.7rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $active, theme }) => $active ? theme.colors.panelLight : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.textBright : theme.colors.textDim};
  font-size: 11px;
  font-weight: 650;
  box-shadow: ${({ $active, theme }) =>
    $active && theme.variant === 'lite' ? '2px 2px 5px #c7c5bf, -2px -2px 5px #ffffff' : 'none'};

  &:hover {
    color: ${({ theme }) => theme.colors.textBright};
  }
`

export function Header({ variant = 'lab', onPresentationChange }) {
  const isArt = variant === 'art'
  const isLite = variant === 'lite'
  const isLab = variant === 'lab'
  const {
    bpm,
    setBpm,
    transportState,
    startPlayback,
    pausePlayback,
    stopPlayback,
    setIsWelcomeOpen,
  } = useRitmia()
  const isPlaying = transportState === 'playing'

  return (
    <HeaderContainer>
      <HeaderInner>
        <BrandSection>
          <VersionBadge>v3.1</VersionBadge>
          <Titles>
            <Title>{isArt ? 'Ritmia Art' : isLite ? 'Ritmia Lite' : 'Ritmia — Lab Rítmico'}</Title>
            <Subtitle>
              {isArt
                ? 'Un espacio para escuchar y explorar ritmos'
                : isLite
                  ? 'Un instrumento para escuchar y explorar ritmos'
                  : 'Precisión Total — 1 a 32 pulsos sin drift'}
            </Subtitle>
          </Titles>
          {isLab && (
            <TechBadges>
              <Badge $variant="pill">lookahead 100ms</Badge>
              <Badge $variant="pill">schedule 25ms</Badge>
              <Badge $variant="pill">AudioContext.master</Badge>
            </TechBadges>
          )}
        </BrandSection>

        <ControlsSection>
          {(isArt || isLite) && onPresentationChange && (
            <PresentationSwitch role="group" aria-label="Presentación visual">
              <PresentationButton
                type="button"
                $active={isLite}
                aria-pressed={isLite}
                onClick={() => onPresentationChange('lite')}
              >
                Lite
              </PresentationButton>
              <PresentationButton
                type="button"
                $active={isArt}
                aria-pressed={isArt}
                onClick={() => onPresentationChange('art')}
              >
                Art
              </PresentationButton>
            </PresentationSwitch>
          )}
          <BpmBox>
            <BpmLabel>BPM</BpmLabel>
            <BpmRange
              type="range"
              min={MIN_BPM}
              max={MAX_BPM}
              value={bpm}
              onChange={e => setBpm(parseInt(e.target.value, 10))}
              aria-label="Ajustar tempo BPM"
            />
            <BpmNumber
              type="number"
              min={MIN_BPM}
              max={MAX_BPM}
              value={bpm}
              onChange={e => {
                if (!e.target.value.trim()) return
                const val = Number(e.target.value)
                if (Number.isInteger(val)) {
                  setBpm(Math.min(MAX_BPM, Math.max(MIN_BPM, val)))
                }
              }}
              aria-label="Valor numérico BPM"
            />
          </BpmBox>

          <Button
            $variant={isArt || isLite ? 'accent' : 'primary'}
            $height="2.75rem"
            onClick={startPlayback}
            style={{ minWidth: '92px' }}
            id="play-button"
            aria-label={transportState === 'paused' ? 'Reanudar reproducción' : 'Iniciar reproducción'}
            aria-pressed={isPlaying}
          >
            {transportState === 'paused' ? '▶ REANUDAR' : '▶ PLAY'}
          </Button>

          <Button
            $variant="outline"
            $height="2.75rem"
            onClick={pausePlayback}
            disabled={!isPlaying}
            aria-label="Pausar reproducción"
          >
            Ⅱ PAUSA
          </Button>

          <Button
            $variant="outline"
            $height="2.75rem"
            onClick={stopPlayback}
            disabled={transportState === 'stopped'}
            aria-label="Reiniciar ciclo"
          >
            ↺ RESET
          </Button>

          <IconButton
            onClick={() => setIsWelcomeOpen(true)}
            title="Guía y Ayuda"
            aria-label="Abrir guía de uso"
          >
            ?
          </IconButton>
        </ControlsSection>
      </HeaderInner>
    </HeaderContainer>
  )
}
