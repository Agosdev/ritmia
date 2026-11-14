import React, { useEffect } from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { MAX_BPM, MIN_BPM } from '../../music/constants'
import { TransportActions } from './TransportActions'
import { PresetSelect } from '../controls/MusicalPresets'
import { glassBar } from '../../styles/glassSurfaces'
import { RangeInput } from '../ui/RangeInput'
import { Button } from '../ui/Button'

const Dock = styled.div`
  position: fixed;
  z-index: 45;
  inset-inline: 0;
  bottom: var(--lite-keyboard-inset, 0px);
  padding: .55rem .75rem calc(.55rem + env(safe-area-inset-bottom, 0px));
  border-radius: 24px 24px 0 0;
  ${glassBar}
  box-shadow: ${({ theme }) => theme.physical.dock};
`

const DockInner = styled.div`
  width: min(100%, 64rem);
  margin: 0 auto;
  display: grid;
  gap: 0.5rem;
`

const BpmControl = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(4rem, 1fr) 3.25rem;
  align-items: center;
  gap: 0.65rem;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`

const BpmRange = styled(RangeInput)`
  width: 100%;
  min-width: 0;
`

const BpmNumber = styled.input`
  width: 3.25rem;
  height: 2rem;
  border: 1px solid ${({ theme }) => theme.glass.rim};
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.glass.field};
  box-shadow: ${({ theme }) => theme.physical.inset};
  color: ${({ theme }) => theme.colors.textBright};
  text-align: center;
  font: 600 13px ${({ theme }) => theme.fonts.mono};
`

const BpmSuggestion = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .5rem;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 11px;
  line-height: 1.3;
  button { min-height: 32px; padding: .25rem .55rem; font-size: 11px; }
`

const Actions = styled.div`
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(0, .8fr) minmax(0, 1.3fr);
  gap: 0.45rem;

  select { background: ${({ theme }) => theme.gradients.preset}; }
  @media (max-width: 600px) {
    grid-template-columns: 52px 52px minmax(0, 1fr);
    .transport-text { display: none; }
    .transport-symbol { font-size: 21px; line-height: 1; }
  }

  button {
    min-width: 0;
    min-height: 52px;
    padding: 0.4rem 0.5rem;
    white-space: nowrap;
    font-size: 11px;
  }
`

export function LiteTransportDock() {
  const { bpm, setBpm, suggestedBpm } = useRitmia()

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return undefined

    const updateKeyboardInset = () => {
      const bottom = Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height)
      document.documentElement.style.setProperty('--lite-keyboard-inset', `${bottom}px`)
    }

    updateKeyboardInset()
    viewport.addEventListener('resize', updateKeyboardInset)
    viewport.addEventListener('scroll', updateKeyboardInset)
    return () => {
      viewport.removeEventListener('resize', updateKeyboardInset)
      viewport.removeEventListener('scroll', updateKeyboardInset)
      document.documentElement.style.removeProperty('--lite-keyboard-inset')
    }
  }, [])

  return (
    <Dock data-testid="lite-mobile-transport">
      <DockInner role="group" aria-label="Controles de reproducción">
        <BpmControl data-tour-target="bpm">
          <span>BPM</span>
          <BpmRange
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={event => setBpm(parseInt(event.target.value, 10))}
            aria-label="Ajustar tempo BPM"
          />
          <BpmNumber
            type="number"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={event => {
              if (!event.target.value.trim()) return
              const value = Number(event.target.value)
              if (Number.isInteger(value)) setBpm(Math.min(MAX_BPM, Math.max(MIN_BPM, value)))
            }}
            aria-label="Valor numérico BPM"
          />
        </BpmControl>
        {suggestedBpm !== null && <BpmSuggestion>
          <span role="status">Sugerido para este ritmo: {suggestedBpm} BPM</span>
          {bpm !== suggestedBpm && <Button type="button" $variant="ghost" $size="sm" onClick={() => setBpm(suggestedBpm)}>
            Usar BPM sugerido
          </Button>}
        </BpmSuggestion>}
        <Actions data-testid="transport-actions" data-tour-target="transport">
          <TransportActions />
          <PresetSelect />
        </Actions>
      </DockInner>
    </Dock>
  )
}
