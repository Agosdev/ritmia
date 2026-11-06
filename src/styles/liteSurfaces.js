import { css } from 'styled-components'

// Glossy controls, shared across both tracks; no stacked backdrop filters.
export const liteSurface = css`
  background: var(--control-surface, ${({ theme }) => theme.gradients.secondary});
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  box-shadow: ${({ theme }) => theme.physical.elevated};
`

export const litePressable = css`
  transition: transform 180ms cubic-bezier(.2,.8,.25,1.25), box-shadow 180ms ease, background 180ms ease;
  @media (hover: hover) and (pointer: fine) {
    &:hover:not(:disabled):not([aria-pressed='true']):not(:active):not([data-playing='true']) {
      transform: translateY(-1px);
      background: var(--control-surface, ${({ theme }) => theme.gradients.secondary});
      box-shadow: ${({ theme }) => theme.physical.hover};
    }
  }
  &[aria-pressed='true'] {
    box-shadow: ${({ theme }) => theme.physical.selected};
    border-color: ${({ theme }) => theme.colors.selectionBorder ?? '#8a5cf5'};
    font-weight: 750;
  }
  &:active:not(:disabled) {
    transform: translateY(2px) scale(.985);
    box-shadow: ${({ theme }) => theme.physical.pressed};
  }
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.text};
    outline-offset: 3px;
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover, &:active { transform: none; }
  }
`

// Scoped to the Lite page, including reused laboratory controls.
export const liteControls = css`
  button { ${liteSurface} ${litePressable} min-height: 44px; color: ${({ theme }) => theme.colors.text}; }
  button[data-playing='true'] { box-shadow: ${({ theme }) => theme.physical.selected}; border-color: ${({ theme }) => theme.colors.borderLight}; }
  button[data-action='play'] { --control-surface: ${({ theme }) => theme.gradients.primary}; border-color: ${({ theme }) => theme.colors.primaryBorder ?? '#35adb7'}; font-weight: 750; }
  button[data-action='reset'] { --control-surface: ${({ theme }) => theme.gradients.secondary}; border-color: ${({ theme }) => theme.colors.secondaryBorder ?? '#a98bd7'}; }
  select#musical-preset { background: ${({ theme }) => theme.gradients.preset}; border-color: #d8adc6; }
  button[aria-label^='Quitar preset'] { min-height: 44px; height: 44px; padding: 0; font-size: 18px; border-radius: 50%; }
  button:disabled { opacity: .45; cursor: not-allowed; }
  button[data-track]:disabled { opacity: 1; }
  input:disabled, select:disabled { cursor: not-allowed; }
  input:not([type='range']):not([type='checkbox']), select {
    min-height: 44px;
    background: linear-gradient(180deg, #ffffffdd, #f1eef8cc);
    box-shadow: ${({ theme }) => theme.physical.inset};
    border: 1px solid ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text};
  }
  input[type='range'] {
    appearance: none;
    -webkit-appearance: none;
    height: 44px;
    min-width: 0;
    background: transparent;
    cursor: pointer;
  }
  input[type='range']::-webkit-slider-runnable-track {
    height: 8px;
    border-radius: 10px;
    background: linear-gradient(90deg, var(--range-from, #44cbbf), var(--range-to, #8b74dc)) 0 / var(--range-progress, 0%) 100% no-repeat, ${({ theme }) => theme.colors.panel2};
    box-shadow: inset 0 1px 3px #56648344, 0 1px 0 #fff;
    border: 1px solid #a9b6cc;
  }
  input[type='range']::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 25px; height: 25px; margin-top: -9px;
    border-radius: 50%;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.panelLight};
    box-shadow: ${({ theme }) => theme.physical.elevated};
  }
  input[type='range']::-moz-range-track {
    height: 8px; border-radius: 10px;
    background: linear-gradient(90deg, var(--range-from, #44cbbf), var(--range-to, #8b74dc)) 0 / var(--range-progress, 0%) 100% no-repeat, ${({ theme }) => theme.colors.panel2};
    box-shadow: inset 0 1px 3px #56648344, 0 1px 0 #fff;
    border: 1px solid #a9b6cc;
  }
  input[type='range']::-moz-range-thumb {
    width: 25px; height: 25px; border-radius: 50%;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.panelLight};
    box-shadow: ${({ theme }) => theme.physical.elevated};
  }
  input[type='range']:active::-webkit-slider-thumb { box-shadow: ${({ theme }) => theme.physical.selected}; }
  @media (hover: none) {
    button:hover:not(:active):not([aria-pressed='true']):not([data-playing='true']) {
      transform: none; filter: none; background: var(--control-surface, ${({ theme }) => theme.gradients.secondary});
      box-shadow: ${({ theme }) => theme.physical.elevated};
    }
  }
  button[data-track] { scroll-margin-block: calc(var(--safe-top) + 7rem) calc(10rem + var(--lite-keyboard-inset, 0px)); }
  :focus-visible { outline: 3px solid ${({ theme }) => theme.colors.text}; outline-offset: 3px; }
  &[data-reduced-motion='true'] button { transform: none !important; }
  &[data-reduced-motion='true'] *, &[data-reduced-motion='true'] *::before {
    transition: none !important; animation: none !important;
  }
`
