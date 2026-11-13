import React from 'react'
import styled from 'styled-components'
import { liteSurface, litePressable } from '../../styles/liteSurfaces'
import { useRitmia } from '../../context/RitmiaContext'

const Navigation = styled.nav`
  width: min(72%, 640px);
  min-width: 0;
`

const LevelGroup = styled.div`
  width: min(100%, 1032px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
`

const LevelButton = styled.button`
  min-width: 0;
  min-height: 2.75rem;
  padding: 0.4rem 0.5rem;
  ${liteSurface}
  ${litePressable}
  position: relative;
  border-radius: ${({ theme }) => theme.glass.capsuleRadius};
  color: ${({ theme }) => theme.colors.text};
  text-align: left;
  padding-left: 1rem;
  &[aria-pressed='true'] { --control-surface: ${({ theme }) => theme.gradients.primary}; }
  &[aria-pressed='true']::after {
    content: ''; position: absolute; right: .8rem; top: .75rem;
    width: 6px; height: 6px; border-radius: 50%;
    background: ${({ theme }) => theme.colors.selectionBorder};
    box-shadow: 0 0 0 2px #ffffff88, 0 0 8px ${({ theme }) => theme.glass.halo};
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

const LEVELS = [
  { value: 1, title: 'Nivel 1', label: 'Ritmo', help: 'Un compás: edita acentos y silencios.' },
  { value: 2, title: 'Nivel 2', label: 'Dos ritmos', help: 'Explorá relaciones entre patrones rítmicos de A y B.' },
]

export function LiteLevelNavigation() {
  const { level, setLevel } = useRitmia()

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
    </Navigation>
  )
}
