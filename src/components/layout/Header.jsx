import React from 'react'
import styled from 'styled-components'
import { glassBar } from '../../styles/glassSurfaces'
import { LiteLevelNavigation } from './LiteLevelNavigation'
import { TourHelpButton } from '../tour/LearningTour'

const Bar = styled.header`
  position: fixed;
  z-index: 50;
  inset: 0 0 auto;
  height: calc(5.5rem + var(--safe-top));
  padding: calc(.65rem + var(--safe-top)) .75rem .65rem;
  border-radius: 0 0 20px 20px;
  ${glassBar}
`
const Inner = styled.div`
  width: min(100%, 1080px);
  height: 100%;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(.6rem, 3vw, 2rem);
  h1 { font-size: clamp(17px, 3vw, 23px); letter-spacing: -.04em; text-shadow: 0 1px 0 #ffffffd4; }
  p { font-size: 11px; color: ${({ theme }) => theme.colors.textDim}; }
  @media (max-width: 600px) { p { display: none; } }
`

const LevelActions = styled.div`
  width: min(74%, 690px);
  min-width: 0;
  display: flex;
  align-items: center;
  gap: .5rem;
  > nav { flex: 1 1 auto; width: auto; }
  > button { flex: 0 0 44px; }
`

export function Header({ onHelp }) {
  return <Bar><Inner>
    <div><h1>Ritmia</h1><p>Laboratorio rítmico</p></div>
    <LevelActions><LiteLevelNavigation /><TourHelpButton onClick={onHelp} /></LevelActions>
  </Inner></Bar>
}
