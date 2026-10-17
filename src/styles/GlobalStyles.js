import { createGlobalStyle } from 'styled-components'

export const GlobalStyles = createGlobalStyle`
  :root {
    --bg: ${({ theme }) => theme.colors.bg};
    --panel: ${({ theme }) => theme.colors.panel};
    --panel-2: ${({ theme }) => theme.colors.panel2};
    --border: ${({ theme }) => theme.colors.border};
    --border-strong: ${({ theme }) => theme.colors.borderStrong};
    --text: ${({ theme }) => theme.colors.text};
    --text-dim: ${({ theme }) => theme.colors.textDim};
    --amber: ${({ theme }) => theme.colors.amber};
    --cyan: ${({ theme }) => theme.colors.cyan};
    --safe-top: env(safe-area-inset-top, 0px);
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-variant-ligatures: none;
  }

  html, body {
    background: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.sans};
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    min-height: 100vh;
    overflow-x: hidden;
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  button, input, select, textarea {
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    border: none;
    outline: none;
  }

  button {
    cursor: pointer;
    background: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  input[type="range"] {
    accent-color: ${({ theme }) => theme.colors.amber};
    cursor: pointer;
  }

  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }

  ::selection {
    background-color: ${({ theme }) => theme.colors.amberGlow};
    color: ${({ theme }) => theme.colors.textBright};
  }

  /* Custom scrollbars */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.borderStrong};
    border-radius: 10px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.textMuted};
  }
`
