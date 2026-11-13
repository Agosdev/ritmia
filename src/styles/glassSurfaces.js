import { css } from 'styled-components'

// The masked rim catches light at the perimeter, keeping every label unobscured.
const glassEdge = css`
  @supports ((mask-composite: exclude) or (-webkit-mask-composite: xor)) {
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1.5px;
      background: ${({ theme }) => theme.glass.edge};
      pointer-events: none;
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
    }
  }
`

const glassReflection = css`
  &::after {
    content: '';
    position: absolute;
    left: 10%;
    right: 10%;
    top: 1px;
    height: 1px;
    border-radius: inherit;
    background: ${({ theme }) => theme.glass.reflection};
    pointer-events: none;
  }
`

const glassFallback = css`
  @media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
    background: ${({ theme }) => theme.glass.fallback};
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    &::after { display: none; }
  }
  @media (forced-colors: active) {
    border-color: CanvasText;
    background: Canvas;
    box-shadow: none;
    &::before, &::after { display: none; }
  }
`

// No backdrop filters on nested controls: only the large panels and fixed bars.
export const glassPanel = css`
  position: relative;
  ${glassEdge}
  ${glassReflection}
  background: ${({ theme }) => theme.glass.fallback};
  border: 1px solid ${({ theme }) => theme.glass.rim};
  box-shadow: ${({ theme }) => theme.physical.shell};
  @supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    background: ${({ theme }) => theme.glass.surface};
    backdrop-filter: blur(${({ theme }) => theme.glass.panelBlur}) saturate(${({ theme }) => theme.glass.saturation});
    -webkit-backdrop-filter: blur(${({ theme }) => theme.glass.panelBlur}) saturate(${({ theme }) => theme.glass.saturation});
  }
  ${glassFallback}
`

export const glassBar = css`
  ${glassEdge}
  ${glassReflection}
  background: ${({ theme }) => theme.glass.fallback};
  border: 1px solid ${({ theme }) => theme.glass.rim};
  box-shadow: ${({ theme }) => theme.physical.bar};
  @supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    background: ${({ theme }) => theme.glass.bar};
    backdrop-filter: blur(${({ theme }) => theme.glass.barBlur}) saturate(${({ theme }) => theme.glass.saturation});
    -webkit-backdrop-filter: blur(${({ theme }) => theme.glass.barBlur}) saturate(${({ theme }) => theme.glass.saturation});
  }
  ${glassFallback}
`

// Optically clear inset pieces share highlights but do not stack blur layers.
export const glassInset = css`
  background: ${({ theme }) => theme.glass.insetSurface};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  box-shadow: ${({ theme }) => theme.physical.inset};
`
