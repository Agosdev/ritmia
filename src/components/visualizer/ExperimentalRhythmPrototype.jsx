import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { DENOMINATORS, MAX_BPM, MAX_NUM, MIN_BPM, TIME_SIGNATURES } from '../../music/constants'
import { ExperimentalRhythmVisualizer } from './ExperimentalRhythmVisualizer'

const Page = styled.main`
  min-height: 100vh;
  padding: clamp(1rem, 3vw, 2.5rem);
  color: #f4f2f5;
  background:
    radial-gradient(ellipse at 12% 4%, rgba(201, 111, 160, 0.1), transparent 34rem),
    radial-gradient(ellipse at 94% 48%, rgba(111, 110, 169, 0.1), transparent 30rem),
    #090b10;
`

const Content = styled.div`
  width: min(100%, 1040px);
  margin: 0 auto;
`

const TopLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
`

const BackLink = styled.a`
  color: #d7b6d2;
  font-size: 13px;
  text-decoration: none;

  &:hover { color: #fff0a8; }
  &:focus-visible { outline: 3px solid #fff0a8; outline-offset: 4px; }
`

const DevTag = styled.span`
  border: 1px solid rgba(197, 168, 255, 0.35);
  border-radius: 999px;
  padding: 0.3rem 0.65rem;
  color: #d4c4ef;
  font: 11px ui-monospace, SFMono-Regular, Menlo, monospace;
`

const Heading = styled.header`
  margin-bottom: 1.25rem;

  h1 {
    font: 500 clamp(1.7rem, 4vw, 2.6rem)/1.1 Georgia, 'Times New Roman', serif;
    letter-spacing: -0.035em;
  }

  p {
    max-width: 62ch;
    margin-top: 0.65rem;
    color: #c2c5d0;
    font-size: 15px;
    line-height: 1.6;
  }
`

const ControlPanel = styled.section`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(217, 183, 219, 0.16);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(21, 27, 37, 0.96), rgba(17, 18, 27, 0.92));

  @media (max-width: 600px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const ControlGroup = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.55rem;
`

const LabelLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: #e5dce9;
  font-size: 13px;
  font-weight: 600;
`

const Value = styled.output`
  color: #ffc2d9;
  font: 600 13px ui-monospace, SFMono-Regular, Menlo, monospace;
`

const TempoRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 5rem;
  align-items: center;
  gap: 0.65rem;

  input[type='range'] { width: 100%; accent-color: #ff806f; }

  input[type='number'] {
    width: 100%;
    min-width: 0;
    height: 2.5rem;
    border: 1px solid #394555;
    border-radius: 10px;
    background: #0e121a;
    text-align: center;
  }
`

const PresetRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`

const Preset = styled.button`
  min-height: 2.5rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid ${({ $selected }) => $selected ? '#f49bc7' : '#394555'};
  border-radius: 10px;
  color: ${({ $selected }) => $selected ? '#fff1f6' : '#c2c5d0'};
  background: ${({ $selected }) => $selected ? 'rgba(255, 128, 111, 0.13)' : '#0e121a'};
  font: 12px ui-monospace, SFMono-Regular, Menlo, monospace;

  &:focus-visible { outline: 3px solid #fff0a8; outline-offset: 2px; }
`

const MeterRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(6rem, 0.8fr);
  gap: 0.5rem;

  input, select {
    min-width: 0;
    width: 100%;
    height: 2.5rem;
    padding: 0 0.65rem;
    border: 1px solid #394555;
    border-radius: 10px;
    color: #f4f2f5;
    background: #0e121a;
  }
`

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
`

const ActionButton = styled.button`
  min-height: 2.75rem;
  padding: 0.55rem 1rem;
  border: 1px solid ${({ $playing }) => $playing ? 'rgba(255, 197, 110, 0.75)' : 'rgba(255, 128, 111, 0.7)'};
  border-radius: 999px;
  color: #fff4f4;
  background: ${({ $playing }) => $playing ? 'rgba(255, 197, 110, 0.13)' : 'rgba(255, 128, 111, 0.14)'};
  font-weight: 700;

  &:focus-visible { outline: 3px solid #fff0a8; outline-offset: 3px; }
`

const ToggleLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #d7d4df;
  font-size: 13px;

  input { width: 1rem; height: 1rem; accent-color: #c5a8ff; }
`

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem 1rem;
  padding: 0.85rem 0.2rem 1rem;
  color: #d1ccd8;
  font-size: 12px;
`

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;

  &::before {
    content: '';
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
    border: 1px solid ${({ $kind }) =>
      $kind === 2 ? '#ffc56e' : $kind === 1 ? '#e3d6ff' : '#a9b0bd'};
    background: ${({ $kind }) =>
      $kind === 2 ? '#ff806f' : $kind === 1 ? '#c5a8ff' : 'transparent'};
  }
`

function useSystemReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = event => setReduced(event.matches)
    setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reduced
}

export function ExperimentalRhythmPrototype() {
  const {
    bpm,
    setBpm,
    denA,
    setDenA,
    transportState,
    startPlayback,
    pausePlayback,
    stopPlayback,
    numA,
    setNumA,
    volumeA,
    setVolumeA,
    reduceMotion,
    setReduceMotion,
  } = useRitmia()
  const systemReducedMotion = useSystemReducedMotion()
  const shouldReduceMotion = reduceMotion || systemReducedMotion
  const isPlaying = transportState === 'playing'

  const handleBpmChange = value => {
    const parsed = Number(value)
    if (Number.isInteger(parsed)) setBpm(Math.min(MAX_BPM, Math.max(MIN_BPM, parsed)))
  }

  const setMeter = (numerator, denominator) => {
    setNumA(numerator)
    setDenA(denominator)
  }

  return (
    <Page>
      <Content>
        <TopLine>
          <BackLink href="/">← Volver a Ritmia</BackLink>
          <DevTag>PROTOTIPO · SOLO DESARROLLO</DevTag>
        </TopLine>

        <Heading>
          <h1>Un ciclo, muchas huellas</h1>
          <p>
            Prototipo visual experimental para la pista A. Los controles de esta vista
            actúan sobre la reproducción real; la forma solo lee el estado musical existente.
          </p>
        </Heading>

        <ControlPanel aria-label="Controles para probar el prototipo">
          <ControlGroup>
            <LabelLine>
              <label htmlFor="prototype-bpm">Tempo · BPM</label>
              <Value>{bpm} BPM</Value>
            </LabelLine>
            <TempoRow>
              <input
                id="prototype-bpm"
                type="range"
                min={MIN_BPM}
                max={MAX_BPM}
                value={bpm}
                onChange={event => handleBpmChange(event.target.value)}
                aria-label="Ajustar tempo en BPM"
              />
              <input
                type="number"
                min={MIN_BPM}
                max={MAX_BPM}
                value={bpm}
                onChange={event => handleBpmChange(event.target.value)}
                aria-label="Valor numérico del tempo en BPM"
              />
            </TempoRow>
            <ActionRow>
              <ActionButton
                type="button"
                $playing
                onClick={startPlayback}
                aria-label={transportState === 'paused' ? 'Reanudar reproducción' : 'Iniciar reproducción'}
                aria-pressed={isPlaying}
              >
                {transportState === 'paused' ? '▶ Reanudar' : '▶ Reproducir'}
              </ActionButton>
              <ActionButton
                type="button"
                $playing={false}
                onClick={pausePlayback}
                disabled={!isPlaying}
                aria-label="Pausar reproducción"
              >
                Ⅱ Pausar
              </ActionButton>
              <ActionButton
                type="button"
                $playing={false}
                onClick={stopPlayback}
                disabled={transportState === 'stopped'}
                aria-label="Reiniciar ciclo"
              >
                ↺ Reiniciar
              </ActionButton>
              <ToggleLabel>
                <input
                  type="checkbox"
                  checked={reduceMotion}
                  onChange={event => setReduceMotion(event.target.checked)}
                />
                Reducir movimiento
              </ToggleLabel>
              {systemReducedMotion && (
                <span role="status">
                  El sistema operativo solicita reducir el movimiento; Ritmia lo respeta.
                </span>
              )}
            </ActionRow>
          </ControlGroup>

          <ControlGroup>
            <LabelLine>
              <span>Compás A</span>
              <Value>{numA}/{denA}</Value>
            </LabelLine>
            <PresetRow aria-label="Presets de compás A">
              {TIME_SIGNATURES.filter(({ label }) => ['4/4', '7/8', '12/8'].includes(label)).map(sig => (
                <Preset
                  key={sig.label}
                  type="button"
                  $selected={numA === sig.num && denA === sig.den}
                  aria-pressed={numA === sig.num && denA === sig.den}
                  onClick={() => setMeter(sig.num, sig.den)}
                >
                  {sig.label}
                </Preset>
              ))}
            </PresetRow>
            <MeterRow>
              <input
                type="number"
                min="1"
                max={MAX_NUM}
                value={numA}
                onChange={event => {
                  const value = Number(event.target.value)
                  if (Number.isInteger(value) && value >= 1 && value <= MAX_NUM) setNumA(value)
                }}
                aria-label="Cantidad de posiciones de A"
              />
              <select
                value={denA}
                onChange={event => setDenA(Number(event.target.value))}
                aria-label="Valor de cada posición de A"
              >
                {DENOMINATORS.map(denominator => (
                  <option key={denominator} value={denominator}>/{denominator}</option>
                ))}
              </select>
            </MeterRow>
            <LabelLine>
              <label htmlFor="prototype-volume">Volumen A</label>
              <Value>{Math.round(volumeA * 100)}%</Value>
            </LabelLine>
            <input
              id="prototype-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volumeA}
              onChange={event => setVolumeA(Number(event.target.value))}
              aria-label="Volumen de la pista A"
            />
          </ControlGroup>
        </ControlPanel>

        <ExperimentalRhythmVisualizer reduceMotion={shouldReduceMotion} />
        <Legend aria-label="Leyenda de acentos">
          <LegendItem $kind={0}>Silencio · posición presente sin acento sonoro</LegendItem>
          <LegendItem $kind={1}>Suave · bajo sintetizado</LegendItem>
          <LegendItem $kind={2}>Fuerte · bombo sintetizado</LegendItem>
          {systemReducedMotion && <span>Preferencia del sistema: movimiento reducido.</span>}
        </Legend>
      </Content>
    </Page>
  )
}
