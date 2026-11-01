import React from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { Button, IconButton } from '../ui/Button'
import { MIN_BPM, MAX_BPM } from '../../music/constants'
import { TransportActions } from './TransportActions'

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
  padding: ${({ $isLite }) => $isLite ? '0.45rem 1rem' : '0.75rem 1rem'};
  display: flex;
  flex-wrap: ${({ $isLite }) => $isLite ? 'nowrap' : 'wrap'};
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;

  @media (min-width: 768px) {
    padding: ${({ $isLite }) => $isLite ? '0.5rem 1.5rem' : '0.75rem 1.5rem'};
  }

  @media (max-width: 900px) {
    ${({ $isLite }) => $isLite && `
      gap: 0.5rem;
      padding: 0.4rem 0.75rem;
    `}
  }
`

const BrandSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;

  ${({ theme }) => theme.variant === 'lite' && `
    gap: 0.55rem;
  `}
`

const Titles = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`

const Title = styled.h1`
  font-family: ${({ theme }) => theme.fonts.serif};
  font-size: ${({ theme }) => theme.variant === 'lite' ? '17px' : '18px'};
  line-height: 1.1;
  letter-spacing: -0.02em;

  @media (min-width: 768px) {
    font-size: ${({ theme }) => theme.variant === 'lite' ? '18px' : '20px'};
  }

  @media (max-width: 380px) {
    font-size: ${({ theme }) => theme.variant === 'lite' ? '15px' : '18px'};
  }
`

const Subtitle = styled.p`
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textDim};

  ${({ theme }) => theme.variant === 'lite' && 'display: none;'}
`

const ControlsSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 520px) {
    ${({ $isLite }) => !$isLite && `
      width: 100%;
      flex-wrap: wrap;
    `}
  }

  ${({ $isLite }) => $isLite && `
    flex: 0 0 auto;
    gap: 0.35rem;
  `}
`

const DesktopPlayback = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex-wrap: ${({ $isLite }) => $isLite ? 'nowrap' : 'wrap'};

  @media (max-width: 900px) {
    ${({ $isLite }) => $isLite && 'display: none;'}
  }

  @media (max-width: 520px) {
    ${({ $isLite }) => !$isLite && 'width: 100%;'}
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

export function Header() {
  const { bpm, setBpm, setIsWelcomeOpen } = useRitmia()
  return <HeaderContainer><HeaderInner $isLite>
    <BrandSection><Titles><Title>Ritmia</Title><Subtitle style={{ display: 'block', letterSpacing: 0, textTransform: 'none' }}>Laboratorio rítmico interactivo</Subtitle></Titles></BrandSection>
    <ControlsSection $isLite>
      <DesktopPlayback $isLite role="group" aria-label="Controles de reproducción">
        <BpmBox><BpmLabel>BPM</BpmLabel>
          <BpmRange type="range" min={MIN_BPM} max={MAX_BPM} value={bpm} onChange={e => setBpm(Number(e.target.value))} aria-label="Ajustar tempo BPM" />
          <BpmNumber type="number" min={MIN_BPM} max={MAX_BPM} value={bpm} onChange={e => { const n = Number(e.target.value); if (Number.isInteger(n) && e.target.value) setBpm(Math.max(MIN_BPM, Math.min(MAX_BPM, n))) }} aria-label="Valor numérico BPM" />
        </BpmBox>
        <TransportActions id="desktop" />
      </DesktopPlayback>
      <IconButton onClick={() => setIsWelcomeOpen(true)} aria-label="Abrir guía de uso">?</IconButton>
    </ControlsSection>
  </HeaderInner></HeaderContainer>
}
