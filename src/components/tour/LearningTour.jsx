import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createGlobalStyle, css, keyframes } from 'styled-components'
import styled from 'styled-components'
import { TOUR_STORAGE_KEYS } from './tourSteps'

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px) scale(.99); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`

const HighlightStyle = createGlobalStyle`
  [data-tour-highlight="true"] {
    position: relative;
    z-index: 55;
    outline: 3px solid ${({ theme }) => theme.colors.trackANeon};
    outline-offset: 4px;
    box-shadow: 0 0 0 8px ${({ theme }) => `${theme.colors.trackANeon}26`};
    border-radius: 12px;
  }
  @media (prefers-reduced-motion: no-preference) {
    [data-tour-highlight="true"] { transition: outline-color 160ms ease, box-shadow 160ms ease; }
  }
`

const Card = styled.section`
  position: fixed;
  z-index: 1200;
  top: calc(5.5rem + var(--safe-top) + 10px);
  left: 12px;
  width: min(352px, calc(100vw - 24px));
  max-height: min(280px, calc(100dvh - 24px));
  overflow-y: auto;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.glass.rim};
  border-radius: 18px;
  background: ${({ theme }) => `${theme.glass.surface}, ${theme.colors.panel}ee`};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) => theme.physical.dock};
  backdrop-filter: blur(18px) saturate(1.35);
  -webkit-backdrop-filter: blur(18px) saturate(1.35);
  animation: ${fadeIn} 180ms ease-out both;
  ${({ $mobile }) => $mobile && css`
    width: auto;
    max-height: min(230px, 40dvh);
    padding: .85rem;
  `}
  @media (prefers-reduced-motion: reduce) { animation: none; }

  h2 { margin: 0 2rem .4rem 0; font-size: 16px; }
  p { margin: 0 0 .65rem; color: ${({ theme }) => theme.colors.textDim}; font-size: 13px; line-height: 1.45; }
  button { min-height: 44px; touch-action: manipulation; }
`

const CloseButton = styled.button`
  position: absolute;
  top: .45rem;
  right: .45rem;
  width: 44px;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  font-size: 22px;
  cursor: pointer;
`

const StepCount = styled.p`
  font: 11px ${({ theme }) => theme.fonts.mono} !important;
  letter-spacing: .04em;
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: .45rem;
  button {
    padding: .55rem .75rem;
    border: 1px solid ${({ theme }) => theme.glass.rim};
    border-radius: 12px;
    background: ${({ theme }) => theme.glass.field};
    color: inherit;
    font: 600 12px ${({ theme }) => theme.fonts.sans};
    cursor: pointer;
  }
  button[data-primary="true"] {
    background: ${({ theme }) => theme.gradients.primary};
    border-color: ${({ theme }) => theme.colors.selectionBorder};
  }
`

const Invite = styled(Card)`
  top: calc(5.5rem + var(--safe-top) + 10px);
  right: 12px;
  width: min(330px, calc(100vw - 24px));
  max-height: min(280px, calc(100dvh - 24px));
  /* A first-visit invitation is a non-modal notice; the app remains usable
     wherever the notice itself has no interactive control. */
  pointer-events: none;
  > * { pointer-events: none; }
  button { pointer-events: auto; }
  @media (max-width: 600px) { top: calc(5.5rem + var(--safe-top) + 8px); }
`

const Help = styled.button`
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  border: 1px solid ${({ theme }) => theme.glass.rim};
  border-radius: 50%;
  background: ${({ theme }) => theme.glass.field};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) => theme.physical.inset};
  font: 700 19px ${({ theme }) => theme.fonts.sans};
  cursor: pointer;
  &:focus-visible { outline: 3px solid ${({ theme }) => theme.colors.trackANeon}; outline-offset: 3px; }
`

function focusPanel(panelRef) {
  requestAnimationFrame(() => panelRef.current?.querySelector('[data-tour-heading]')?.focus({ preventScroll: true }))
}

export function TourHelpButton({ onClick }) {
  return <Help type="button" aria-label="Ayuda" title="Ayuda" onClick={onClick}>?</Help>
}

export function LearningTour({ controller }) {
  const {
    active, currentStep, invitation, offerTwoTracks, panelRef, position, stepIndex, steps,
    startMain, startTwoTracks, next, previous, close, dismissInvitation, acceptOffer,
  } = controller

  useEffect(() => {
    if (active || offerTwoTracks) focusPanel(panelRef)
  }, [active, offerTwoTracks, stepIndex, panelRef])

  const panelStyle = position
    ? position.mobile
      ? { left: position.left, right: position.right, top: position.top }
      : { left: position.left, top: position.top }
    : undefined
  const content = <>
    {active && currentStep && <>
      <HighlightStyle />
      <Card ref={panelRef} role="dialog" aria-labelledby="tour-title" aria-describedby="tour-description" data-tour-card="true" $mobile={position?.mobile} style={panelStyle}>
        <CloseButton type="button" aria-label="Cerrar tour" onClick={() => close()}>×</CloseButton>
        <h2 id="tour-title" data-tour-heading tabIndex={-1}>{currentStep.title}</h2>
        <p id="tour-description">{currentStep.description}</p>
        <StepCount aria-live="polite">Paso {stepIndex + 1} de {steps.length}</StepCount>
        <Actions>
          <button type="button" onClick={() => close()}>Saltar tour</button>
          <span>
            {stepIndex > 0 && <button type="button" onClick={previous}>Anterior</button>}{' '}
            <button type="button" data-primary="true" onClick={next}>{stepIndex === steps.length - 1 ? 'Finalizar' : 'Siguiente'}</button>
          </span>
        </Actions>
      </Card>
    </>}
    {!active && invitation && <Invite ref={panelRef} role="region" aria-labelledby="tour-invitation-title">
      <h2 id="tour-invitation-title">¿Primera vez en Ritmia?</h2>
      <p>Te mostramos cómo crear y escuchar tu primer ritmo en unos pocos pasos.</p>
      <Actions>
        <button type="button" data-primary="true" onClick={event => startMain(event)}>Mostrarme</button>
        <button type="button" onClick={dismissInvitation}>Ahora no</button>
      </Actions>
    </Invite>}
    {!active && offerTwoTracks && <Invite ref={panelRef} role="region" aria-labelledby="tour-offer-title">
      <h2 id="tour-offer-title">¿Querés combinar dos ritmos?</h2>
      <p>Podés explorar cómo se relacionan dos pistas sin cambiar tus patrones.</p>
      <Actions>
        <button type="button" data-primary="true" onClick={() => { acceptOffer(); startTwoTracks() }}>Explorar Dos ritmos</button>
        <button type="button" onClick={() => close({ remember: false })}>Empezar a usar Ritmia</button>
      </Actions>
      <CloseButton type="button" aria-label="Cerrar invitación" onClick={() => close({ remember: false })}>×</CloseButton>
    </Invite>}
  </>
  return (active || invitation || offerTwoTracks) && typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : null
}

export { TOUR_STORAGE_KEYS }
