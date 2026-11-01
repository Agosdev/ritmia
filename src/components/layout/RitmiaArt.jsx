import React, { lazy, Suspense, useEffect, useState } from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { audioEngine } from '../../audio/AudioEngine'
import { Header } from './Header'
import { LiteTransportDock } from './LiteTransportDock'
import { TimeSignatureBuilder } from '../controls/TimeSignatureBuilder'
import { GroupingInput } from '../controls/GroupingInput'
import { PolyrhythmControls } from '../controls/PolyrhythmControls'
import { BeatGrid } from '../visualizer/BeatGrid'
import { LiteRhythmVisualizer } from '../visualizer/LiteRhythmVisualizer'
import { TestModal } from '../modals/TestModal'
import { WelcomeModal } from '../modals/WelcomeModal'
import { Button } from '../ui/Button'
import { Toggle } from '../ui/Toggle'

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.variant === 'lite'
    ? theme.colors.bg
    : `radial-gradient(ellipse at 50% -18%, rgba(201, 111, 160, 0.1), transparent 45%), ${theme.colors.bg}`};
  color: ${({ theme }) => theme.colors.text};
  ${({ $isLite }) => $isLite && `
    @media (max-width: 900px) {
      padding-bottom: calc(8.5rem + env(safe-area-inset-bottom, 0px));
    }
  `}
`

const Main = styled.main`
  width: min(100%, 1120px);
  margin: 0 auto;
  padding: 1rem 1rem 5rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;

  @media (min-width: 760px) {
    padding: 1.5rem 1.5rem 5rem;
    gap: 1.25rem;
  }

  ${({ theme }) => theme.variant === 'lite' && `
    padding-top: 0.6rem;
    padding-bottom: 2rem;
    gap: 0.7rem;

    @media (min-width: 760px) {
      padding-top: 0.8rem;
      padding-bottom: 2.5rem;
      gap: 0.8rem;
    }
  `}
`

const Intro = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  ${({ theme }) => theme.variant === 'lite' && `
    align-items: center;
    gap: 0.45rem;
  `}

  h2 {
    font: ${({ theme }) => theme.variant === 'lite'
      ? `650 clamp(1.25rem, 3vw, 1.75rem)/1.2 ${theme.fonts.sans}`
      : `500 clamp(1.35rem, 3vw, 2rem)/1.2 ${theme.fonts.serif}`};
  }

  p {
    max-width: 58ch;
    margin-top: 0.35rem;
    color: ${({ theme }) => theme.colors.textDim};
    font-size: 14px;
  }

  ${({ theme }) => theme.variant === 'lite' && `
    h2 { font-size: 1rem; }
    p { display: none; }
  `}
`

const SectionNav = styled.nav`
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  ${({ theme }) => theme.variant === 'lite' && `
    padding: 0.2rem;
    border: 0;
    border-radius: 999px;
    background: ${theme.colors.panel2};
    box-shadow: ${theme.shadows.sm};
    width: fit-content;
  `}
`

const NavButton = styled.button`
  min-height: ${({ theme }) => theme.variant === 'lite' ? '2.4rem' : '2.75rem'};
  padding: 0.45rem 0.9rem;
  border-bottom: 2px solid ${({ $active, theme }) => $active ? theme.colors.amber : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.text : theme.colors.textDim};
  font-weight: 600;
  ${({ $active, theme }) => theme.variant === 'lite' && `
    border: 1px solid ${$active ? theme.colors.amber : 'transparent'};
    border-bottom: 1px solid ${$active ? theme.colors.amber : 'transparent'};
    border-radius: 999px;
    background: ${$active ? theme.colors.panel : 'transparent'};
    box-shadow: ${$active ? theme.shadows.sm : 'none'};
  `}

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
  background: ${({ theme }) => theme.variant === 'lite'
    ? theme.colors.panel
    : 'linear-gradient(145deg, rgba(21, 27, 37, 0.96), rgba(16, 21, 30, 0.96))'};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  ${({ theme }) => theme.variant === 'lite' && `
    border-color: ${theme.colors.panelLight};
    box-shadow: ${theme.shadows.sm}, inset 1px 1px 0 rgba(255,255,255,0.65);
  `}
`

const CardHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.4rem 1rem;
  margin-bottom: 0.8rem;

  h3 {
    font: ${({ theme }) => theme.variant === 'lite'
      ? `650 1.05rem/1.3 ${theme.fonts.sans}`
      : `500 1.1rem/1.3 ${theme.fonts.serif}`};
  }

  p {
    color: ${({ theme }) => theme.colors.textDim};
    font-size: 12px;
  }
`

const ControlStack = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
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
  box-shadow: ${({ theme }) => theme.variant === 'lite' ? 'inset 2px 2px 4px #d1cfca, inset -2px -2px 4px #ffffff' : 'none'};

  &:disabled {
    opacity: 0.65;
  }
`

const GridSection = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.55rem;
  min-width: 0;
  margin-top: 0.75rem;
  scroll-margin-bottom: ${({ theme }) => theme.variant === 'lite' ? '10rem' : '0'};
`

const Preferences = styled.details`
  min-width: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 14px;
  background: ${({ theme }) => theme.colors.panel2};
  box-shadow: ${({ theme }) => theme.variant === 'lite' ? theme.shadows.sm : 'none'};

  summary {
    min-height: 2.75rem;
    display: flex;
    align-items: center;
    padding: 0.55rem 0.85rem;
    color: ${({ theme }) => theme.colors.text};
    font-size: 12px;
    font-weight: 650;
    cursor: pointer;
  }

  > div {
    padding: 0.25rem 0.75rem 0.8rem;
  }
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
  ${({ theme }) => theme.variant === 'lite' && `
    border: 1px solid ${theme.colors.border};
    border-left: 3px solid ${theme.colors.amber};
    box-shadow: inset 2px 2px 5px #d1cfca, inset -2px -2px 5px #ffffff;
  `}

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

const ArtVisualizer = lazy(() =>
  import('../visualizer/RitmiaArtVisualizer').then(module => ({
    default: module.RitmiaArtVisualizer,
  }))
)

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

export function RitmiaArt({ variant = 'art', onPresentationChange, initializePattern = true }) {
  const isLite = variant === 'lite'
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
    if (initializePattern && numA === 7 && denA === 8 && groupingA === '3+2+2' && defaultAccents) {
      setNumA(4)
      setDenA(4)
      setAccentsA([2, 0, 1, 0])
      setGroupingA('2+2')
    }
  }, [
    initializePattern,
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

  const soundOptions = (
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
  )
  const gridA = (
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
  )

  return (
    <Page $isLite={isLite}>
      <Header variant={variant} onPresentationChange={onPresentationChange} />
      {isLite && <LiteTransportDock />}
      <Main>
        <Intro>
          <div>
            <h2>{isLite ? 'Tu ritmo, listo para tocar.' : 'Practicar primero. Explorar después.'}</h2>
            <p>
              Construye un patrón con A; abre Explorar cuando quieras combinar ciclos,
              agrupaciones y clave. Tus ajustes musicales se mantienen al cambiar de sección.
            </p>
          </div>
          <Button $variant="panel" onClick={openTest}>Probar lectura</Button>
        </Intro>

        <SectionNav aria-label={`Secciones de Ritmia ${isLite ? 'Lite' : 'Art'}`}>
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
            {isLite
              ? <LiteRhythmVisualizer showTrackB={showB} reduceMotion={effectiveReduceMotion} compact />
              : (
                <Suspense fallback={<Card role="status">Cargando visualizador…</Card>}>
                  <ArtVisualizer showTrackB={showB} reduceMotion={effectiveReduceMotion} />
                </Suspense>
              )}

            <Card>
              <CardHeader>
                <h3>{isLite ? 'Secuenciador A' : 'Tu patrón'}</h3>
                <p>Selecciona una posición para alternar silencio, suave y fuerte.</p>
              </CardHeader>
              {isLite && gridA}
              <ControlStack>
                <TimeSignatureBuilder />
                {isLite
                  ? <Preferences><summary>Sonido y preferencias</summary><div>{soundOptions}</div></Preferences>
                  : soundOptions}
                {soundKit === 'acoustic' && audioEngine.soundBankError && (
                  <p role="status">Muestras no disponibles; se usa síntesis.</p>
                )}
              </ControlStack>
              {!isLite && gridA}

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
      <WelcomeModal />
      <TestModal />
    </Page>
  )
}
