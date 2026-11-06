import React from 'react'
import styled from 'styled-components'

export const AccentSymbol = styled.span.attrs({ 'aria-hidden': true })`
  display: inline-block;
  flex: 0 0 auto;
  width: ${({ $accent }) => $accent === 2 ? '18px' : '12px'};
  height: ${({ $accent }) => $accent === 2 ? '7px' : '12px'};
  border-radius: ${({ $accent }) => $accent === 2 ? '3px' : '50%'};
  border: 2px solid transparent;
  background: ${({ $accent, theme }) => $accent === 0
    ? `linear-gradient(${theme.colors.panelLight}, ${theme.colors.panelLight}) padding-box, ${theme.gradients.silence} border-box`
    : $accent === 1 ? theme.gradients.soft : theme.gradients.strong};
  box-shadow: 0 0 0 1px ${({ $accent }) => $accent === 0 ? '#6d5799' : $accent === 1 ? '#216a9c' : '#a4387f'};
  ${({ $active, $trackB, theme }) => $active && `outline: 2px solid ${$trackB ? theme.colors.trackBNeon : theme.colors.trackANeon}; outline-offset: 4px;`}
`
const Legend = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  gap: .4rem .7rem;
  > span { display: inline-flex; align-items: center; gap: .35rem; }
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    align-self: flex-start;
    gap: .6rem;
  }
`
export function AccentLegend() {
  return <Legend aria-label="Silencio, suave y fuerte">
    {[['silencio', 0], ['suave', 1], ['fuerte', 2]].map(([label, accent]) =>
      <span key={label}><AccentSymbol $accent={accent} />{label}</span>)}
  </Legend>
}
