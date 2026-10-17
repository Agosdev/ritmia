import React from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { Toggle } from '../ui/Toggle'

const TabsRow = styled.div`
  max-width: 1280px;
  margin: 1rem auto 0;
  padding: 0 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;

  @media (min-width: 768px) {
    padding: 0 1.5rem;
  }
`

const LevelPillGroup = styled.div`
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.panel};
  border: 1px solid ${({ theme }) => theme.colors.border};
`

const LevelTabButton = styled.button`
  height: 2.25rem;
  padding: 0 1rem;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: 12px;
  font-weight: 500;
  transition: ${({ theme }) => theme.transitions.fast};
  color: ${({ $isActive, theme }) => ($isActive ? '#000000' : theme.colors.textDim)};
  background: ${({ $isActive }) => ($isActive ? '#ffffff' : 'transparent')};

  &:hover {
    color: ${({ $isActive, theme }) => ($isActive ? '#000000' : theme.colors.textBright)};
  }
`

const TogglesGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`

export function LevelTabs() {
  const {
    level,
    setLevel,
    safeMode,
    setSafeMode,
    reduceMotion,
    setReduceMotion,
    metronome,
    setMetronome,
  } = useRitmia()

  const levels = [
    { id: 1, label: 'Nivel 1 — Un compás' },
    { id: 2, label: 'Nivel 2 — Agrupa' },
    { id: 3, label: 'Nivel 3 — Polirritmia' },
  ]

  return (
    <TabsRow>
      <LevelPillGroup role="tablist" aria-label="Nivel de dificultad pedagógica">
        {levels.map(l => (
          <LevelTabButton
            key={l.id}
            role="tab"
            aria-selected={level === l.id}
            $isActive={level === l.id}
            onClick={() => setLevel(l.id)}
          >
            {l.label}
          </LevelTabButton>
        ))}
      </LevelPillGroup>

      <TogglesGroup>
        <Toggle
          id="toggle-safe-mode"
          label="Modo seguro"
          checked={safeMode}
          onChange={setSafeMode}
          activeColor="#34d399"
        />
        <Toggle
          id="toggle-reduce-motion"
          label="Reducir movimiento"
          checked={reduceMotion}
          onChange={setReduceMotion}
        />
        <Toggle
          id="toggle-metronome"
          label="Metrónomo 1"
          checked={metronome}
          onChange={setMetronome}
          activeColor="#ffb800"
        />
      </TogglesGroup>
    </TabsRow>
  )
}
