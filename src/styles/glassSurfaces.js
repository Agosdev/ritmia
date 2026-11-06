import { css } from 'styled-components'

// A thin masked edge catches light without placing a highlight over text.
const glassEdge = css`
  @supports ((mask-composite: exclude) or (-webkit-mask-composite: xor)) {
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1px;
      background: ${({ theme }) => theme.glass.edge};
      pointer-events: none;
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
    }
  }
`

// Blur is limited to the floating bars and large panels; nested controls use gloss.
export const glassPanel = css`
  position: relative;
  ${glassEdge}
  background: ${({ theme }) => theme.glass.fallback};
  border: 1px solid ${({ theme }) => theme.glass.rim};
  box-shadow: ${({ theme }) => theme.physical.shell};
  @supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    background: ${({ theme }) => theme.glass.surface};
    backdrop-filter: blur(8px) saturate(130%);
    -webkit-backdrop-filter: blur(8px) saturate(130%);
  }
  @media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
    background: ${({ theme }) => theme.glass.fallback};
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
`

export const glassBar = css`
  ${glassEdge}
  background: ${({ theme }) => theme.glass.fallback};
  border: 1px solid ${({ theme }) => theme.glass.rim};
  box-shadow: 0 6px 22px #48336824, inset 0 1px 1px #fff, inset 0 -1px 2px #9babff77;
  @supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    background: ${({ theme }) => theme.glass.bar};
    backdrop-filter: blur(12px) saturate(130%);
    -webkit-backdrop-filter: blur(12px) saturate(130%);
  }
  @media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
    background: ${({ theme }) => theme.glass.fallback};
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
`
