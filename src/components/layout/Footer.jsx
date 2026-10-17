import React from 'react'
import styled from 'styled-components'
import { MAX_LCM } from '../../music/constants'

const FooterContainer = styled.footer`
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 3rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textDim};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const Bullet = styled.span`
  color: ${({ theme }) => theme.colors.borderStrong};
`

export function Footer() {
  return (
    <FooterContainer>
      <span>Ritmia — Web Audio API pura, reloj AudioContext.currentTime, MAX_NUM 32, LCM cap {MAX_LCM}</span>
      <Bullet>•</Bullet>
      <span>Presets: 12/4, 12/8, 12/16, 15/8, 16/8, 24/16 + auto-grouping</span>
      <Bullet>•</Bullet>
      <span>Visualización reactiva sincronizada locked a audio con requestAnimationFrame</span>
    </FooterContainer>
  )
}
