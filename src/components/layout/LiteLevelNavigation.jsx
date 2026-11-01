import React from 'react'
import styled from 'styled-components'
import { liteSurface, litePressable } from '../../styles/liteSurfaces'
import { useRitmia } from '../../context/RitmiaContext'

const Navigation = styled.nav`
  position: sticky;
  top: calc(var(--safe-top) + var(--lite-header-height, 3.5rem));
  z-index: 25;
  padding: 0.45rem max(0.75rem, calc((100% - 1120px) / 2));
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgGlass};


  @media (max-width: 380px) {
    padding-inline: 0.5rem;
  }
`

const LevelGroup = styled.div`
  width: min(100%, 1032px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
`

const LevelButton = styled.button`
  min-width: 0;
  min-height: 2.75rem;
  padding: 0.4rem 0.5rem;
  ${liteSurface}
  ${litePressable}
  position: relative;
  border-radius: 16px;
  color: ${({ theme }) => theme.colors.text};
  text-align: left;
  padding-left: 1rem;
  &[aria-pressed='true']::after {
    content: ''; position: absolute; right: .8rem; top: .75rem;
    width: 6px; height: 6px; border-radius: 50%;
    background: ${({ theme }) => theme.colors.text};
  }

  strong, span {
    display: block;
  }

  strong {
    font-size: 12px;
    line-height: 1.2;
  }

  span {
    margin-top: 0.1rem;
    font-size: 10px;
    line-height: 1.2;
  }

  @media (max-width: 520px) {
    min-height: 3.5rem;
    padding-inline: 0.25rem;
    text-align: center;

    span { font-size: 10px; }
    &[aria-pressed='true']::after { right: .35rem; top: .4rem; width: 4px; height: 4px; }
  }
`

const LevelHelp = styled.p`
  width: min(100%, 1032px);
  margin: 0.35rem auto 0;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 11px;

  @media (max-width: 520px) {
    display: none;
  }
`

const LEVELS = [
  { value: 1, title: 'Nivel 1', label: 'Ritmo', help: 'Un compás: edita acentos y silencios.' },
  { value: 2, title: 'Nivel 2', label: 'Agrupaciones', help: 'Añade agrupaciones aditivas al compás A.' },
  { value: 3, title: 'Nivel 3', label: 'Dos pistas', help: 'Explora A/B, polirritmia, polimetría, Morph y clave.' },
]

export function LiteLevelNavigation() {
  const { level, setLevel } = useRitmia()
  const activeLevel = LEVELS.find(item => item.value === level) ?? LEVELS[0]

  return (
    <Navigation aria-label="Niveles musicales">
      <LevelGroup>
        {LEVELS.map(item => (
          <LevelButton
            aria-label={`${item.title} — ${item.label}`}
            key={item.value}
            type="button"
            aria-pressed={level === item.value}
            $active={level === item.value}
            onClick={() => setLevel(item.value)}
          >
            <strong>{item.title}</strong>
            <span>{item.label}</span>
          </LevelButton>
        ))}
      </LevelGroup>
      <LevelHelp aria-live="polite">{activeLevel.help}</LevelHelp>
    </Navigation>
  )
}
