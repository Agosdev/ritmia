import React from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { audioEngine } from '../../audio/AudioEngine'
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

  @media (max-width: 520px) {
    width: 100%;
    border-radius: ${({ theme }) => theme.radii.md};
  }
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

  @media (max-width: 520px) {
    height: auto;
    min-height: 2.75rem;
    flex: 1;
    padding: 0.35rem 0.45rem;
    line-height: 1.25;
  }

  &:hover {
    color: ${({ $isActive, theme }) => ($isActive ? '#000000' : theme.colors.textBright)};
  }
`

const TogglesGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 520px) {
    width: 100%;
  }
`

const SoundKitControl = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.panel};
  color: ${({ theme }) => theme.colors.text};
  font-size: 11px;
`

const SoundKitSelect = styled.select`
  min-height: 2rem;
  max-width: 13rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  padding: 0 0.4rem;
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.textBright};

  &:disabled {
    opacity: 0.65;
  }
`

const SoundKitStatus = styled.span`
  color: ${({ theme }) => theme.colors.amber};
  font-size: 10px;
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
    soundKit,
    setSoundKit,
    transportState,
  } = useRitmia()

  const levels = [
    { id: 1, label: 'Nivel 1 — Un compás' },
    { id: 2, label: 'Nivel 2 — Agrupa' },
    { id: 3, label: 'Nivel 3 — Polirritmia' },
  ]

  return (
    <TabsRow>
      <LevelPillGroup role="group" aria-label="Nivel de dificultad pedagógica">
        {levels.map(l => (
          <LevelTabButton
            key={l.id}
            type="button"
            aria-pressed={level === l.id}
            $isActive={level === l.id}
            onClick={() => setLevel(l.id)}
          >
            {l.label}
          </LevelTabButton>
        ))}
      </LevelPillGroup>

      <TogglesGroup>
        <SoundKitControl>
          <span>Kit de sonido</span>
          <SoundKitSelect
            aria-label="Kit de sonido"
            value={soundKit}
            disabled={transportState === 'playing'}
            onChange={event => setSoundKit(event.target.value)}
          >
            <option value="acoustic">Percusión acústica</option>
            <option value="synth">Sintetizador original</option>
          </SoundKitSelect>
        </SoundKitControl>
        {soundKit === 'acoustic' && audioEngine.soundBankError && (
          <SoundKitStatus role="status">Muestras no disponibles; se usa síntesis.</SoundKitStatus>
        )}
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
