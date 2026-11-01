import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { useModalAccessibility } from '../../hooks/useModalAccessibility'
import { MAX_NUM } from '../../music/constants'
import { Panel } from '../ui/Card'
import { Button } from '../ui/Button'

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  overflow-y: auto;
  padding: max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom));
`

const ModalCard = styled(Panel)`
  width: 100%;
  max-width: 560px;
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  padding: 1.75rem;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.panel};
`

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`

const IndicatorDots = styled.div`
  display: flex;
  gap: 6px;
`

const Dot = styled.div`
  height: 6px;
  width: 32px;
  border-radius: 9999px;
  background: ${({ $isActive, theme }) => ($isActive ? theme.colors.amber : theme.colors.borderStrong)};
  transition: ${({ theme }) => theme.transitions.fast};
`

const CloseBtn = styled.button`
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  display: grid;
  place-items: center;
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textDim};

  &:hover {
    color: ${({ theme }) => theme.colors.textBright};
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }
`

const SlideTitle = styled.h2`
  font-family: ${({ theme }) => theme.fonts.serif};
  font-size: 22px;
  line-height: 1.2;
`

const SlideBody = styled.p`
  font-size: 13px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.textDim};
  margin-top: 0.75rem;
`

const ActionsRow = styled.div`
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const TechnicalNote = styled.div`
  margin-top: 1rem;
  font-size: 10px;
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.textDim};
  line-height: 1.4;
`

export function WelcomeModal() {
  const { isWelcomeOpen, setIsWelcomeOpen } = useRitmia()
  const [slideIndex, setSlideIndex] = useState(0)
  const dialogRef = useRef(null)
  useModalAccessibility(dialogRef, () => setIsWelcomeOpen(false), isWelcomeOpen)

  if (!isWelcomeOpen) return null

  const slides = [
    {
      title: 'Bienvenido a Ritmia',
      desc: `Explorá ritmos, agrupaciones y dos pistas con percusión acústica. Elegí un preset editable o construí tu patrón. Reproducir y Detener conservan la posición; Reiniciar vuelve al principio.`,
    },
    {
      title: 'Nivel 1 — Un compás hasta 32',
      desc: `Construye compases de 1 a ${MAX_NUM} posiciones y elige denominadores de 1, 2, 4, 8 o 16. Toca los pulsos para alternar entre silencio, acento suave y fuerte. Las grillas largas se desplazan horizontalmente.`,
    },
    {
      title: 'Nivel 2 — Agrupación rítmica',
      desc: 'Escribe agrupaciones aditivas como "3+2+2". Ritmia valida que la suma de los grupos coincida con el numerador y distingue las agrupaciones en la visualización.',
    },
    {
      title: 'Nivel 3 — Polirritmia, Polimetría, Morph y Clave',
      desc: 'Activa la pista B para explorar polirritmia, polimetría, Morph y patrones de clave. Podés elegir entre los visualizadores Clásico, Rebote 2D y Órbita 3D.',
    },
  ]

  const isLast = slideIndex === slides.length - 1

  return (
    <ModalOverlay onClick={event => {
      if (event.target === event.currentTarget) setIsWelcomeOpen(false)
    }}>
      <ModalCard
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-modal-title"
        aria-describedby="welcome-modal-description"
        tabIndex={-1}
      >
        <HeaderRow>
          <IndicatorDots aria-hidden="true">
            {slides.map((_, i) => (
              <Dot key={`dot-${i}`} $isActive={i === slideIndex} />
            ))}
          </IndicatorDots>
          <CloseBtn onClick={() => setIsWelcomeOpen(false)} aria-label="Cerrar modal">
            ✕
          </CloseBtn>
        </HeaderRow>

        <SlideTitle id="welcome-modal-title" aria-live="polite">
          {slides[slideIndex].title}
        </SlideTitle>
        <SlideBody id="welcome-modal-description">{slides[slideIndex].desc}</SlideBody>

        <ActionsRow>
          <Button
            $variant="panel"
            $height="2.75rem"
            disabled={slideIndex === 0}
            onClick={() => setSlideIndex(prev => Math.max(0, prev - 1))}
          >
            Atrás
          </Button>

          {isLast ? (
            <Button
              $variant="accent"
              $height="2.75rem"
              onClick={() => setIsWelcomeOpen(false)}
            >
              Volver a Ritmia
            </Button>
          ) : (
            <Button
              $variant="primary"
              $height="2.75rem"
              onClick={() => setSlideIndex(prev => prev + 1)}
            >
              Siguiente →
            </Button>
          )}
        </ActionsRow>

        <TechnicalNote>
          Precisión: lookahead 100ms, scheduleInterval 25ms, audioCtx.currentTime reloj maestro,
          buffers programados en tiempo absoluto.
        </TechnicalNote>
      </ModalCard>
    </ModalOverlay>
  )
}
