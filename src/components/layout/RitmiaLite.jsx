import React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { levelThemes } from '../../styles/theme'
import { glassPanel, glassInset } from '../../styles/glassSurfaces'
import { liteControls } from '../../styles/liteSurfaces'
import { useRitmia } from '../../context/RitmiaContext'
import { InstrumentSelect } from '../controls/InstrumentSelect'
import { PresetExplanation, PresetChip } from '../controls/MusicalPresets'
import { LearningTour } from '../tour/LearningTour'
import { useLearningTour } from '../tour/useLearningTour'
import { Header } from './Header'
import { LiteTransportDock } from './LiteTransportDock'
import { TimeSignatureBuilder } from '../controls/TimeSignatureBuilder'
import { GroupingInput } from '../controls/GroupingInput'
import { PolyrhythmControls } from '../controls/PolyrhythmControls'
import { BeatGrid } from '../visualizer/BeatGrid'
import { LiteRhythmVisualizer } from '../visualizer/LiteRhythmVisualizer'
import { Toggle } from '../ui/Toggle'

const Page = styled.div`
  min-height: 100vh;
  padding-top: calc(5.5rem + var(--safe-top));
  ${liteControls}
  .cycle-marker { margin-bottom: 1.25rem; }
  .cycle-marker p { margin-top: .5rem; font-size: 11px; color: ${({ theme }) => theme.colors.textDim}; }
  main button { border-radius: 12px; }
  main [role='status'] { font-size: 12px; color: ${({ theme }) => theme.colors.textDim}; }

  padding-bottom: calc(10rem + env(safe-area-inset-bottom, 0px));
  background: ${({ theme }) => theme.glass.canvas};
  color: ${({ theme }) => theme.colors.text};

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
  align-items: flex-start;
  flex-direction: column;
  gap: 0.5rem;

  flex-wrap: wrap;
  h2 {
    font-size: 15px;
    line-height: 1.2;
  }
`

const Card = styled.section`
  min-width: 0;
  padding: clamp(0.75rem, 2.5vw, 1rem);
  border-radius: ${({ theme }) => theme.glass.panelRadius};
  ${glassPanel}
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
  border-left: 3px solid ${({ theme }) => theme.colors.trackANeon};
  &[data-track='B'] { border-left-color: ${({ theme }) => theme.colors.trackBNeon}; }
  padding-left: .6rem;
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
  border-radius: ${({ theme }) => theme.glass.controlRadius};
  ${glassInset}

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

export function RitmiaLite() {
  const {
    level,
    setLevel,
    metronome,
    setMetronome,
    presetLocked,
    numA, gridGroupingA, activeGroupingA,
    denA,
    numB,
    denB,
    accentsA,
    setAccentsA,
    accentsB,
    setAccentsB,
    activeGroupingB,
    reduceMotion,
    beatLabelsA,
  } = useRitmia()
  const showGrouping = true
  const showTrackB = level === 2
  const tour = useLearningTour({ level, setLevel })

  return (
    <ThemeProvider theme={levelThemes[level]}>
    <Page className="lite-interface" data-level={level} data-reduced-motion={reduceMotion}>
      <Header onHelp={tour.startMain} />
      <LiteTransportDock />
      <LearningTour controller={tour} />
      <Main>
        <Intro>
          <h2>{level === 1 ? 'Creá un ritmo' : 'Explorá dos ritmos'}</h2>
          <PresetChip />
          <PresetExplanation />
        </Intro>

        <LiteRhythmVisualizer
          showTrackB={showTrackB}
          showGrouping={showGrouping}
          reduceMotion={reduceMotion}
        />

        <Card aria-label="Edición del patrón">
          <div className="cycle-marker" role="group" aria-label="Marcación del compás">
            <Toggle id="cycle-marker" label="Marcar inicio de compás" checked={metronome} onChange={setMetronome} />
            <p>Agrega un golpe breve al comienzo de cada ciclo de A.</p>
          </div>
          {['A', ...(showTrackB ? ['B'] : [])].map(track => {
            const isB = track === 'B'
            const grouping = isB ? activeGroupingB : gridGroupingA
            const metricGrouping = isB ? activeGroupingB : activeGroupingA
            return <GridSection key={track} data-track={track}
              data-tour-target={track === 'A' ? 'sequencer' : 'tracks'}>
              <CardHeader>
                <h2>Secuenciador {track}</h2>
                <p>{!isB && presetLocked ? 'Patrón del preset · bloqueado' : 'Silencio → suave → fuerte'}</p>
              </CardHeader>
              <GridHeading>
                <span>{track} · {isB ? numB : numA}/{isB ? denB : denA}</span>
                <span>{metricGrouping ? metricGrouping.join('+') : '○ silencio · ● suave · ▰ fuerte'}</span>
              </GridHeading>
              <InstrumentSelect track={track} />
              <BeatGrid trackType={track} label={`Secuenciador pista ${track}`}
                beatLabels={isB ? null : beatLabelsA}
                numBeats={isB ? numB : accentsA.length} accents={isB ? accentsB : accentsA}
                onAccentsChange={isB ? setAccentsB : setAccentsA}
                parsedGrouping={grouping} isValidGrouping={!!grouping}
                reduceMotionOverride={reduceMotion} />
            </GridSection>
          })}

          <TimeSignatureBuilder compact />

          {level === 1 && <Options>
            <summary>Agrupaciones (opcional)</summary>
            <div><p>Dividí los pulsos de un compás en grupos. Por ejemplo, 7/8 puede organizarse como 3+2+2.</p><GroupingInput /></div>
          </Options>}

          {showTrackB && (
            <Options open>
              <summary>Relación entre A y B</summary>
              <div>
              <PolyrhythmControls />
              </div>
            </Options>
          )}

        </Card>


      </Main>
    </Page>
    </ThemeProvider>
  )
}
