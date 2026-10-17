import { keyframes } from 'styled-components'

export const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
`

export const pulseGlow = keyframes`
  0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 6px #FFB800); }
  50% { opacity: 1; filter: drop-shadow(0 0 14px #FFB800); }
`

export const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`
