import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { audioEngine } from '../../audio/AudioEngine'
import { Header } from './Header'
import { TimeSignatureBuilder } from '../controls/TimeSignatureBuilder'
import { GroupingInput } from '../controls/GroupingInput'
import { PolyrhythmControls } from '../controls/PolyrhythmControls'
import { BeatGrid } from '../visualizer/BeatGrid'
import { RitmiaArtVisualizer } from '../visualizer/RitmiaArtVisualizer'
import { TestModal } from '../modals/TestModal'
import { Button } from '../ui/Button'
import { Toggle } from '../ui/Toggle'

const Page = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 50% -18%, rgba(201, 111, 160, 0.1), transparent 45%),
    ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
`

const Main = styled.main`
  width: min(100%, 1120px);
  margin: 0 auto;
  padding: 1rem 1rem 5rem;
  display: grid;
  gap: 1rem;

  @media (min-width: 760px) {
    padding: 1.5rem 1.5rem 5rem;
    gap: 1.25rem;
  }
`

const Intro = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;

  h2 {
    font: 500 clamp(1.35rem, 3vw, 2rem)/1.2 ${({ theme }) => theme.fonts.serif};
  }

  p {
    max-width: 58ch;
    margin-top: 0.35rem;
    color: ${({ theme }) => theme.colors.textDim};
    font-size: 14px;
  }
`

const SectionNav = styled.nav`
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const NavButton = styled.button`
  min-height: 2.75rem;
  padding: 0.45rem 0.9rem;
  border-bottom: 2px solid ${({ $active, theme }) => $active ? theme.colors.amber : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.text : theme.colors.textDim};
  font-weight: 600;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`

const Section = styled.section`
  display: grid;
  gap: 1rem;
  min-width: 0;
`

const Card = styled.section`
  min-width: 0;
  padding: clamp(0.9rem, 3vw, 1.35rem);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(21, 27, 37, 0.96), rgba(16, 21, 30, 0.96));
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

const CardHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.4rem 1rem;
  margin-bottom: 0.8rem;

  h3 {
    font: 500 1.1rem/1.3 ${({ theme }) => theme.fonts.serif};
  }

  p {
    color: ${({ theme }) => theme.colors.textDim};
    font-size: 12px;
  }
`

const ControlStack = styled.div`
  display: grid;
  gap: 1rem;
`

const SoundAndOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem;
`

const SoundControl = styled.label`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.panel};
  color: ${({ theme }) => theme.colors.text};
  font-size: 12px;
`

const SoundSelect = styled.select`
  max-width: 13rem;
  min-height: 2rem;
  padding: 0 0.4rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.textBright};

  &:disabled {
    opacity: 0.65;
  }
`

const GridSection = styled.div`
  display: grid;
  gap: 0.55rem;
  min-width: 0;
  margin-top: 0.75rem;
`

const GridHeading = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.25rem 0.75rem;
  color: ${({ theme }) => theme.colors.textDim};
  font: 11px/1.4 ${({ theme }) => theme.fonts.mono};
`

const ActiveSummary = styled.div`
  display: grid;
  gap: 0.4rem;
  padding: 0.8rem 1rem;
  border-left: 3px solid ${({ theme }) => theme.colors.amber};
  border-radius: 0 12px 12px 0;
  background: ${({ theme }) => theme.colors.panel};
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 13px;

  strong {
    color: ${({ theme }) => theme.colors.text};
  }
`

const ExploreIntro = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.8rem 0;

  p {
    max-width: 62ch;
    color: ${({ theme }) => theme.colors.textDim};
    font-size: 13px;
  }
`

function useSystemReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (!window.matchMedia) return undefined
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    if (query.addEventListener) {
      query.addEventListener('change', update)
      return () => query.removeEventListener('change', update)
    }
    query.addListener(update)
    return () => query.removeListener(update)
  }, [])

  return reduced
}

