import React from 'react'
import styled from 'styled-components'
import { liteControls } from '../../styles/liteSurfaces'
import { useSystemReducedMotion } from '../../hooks/useSystemReducedMotion'
import { audioEngine } from '../../audio/AudioEngine'
import { useRitmia } from '../../context/RitmiaContext'
import { Header } from './Header'
import { LiteLevelNavigation } from './LiteLevelNavigation'
import { LiteTransportDock } from './LiteTransportDock'
import { TimeSignatureBuilder } from '../controls/TimeSignatureBuilder'
import { GroupingInput } from '../controls/GroupingInput'
import { PolyrhythmControls } from '../controls/PolyrhythmControls'
import { BeatGrid } from '../visualizer/BeatGrid'
import { LiteRhythmVisualizer } from '../visualizer/LiteRhythmVisualizer'
import { WelcomeModal } from '../modals/WelcomeModal'
import { TestModal } from '../modals/TestModal'
import { Button } from '../ui/Button'
import { Toggle } from '../ui/Toggle'

const Page = styled.div`
  --lite-header-height: 64px;
  min-height: 100vh;
  ${liteControls}
  header { height: var(--lite-header-height); box-shadow: none; border: 0; }
  header > div { height: 100%; }
  header h1 { font-family: ${({ theme }) => theme.fonts.sans}; font-size: 19px; letter-spacing: -.06em; }
  header > div > div:first-child > div:first-child {
    background: ${({ theme }) => theme.colors.panel}; color: ${({ theme }) => theme.colors.textDim};
    box-shadow: ${({ theme }) => theme.physical.inset}; border-radius: 50%;
  }
  header button { min-height: 44px; }
  button[aria-label='Iniciar reproducción']::before,
  button[aria-label='Reanudar reproducción']::before {
    content: ''; width: 6px; height: 6px; border-radius: 50%;
    background: ${({ theme }) => theme.colors.textMuted};
  }
  button[aria-pressed='true'][aria-label='Iniciar reproducción']::before {
    background: ${({ theme }) => theme.colors.amberNeon};
    box-shadow: 0 0 3px #fff, 0 0 7px ${({ theme }) => theme.colors.amberGlow};
  }
  main button { border-radius: 12px; }
  main [role='status'] { font-size: 12px; color: ${({ theme }) => theme.colors.textDim}; }

  padding-bottom: calc(8.5rem + env(safe-area-inset-bottom, 0px));
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};

  @media (min-width: 901px) {
    padding-bottom: 0;
  }
`

const Main = styled.main`
  width: min(100%, 1080px);
  margin: 0 auto;
  padding: 0.65rem 0.75rem 2rem;
  display: grid;
  gap: 1.2rem;
  @media (min-width: 1000px) {
    grid-template-columns: minmax(0, .85fr) minmax(0, 1.25fr);
    align-items: start;
    > div:first-child { grid-column: 1 / -1; }
  }

  @media (min-width: 760px) {
    padding: 0.9rem 1.5rem 2.5rem;
    gap: 1.4rem;
  }
`

const Intro = styled.div`
  min-height: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  h2 {
    font-size: 15px;
    line-height: 1.2;
  }
`

const Card = styled.section`
  min-width: 0;
  padding: clamp(0.75rem, 2.5vw, 1rem);
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: 26px;
  background: ${({ theme }) => theme.colors.panel};
  box-shadow: ${({ theme }) => theme.physical.shell};
`

const CardHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.3rem 0.75rem;
  margin-bottom: 0.4rem;

  h2 {
    font-size: 15px;
  }

  p, span {
    color: ${({ theme }) => theme.colors.textDim};
    font-size: 11px;
  }
`

const GridSection = styled.div`
  min-width: 0;
  margin-top: 0.5rem;
  margin-bottom: 1.2rem;
  scroll-margin-top: calc(var(--safe-top) + 7rem);
  scroll-margin-bottom: 10rem;
`

const GridHeading = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
  color: ${({ theme }) => theme.colors.textDim};
  font: 11px/1.35 ${({ theme }) => theme.fonts.mono};
`

const Options = styled.details`
  min-width: 0;
  margin-top: 0.7rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 14px;
  background: ${({ theme }) => theme.colors.panel2};
  box-shadow: ${({ theme }) => theme.physical.inset};

  summary {
    min-height: 2.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.45rem 0.75rem;
    color: ${({ theme }) => theme.colors.text};
    font-size: 12px;
    font-weight: 650;
    cursor: pointer;
  }

  summary::after { content: '+'; font-size: 18px; }
  &[open] > summary::after { content: '−'; }

  > div {
    padding: 0 0.75rem 0.75rem;
  }
`

const ModeStatus = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 11px;

  &::before {
    content: '';
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.violetNeon};
    box-shadow: 0 0 5px ${({ theme }) => theme.colors.violetGlow};
  }
`

const SoundOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`

