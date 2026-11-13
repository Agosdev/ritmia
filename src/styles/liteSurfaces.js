import { css } from 'styled-components'

// Clear capsule. The masked rim carries the iridescence; the fill stays translucent.
export const liteSurface = css`
  position: relative;
  background: var(--control-surface, ${({ theme }) => theme.gradients.secondary});
  border: 1px solid ${({ theme }) => theme.glass.rim};
  box-shadow: ${({ theme }) => theme.physical.elevated};
  @supports ((mask-composite: exclude) or (-webkit-mask-composite: xor)) {
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1.25px;
      background: ${({ theme }) => theme.glass.edge};
      pointer-events: none;
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
    }
  }
`

export const litePressable = css`
  transition: transform 160ms cubic-bezier(.2,.8,.25,1), box-shadow 180ms ease, border-color 180ms ease, background-color 180ms ease;
  @media (hover: hover) and (pointer: fine) {
    &:hover:not(:disabled):not([aria-pressed='true']):not(:active):not([data-playing='true']) {
      transform: translateY(-1px);
      background: var(--control-surface, ${({ theme }) => theme.gradients.secondary});
      box-shadow: ${({ theme }) => theme.physical.hover};
    }
  }
  &[aria-pressed='true'], &[data-playing='true'] {
    box-shadow: ${({ theme }) => theme.physical.selected};
    font-weight: 750;
  }
  &:active:not(:disabled) {
    transform: translateY(1px) scale(.985);
    box-shadow: ${({ theme }) => theme.physical.pressed};
  }
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.glass.focus};
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
  button[data-playing='true'] { box-shadow: ${({ theme }) => theme.physical.selected}; }
  button[data-action='play'] { --control-surface: ${({ theme }) => theme.gradients.primary}; font-weight: 750; }
  button[data-action='reset'] { --control-surface: ${({ theme }) => theme.gradients.secondary}; }
  select#musical-preset {
    border-radius: ${({ theme }) => theme.glass.controlRadius};
    background: ${({ theme }) => theme.gradients.preset};
    border: 1px solid ${({ theme }) => theme.glass.rim};
    box-shadow: ${({ theme }) => theme.physical.elevated};
  }
  button[aria-label^='Quitar preset'] { min-height: 44px; height: 44px; padding: 0; font-size: 18px; border-radius: 50%; }
  button:disabled { opacity: .45; cursor: not-allowed; }
  button[data-track]:disabled { opacity: 1; }
  input:disabled, select:disabled { cursor: not-allowed; }
  input:not([type='range']):not([type='checkbox']), select {
    min-height: 44px;
    background: ${({ theme }) => theme.glass.field};
    box-shadow: ${({ theme }) => theme.physical.inset};
    border: 1px solid ${({ theme }) => theme.glass.rim};
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
    height: 10px;
    border-radius: 999px;
    background: linear-gradient(180deg, #ffffffcc, #ffffff00 46%, #ffffff73), linear-gradient(90deg, var(--range-from, ${({ theme }) => theme.glass.rangeFrom ?? '#3ecad8'}), var(--range-to, ${({ theme }) => theme.glass.rangeTo ?? '#8aa4ef'})) 0 / var(--range-progress, 0%) 100% no-repeat, linear-gradient(180deg, #ffffff66, #e7eef388);
    box-shadow: inset 0 1px 2px #3a4a6822, inset 0 0 0 1px #ffffffaa, 0 1px 1px #ffffffcc;
    border: 1px solid #ffffffd4;
  }
  input[type='range']::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 26px; height: 26px; margin-top: -9px;
    border-radius: 50%;
    border: 1px solid #ffffffee;
    background: radial-gradient(circle at 32% 26%, #fff 0%, #ffffffc4 22%, #ffffff00 48%), linear-gradient(145deg, #ffffffee, #d7e6ff 58%, #f8d7ea);
    box-shadow: 0 8px 16px #3a4a6824, 0 1px 3px #3a4a6818, inset 0 1px 1px #fff, 0 0 0 1px #ffffffcc;
    transition: transform 140ms ease, box-shadow 160ms ease;
  }
  input[type='range']::-moz-range-track {
    height: 10px; border-radius: 999px;
    background: linear-gradient(180deg, #ffffffcc, #ffffff00 46%, #ffffff73), linear-gradient(90deg, var(--range-from, ${({ theme }) => theme.glass.rangeFrom ?? '#3ecad8'}), var(--range-to, ${({ theme }) => theme.glass.rangeTo ?? '#8aa4ef'})) 0 / var(--range-progress, 0%) 100% no-repeat, linear-gradient(180deg, #ffffff66, #e7eef388);
    box-shadow: inset 0 1px 2px #3a4a6822, inset 0 0 0 1px #ffffffaa, 0 1px 1px #ffffffcc;
    border: 1px solid #ffffffd4;
  }
  input[type='range']::-moz-range-thumb {
    width: 26px; height: 26px; border-radius: 50%;
    border: 1px solid #ffffffee;
    background: radial-gradient(circle at 32% 26%, #fff 0%, #ffffffc4 22%, #ffffff00 48%), linear-gradient(145deg, #ffffffee, #d7e6ff 58%, #f8d7ea);
    box-shadow: 0 8px 16px #3a4a6824, 0 1px 3px #3a4a6818, inset 0 1px 1px #fff, 0 0 0 1px #ffffffcc;
  }
  input[type='range']:active::-webkit-slider-thumb {
    transform: scale(.96);
    box-shadow: 0 2px 6px #3a4a6818, inset 0 2px 4px #3a4a6824, 0 0 14px ${({ theme }) => theme.glass.halo};
  }
  input[type='range']:active::-moz-range-thumb {
    transform: scale(.96);
    box-shadow: 0 2px 6px #3a4a6818, inset 0 2px 4px #3a4a6824, 0 0 14px ${({ theme }) => theme.glass.halo};
  }
  @media (hover: none) {
    button:hover:not(:active):not([aria-pressed='true']):not([data-playing='true']) {
      transform: none; filter: none; background: var(--control-surface, ${({ theme }) => theme.gradients.secondary});
      box-shadow: ${({ theme }) => theme.physical.elevated};
    }
  }
  button[data-track] { scroll-margin-block: calc(var(--safe-top) + 7rem) calc(10rem + var(--lite-keyboard-inset, 0px)); }
  :focus-visible { outline: 3px solid ${({ theme }) => theme.glass.focus}; outline-offset: 3px; }
  @media (forced-colors: active) {
    button { border: 1px solid ButtonText; }
    button::before { display: none; }
  }
  &[data-reduced-motion='true'] button { transform: none !important; }
  &[data-reduced-motion='true'] *, &[data-reduced-motion='true'] *::before {
    transition: none !important; animation: none !important;
  }
`