export function RitmiaArt() {
  const {
    level,
    setLevel,
    numA,
    numB,
    denA,
    denB,
    setNumA,
    setDenA,
    groupingA,
    setGroupingA,
    activeGroupingA,
    activeGroupingB,
    mode,
    soundKit,
    setSoundKit,
    transportState,
    reduceMotion,
    setReduceMotion,
    metronome,
    setMetronome,
    safeMode,
    setSafeMode,
    openTest,
    accentsA,
    setAccentsA,
    accentsB,
    setAccentsB,
  } = useRitmia()
  const [section, setSection] = useState('practice')
  const [exploreOpen, setExploreOpen] = useState(false)
  const systemReducedMotion = useSystemReducedMotion()
  const effectiveReduceMotion = reduceMotion || systemReducedMotion
  const showB = level === 3
  const modeNames = {
    polirritmia: 'Polirritmia',
    polimetria: 'Polimetría',
    morph: 'Morph',
    clave: 'Clave',
  }

  useEffect(() => {
    const defaultAccents = accentsA.length === 7 &&
      accentsA[0] === 2 &&
      accentsA.slice(1).every((accent, index) => accent === ([0, 1, 0, 1, 0, 0][index]))
    if (numA === 7 && denA === 8 && groupingA === '3+2+2' && defaultAccents) {
      setNumA(4)
      setDenA(4)
      setAccentsA([2, 0, 1, 0])
      setGroupingA('2+2')
    }
  }, [
    accentsA,
    denA,
    groupingA,
    numA,
    setAccentsA,
    setDenA,
    setGroupingA,
    setNumA,
  ])

  const openExplore = () => {
    setSection('explore')
    setExploreOpen(true)
  }

  return (
    <Page>
      <Header variant="art" />
      <Main>
        <Intro>
          <div>
            <h2>Practicar primero. Explorar después.</h2>
            <p>
              Construye un patrón con A; abre Explorar cuando quieras combinar ciclos,
              agrupaciones y clave. Tus ajustes musicales se mantienen al cambiar de sección.
            </p>
          </div>
          <Button $variant="panel" onClick={openTest}>Probar lectura</Button>
        </Intro>

        <SectionNav aria-label="Secciones de Ritmia Art">
          <NavButton
            type="button"
            $active={section === 'practice'}
            aria-current={section === 'practice' ? 'page' : undefined}
            onClick={() => setSection('practice')}
          >
            Practicar
          </NavButton>
          <NavButton
            type="button"
            $active={section === 'explore'}
            aria-current={section === 'explore' ? 'page' : undefined}
            onClick={() => setSection('explore')}
          >
            Explorar
          </NavButton>
        </SectionNav>

        {section === 'practice' ? (
          <Section aria-label="Practicar ritmo">
            <RitmiaArtVisualizer showTrackB={showB} reduceMotion={effectiveReduceMotion} />

            <Card>
              <CardHeader>
                <h3>Tu patrón</h3>
                <p>Selecciona una posición para alternar silencio, suave y fuerte.</p>
              </CardHeader>
              <ControlStack>
                <TimeSignatureBuilder />
                <SoundAndOptions>
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
                    id="art-metronome"
                    label="Señal de inicio"
                    checked={metronome}
                    onChange={setMetronome}
                  />
                  <Toggle
                    id="art-reduce-motion"
                    label="Reducir movimiento"
                    checked={reduceMotion || systemReducedMotion}
                    onChange={setReduceMotion}
                  />
                  <Toggle
                    id="art-safe-mode"
                    label="Modo seguro"
                    checked={safeMode}
                    onChange={setSafeMode}
                    activeColor="#75d5c5"
                  />
                </SoundAndOptions>
                {soundKit === 'acoustic' && audioEngine.soundBankError && (
                  <p role="status">Muestras no disponibles; se usa síntesis.</p>
                )}
              </ControlStack>

              <GridSection>
                <GridHeading>
                  <span>Secuenciador A · {numA}/{denA}</span>
                  <span>{activeGroupingA ? `Agrupación ${activeGroupingA.join('+')}` : 'Sin agrupación válida'}</span>
                </GridHeading>
                <BeatGrid
                  trackType="A"
                  label="Secuenciador pista A"
                  numBeats={numA}
                  accents={accentsA}
                  onAccentsChange={setAccentsA}
                  parsedGrouping={activeGroupingA}
                  isValidGrouping={!!activeGroupingA}
                  reduceMotionOverride={effectiveReduceMotion}
                />
              </GridSection>

              {showB && (
                <GridSection>
                  <GridHeading>
                    <span>Secuenciador B · {numB}/{denB}</span>
                    <span>{modeNames[mode]} · {activeGroupingB ? `agrupación ${activeGroupingB.join('+')}` : 'sin agrupación válida'}</span>
                  </GridHeading>
                  <BeatGrid
                    trackType="B"
                    label="Secuenciador pista B"
                    numBeats={numB}
                    accents={accentsB}
                    onAccentsChange={setAccentsB}
                    parsedGrouping={activeGroupingB}
                    isValidGrouping={!!activeGroupingB}
                    reduceMotionOverride={effectiveReduceMotion}
                  />
                </GridSection>
              )}
            </Card>

            <ActiveSummary aria-live="polite">
              <strong>Configuración activa</strong>
              <span>A: {numA}/{denA}{activeGroupingA ? ` agrupado ${activeGroupingA.join('+')}` : ''}.</span>
              {showB
                ? <span>B: {numB}/{denB} · {modeNames[mode]}{activeGroupingB ? ` · ${activeGroupingB.join('+')}` : ''}.</span>
                : <span>B está inactiva. Puedes activarla desde Explorar.</span>}
              <Button $variant="ghost" $size="sm" onClick={openExplore}>
                Editar funciones avanzadas
              </Button>
            </ActiveSummary>
          </Section>
        ) : (
          <Section aria-label="Explorar funciones musicales">
            <ExploreIntro>
              <div>
                <h2>Explorar los ciclos</h2>
                <p>
                  La sección revela controles, pero abrirla o cerrarla no cambia el patrón ni el transporte.
                  La pista B solo se activa con el control explícito.
                </p>
              </div>
              <Button
                $variant={showB ? 'outline' : 'accent'}
                aria-pressed={showB}
                onClick={() => setLevel(showB ? 2 : 3)}
              >
                {showB ? 'Desactivar pista B' : 'Activar pista B'}
              </Button>
            </ExploreIntro>

            <ActiveSummary aria-live="polite">
              <strong>Ahora activo</strong>
              <span>A: {numA}/{denA}{activeGroupingA ? ` · ${activeGroupingA.join('+')}` : ''}</span>
              {showB && (
                <span>B: {numB}/{denB} · {modeNames[mode]}{activeGroupingB ? ` · ${activeGroupingB.join('+')}` : ''}</span>
              )}
              {!exploreOpen && (
                <Button $variant="ghost" $size="sm" onClick={() => setExploreOpen(true)}>
                  Mostrar controles de edición
                </Button>
              )}
              {exploreOpen && (
                <Button $variant="ghost" $size="sm" onClick={() => setExploreOpen(false)}>
                  Ocultar controles de edición
                </Button>
              )}
            </ActiveSummary>

            {exploreOpen && (
              <Card>
                <CardHeader>
                  <h3>Agrupación y estructuras</h3>
                  <p>Los controles reutilizan el estado y los cálculos del laboratorio original.</p>
                </CardHeader>
                <ControlStack>
                  <GroupingInput />
                  {showB
                    ? <PolyrhythmControls />
                    : <p>
                      Activa B para editar compás, agrupación, polirritmia, polimetría, morph y clave.
                    </p>}
                </ControlStack>
              </Card>
            )}
          </Section>
        )}
      </Main>
      <TestModal />
    </Page>
  )
}
