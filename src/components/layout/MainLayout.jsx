import React from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { Header } from './Header'
import { Footer } from './Footer'
import { LevelTabs } from '../controls/LevelTabs'
import { CircularVisualizer } from '../visualizer/CircularVisualizer'
import { BeatGrid } from '../visualizer/BeatGrid'
import { ProgressTimeline } from '../visualizer/ProgressTimeline'
import { AudioInfoBadge } from '../visualizer/AudioInfoBadge'
import { TimeSignatureBuilder } from '../controls/TimeSignatureBuilder'
import { GroupingInput } from '../controls/GroupingInput'
import { PolyrhythmControls } from '../controls/PolyrhythmControls'
import { WelcomeModal } from '../modals/WelcomeModal'
import { TestModal } from '../modals/TestModal'
import { Panel, Panel2 } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
`

const MainContent = styled.main`
  max-width: 1280px;
  width: 100%;
  margin: 1rem auto 0;
  padding: 0 1rem 5rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;

  @media (min-width: 1024px) {
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.9fr);
    padding: 0 1.5rem 5rem;
  }
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
`

const PanelHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`

const PanelTitle = styled.h2`
  min-width: 0;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: ${({ theme }) => theme.colors.textDim};
`

const BadgesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

const GridHeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.35rem;

  > div {
    flex-wrap: wrap;
  }
`

const GridLabel = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.colors.textDim};
`

const SynthSpecsCard = styled(Panel)`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const SynthTitle = styled.h4`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.colors.textDim};
`

const SynthList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  font-size: 11px;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.textDim};

  b {
    color: ${({ theme }) => theme.colors.textBright};
  }
`

export function MainLayout() {
  const {
    level,
    numA,
    numB,
    accentsA,
    setAccentsA,
    accentsB,
    setAccentsB,
    activeGroupingA,
    activeGroupingB,
    openTest,
    soundKit,
  } = useRitmia()

  return (
    <AppContainer>
      <Header />
      <LevelTabs />

      <MainContent>
        {/* Columna Izquierda: Visualización en tiempo real */}
        <Column>
          <Panel style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <PanelHeader>
              <PanelTitle>Visualización locked a AudioContext.currentTime</PanelTitle>
              <BadgesRow>
                <Badge $variant="pill">rAF + window 50ms</Badge>
                <Badge $variant="pill">glow no flash</Badge>
              </BadgesRow>
            </PanelHeader>

            <CircularVisualizer />

            {/* Grilla Compás A */}
            <div>
              <GridHeaderRow>
                <GridLabel>
                  Grilla A — {numA > 16 ? 'scroll horizontal activo' : 'width proporcional'}
                </GridLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {numA >= 12 && (
                    <Badge $variant="amber">Compás largo: scroll horizontal →</Badge>
                  )}
                  <span style={{ fontSize: '10px', color: '#9a9ab0' }}>
                    {activeGroupingA ? 'agrupación aplicada' : 'sin agrupación'}
                  </span>
                </div>
              </GridHeaderRow>

              <BeatGrid
                trackType="A"
                label="Secuenciador Compás A"
                numBeats={numA}
                accents={accentsA}
                onAccentsChange={setAccentsA}
                parsedGrouping={activeGroupingA}
                isValidGrouping={!!activeGroupingA}
              />
            </div>

            {/* Grilla Compás B (Nivel 3) */}
            {level === 3 && (
              <div style={{ marginTop: '0.5rem' }}>
                <GridHeaderRow>
                  <GridLabel>Grilla B — {numB >= 16 ? 'scroll horizontal' : 'proporcional'}</GridLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {numB >= 12 && (
                      <Badge $variant="cyan">Compás largo B: scroll →</Badge>
                    )}
                    <span style={{ fontSize: '10px', color: '#9a9ab0' }}>
                      {activeGroupingB ? 'agrupación aplicada' : 'sin agrupación'}
                    </span>
                  </div>
                </GridHeaderRow>

                <BeatGrid
                  trackType="B"
                  label="Secuenciador Compás B"
                  numBeats={numB}
                  accents={accentsB}
                  onAccentsChange={setAccentsB}
                  parsedGrouping={activeGroupingB}
                  isValidGrouping={!!activeGroupingB}
                />
              </div>
            )}

            <ProgressTimeline />
            <AudioInfoBadge />
          </Panel>
        </Column>

        {/* Columna Derecha: Controles Pedagógicos */}
        <Column>
          <Panel style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '16px' }}>
              Constructor n/n preciso — hasta 32 pulsos
            </h3>
            <p style={{ fontSize: '11px', color: '#9a9ab0', marginTop: '-0.5rem' }}>
              Inputs num 1-32, den 1,2,4,8,16. Validación de suma de agrupación = num hasta 32.
            </p>

            <TimeSignatureBuilder />
            {level >= 2 && <GroupingInput />}
            {level === 3 && <PolyrhythmControls />}
          </Panel>

          {/* Tarjeta de Test de Nivel */}
          <Panel
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
            }}
          >
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600 }}>Test de nivel</h4>
              <p style={{ fontSize: '11px', color: '#9a9ab0' }}>
                Comprueba tu lectura del compás actual
              </p>
            </div>
            <Button $variant="accent" $height="2.75rem" onClick={openTest}>
              Test Nivel →
            </Button>
          </Panel>

          {/* Especificaciones del motor sonoro */}
          <SynthSpecsCard>
            <SynthTitle>
              {soundKit === 'acoustic' ? 'Motor de audio — percusión acústica' : 'Motor de audio — síntesis original'}
            </SynthTitle>
            {soundKit === 'acoustic' ? (
              <SynthList>
                <div><b>Pista A:</b> kick grabado, con capas suave y fuerte.</div>
                <div><b>Pista B:</b> snare grabado, con capas suave y fuerte.</div>
                <div><b>Metrónomo:</b> señal independiente en el inicio del ciclo.</div>
                <div><b>Muestras:</b> CC0, mono, 22.05 kHz; carga al iniciar y se reutilizan.</div>
                <div><b>Master:</b> ganancia 0.6 y compresor; no garantiza evitar clipping.</div>
              </SynthList>
            ) : (
              <SynthList>
                <div><b>Kick:</b> seno 160→45Hz, envolvente percusiva.</div>
                <div><b>Snare:</b> ruido filtrado + cuerpo tonal.</div>
                <div><b>Hat:</b> ruido pasa-altos de duración corta.</div>
                <div><b>Woodblock:</b> señal sintética independiente al inicio del ciclo.</div>
                <div><b>Bajo:</b> pulso triangular filtrado.</div>
                <div><b>Master:</b> ganancia 0.6 y compresor; no garantiza evitar clipping.</div>
              </SynthList>
            )}
          </SynthSpecsCard>
        </Column>
      </MainContent>

      <Footer />
      <WelcomeModal />
      <TestModal />
    </AppContainer>
  )
}