const SoundControl = styled.label`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.35rem 0.65rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.panel};
  color: ${({ theme }) => theme.colors.text};
  font-size: 11px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

const SoundSelect = styled.select`
  min-height: 2rem;
  max-width: 13rem;
  padding: 0 0.4rem;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.panel2};
  color: ${({ theme }) => theme.colors.textBright};
  box-shadow: inset 2px 2px 4px rgba(41,52,61,0.12), inset -2px -2px 4px rgba(255,255,255,0.85);
`

const ErrorStatus = styled.p`
  margin-top: 0.5rem;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 11px;
`

const MODE_NAMES = {
  polirritmia: 'Polirritmia',
  polimetria: 'Polimetría',
  morph: 'Morph',
  clave: 'Clave',
}

export function RitmiaLite({ onPresentationChange }) {
  const {
    level,
    numA,
    denA,
    numB,
    denB,
    accentsA,
    setAccentsA,
    accentsB,
    setAccentsB,
    activeGroupingA,
    activeGroupingB,
    soundKit,
    setSoundKit,
    transportState,
    safeMode,
    setSafeMode,
    setReduceMotion,
    reduceMotion: internalReduceMotion,
    metronome,
    setMetronome,
    openTest,
    mode,
  } = useRitmia()
  const systemReducedMotion = useSystemReducedMotion()
  const reduceMotion = internalReduceMotion || systemReducedMotion
  const showGrouping = level >= 2
  const showTrackB = level === 3

  return (
    <Page className="lite-interface" data-reduced-motion={reduceMotion}>
      <Header variant="lite" onPresentationChange={onPresentationChange} />
      <LiteLevelNavigation />
      <LiteTransportDock />
      <Main>
        <Intro>
          <h2>{level === 1 ? 'Crea un ritmo' : level === 2 ? 'Agrupa el compás' : 'Combina dos pistas'}</h2>
          <Button $variant="panel" $size="sm" onClick={openTest}>Probar lectura</Button>
        </Intro>

        <LiteRhythmVisualizer
          showTrackB={showTrackB}
          showGrouping={showGrouping}
          reduceMotion={reduceMotion}
        />

        <Card aria-label="Edición del patrón">
          <CardHeader>
            <h2>Secuenciador A</h2>
            <p>Silencio → suave → fuerte</p>
          </CardHeader>
          <GridSection>
            <GridHeading>
              <span>A · {numA}/{denA}</span>
              <span>{showGrouping && activeGroupingA ? activeGroupingA.join('+') : '○ silencio · ● suave · ▰ fuerte'}</span>
            </GridHeading>
            <BeatGrid
              trackType="A"
              label="Secuenciador pista A"
              numBeats={numA}
              accents={accentsA}
              onAccentsChange={setAccentsA}
              parsedGrouping={showGrouping ? activeGroupingA : null}
              isValidGrouping={showGrouping && !!activeGroupingA}
              reduceMotionOverride={reduceMotion}
            />
          </GridSection>

          {showTrackB && (
            <GridSection>
              <GridHeading>
                <span>Secuenciador B · {numB}/{denB}</span>
                <ModeStatus>{MODE_NAMES[mode]}</ModeStatus>
              </GridHeading>
              <BeatGrid
                trackType="B"
                label="Secuenciador pista B"
                numBeats={numB}
                accents={accentsB}
                onAccentsChange={setAccentsB}
                parsedGrouping={activeGroupingB}
                isValidGrouping={!!activeGroupingB}
                reduceMotionOverride={reduceMotion}
              />
            </GridSection>
          )}

          <TimeSignatureBuilder compact />

          {showGrouping && <div aria-label="Agrupación de A"><GroupingInput /></div>}

          {showTrackB && (
            <Options open>
              <summary>Opciones de B y modos musicales</summary>
              <div>
                <PolyrhythmControls />
              </div>
            </Options>
          )}

          <Options>
            <summary>Sonido y preferencias</summary>
            <div>
              <SoundOptions>
                <SoundControl>
                  <span>Kit de sonido</span>
                  <SoundSelect
                    aria-label="Kit de sonido"
                    value={soundKit}
                    disabled={transportState === 'playing'}
                    onChange={event => setSoundKit(event.target.value)}
                  >
                    <option value="acoustic">Percusión acústica</option>
                    <option value="synth">Sintetizador original</option>
                  </SoundSelect>
                </SoundControl>
                <Toggle
                  id="lite-metronome"
                  label="Señal de inicio"
                  checked={metronome}
                  onChange={setMetronome}
                />
                <Toggle
                  id="lite-reduce-motion"
                  label="Reducir movimiento"
                  checked={reduceMotion}
                  onChange={setReduceMotion}
                />
                <Toggle
                  id="lite-safe-mode"
                  label="Modo seguro"
                  checked={safeMode}
                  onChange={setSafeMode}
                />
              </SoundOptions>
              {soundKit === 'acoustic' && audioEngine.soundBankError && (
                <ErrorStatus role="status">Muestras no disponibles; se usa síntesis.</ErrorStatus>
              )}
            </div>
          </Options>
        </Card>


      </Main>
      <WelcomeModal />
      <TestModal />
    </Page>
  )
}
