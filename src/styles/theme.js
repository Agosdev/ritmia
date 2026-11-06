export const neon = { A: '#00dcea', B: '#f45cda', success: '#42e58b' }

// Reference palette: violet #8A5CF5, cyan #2DD9D0, pink #F59CEB,
// lavender #9BABFF and warm translucent white #F5F5EE.
const sheen = 'linear-gradient(180deg, #ffffffaa 0%, #ffffff22 46%, #ffffff00 48%, #ffffff33 100%)'
export const gradients = {
  primary: `${sheen}, linear-gradient(120deg, #8ceee4, #2dd9d0 50%, #9babff)`,
  secondary: `${sheen}, linear-gradient(120deg, #d6c7fc, #e5dffd 50%, #f4c9ef)`,
  preset: `${sheen}, linear-gradient(120deg, #e7e2fa, #f6e5f4 60%, #d3f4f1)`,
  visualizer: 'linear-gradient(140deg, #ffffffb8, #d9cefa99 45%, #c8f3ef88)',
  dial: 'radial-gradient(ellipse at 30% 15%, #ffffffee, #ffffff44 40%, #9babff66 70%, #2dd9d044)',
  soft: `${sheen}, linear-gradient(120deg, #2dd9d0, #6389e9)`,
  strong: `${sheen}, linear-gradient(120deg, #8a5cf5, #f59ceb)`,
  silence: 'linear-gradient(120deg, #8a5cf5, #9babff)',
  softWash: `${sheen}, linear-gradient(135deg, #e4f8f4, #d4e5fa)`,
  strongWash: `${sheen}, linear-gradient(135deg, #e5dafa, #f9e2f4)`,
}

export const glass = {
  canvas: 'radial-gradient(ellipse at 7% 24%, #2dd9d026, transparent 42%), radial-gradient(ellipse at 94% 8%, #8a5cf52b, transparent 44%), radial-gradient(ellipse at 75% 85%, #f59ceb30, transparent 44%), #f5f5f2',
  fallback: '#f7f6fc',
  surface: 'radial-gradient(ellipse at 8% 0%, #ffffffcc, transparent 55%), linear-gradient(140deg, #ffffffb8, #f5f5ee88 55%, #e9e5fa99)',
  bar: 'linear-gradient(135deg, #fffffff0, #efecf9e8 55%, #e5f4f3ee)',
  rim: '#ffffffd9',
  edge: 'linear-gradient(125deg, #ffffff, #9babff99 20%, #ffffff 35%, #2dd9d088 65%, #f59ceb88 90%, #fff)',
}

export const theme = {
  gradients,
  glass,
  colors: {
    bg: '#0a0a0f',
    bgGlass: 'rgba(10, 10, 15, 0.85)',
    panel: '#14141e',
    panel2: '#1c1c29',
    panelLight: '#232330',
    border: '#232330',
    borderStrong: '#2e2e42',
    borderLight: 'rgba(255, 255, 255, 0.1)',
    text: '#f5f5f7',
    textDim: '#9a9ab0',
    textMuted: '#6b6b80',
    textBright: '#ffffff',
    amber: '#ffb800',
    amberGlow: 'rgba(255, 184, 0, 0.35)',
    amberSoft: '#ffd88a',
    cyan: '#00e5ff',
    cyanGlow: 'rgba(0, 229, 255, 0.35)',
    cyanSoft: '#a0e8ff',
    emerald: '#34d399',
    emeraldSoft: '#6ee7b7',
    red: '#ef4444',
    redSoft: '#fca5a5',
    inactiveBeat: '#0f0f18',
    inactiveBeatB: '#0f141e',
    inactiveBeatSoft: '#1a1a28',
    inactiveBeatSoftB: '#111a28',
    selectedControl: '#ffffff',
  },
  accent: {
    groupColors: ['#FFB800', '#FF6B35', '#9D4EDD', '#00E5FF', '#00FF88', '#FF3B6B'],
  },
  fonts: {
    sans: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    mono: 'ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, "JetBrains Mono", monospace',
    serif: 'Georgia, "Times New Roman", serif',
  },
  radii: {
    sm: '6px',
    md: '10px',
    lg: '12px',
    xl: '20px',
    full: '9999px',
  },
  shadows: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
    md: '0 8px 24px rgba(0, 0, 0, 0.5)',
    lg: '0 20px 80px rgba(0, 0, 0, 0.7)',
    glowAmber: '0 0 16px rgba(255, 184, 0, 0.45)',
    glowCyan: '0 0 16px rgba(0, 229, 255, 0.45)',
  },
  transitions: {
    fast: 'all 120ms ease',
    normal: 'all 200ms ease',
  },
}

export const liteTheme = {
  ...theme,
  variant: 'lite',
  colors: {
    ...theme.colors,
    bg: '#f5f5f2', bgGlass: '#f4f1fbee',
    panel: '#f7f6fc', panel2: '#eeecf7', panelLight: '#fffafd',
    border: '#b7accf', borderStrong: '#78649d', borderLight: '#ffffffd9',
    text: '#261c43', textDim: '#574b6d', textMuted: '#655977', textBright: '#21153c',
    // Dark ink for text contrast; bright cores are used only in LEDs and markers.
    amber: '#963c47', amberSoft: '#963c47', amberControl: '#e9edf0',
    cyan: '#17636d', cyanSoft: '#17636d', cyanControl: '#e9edf0',
    trackANeon: neon.A, trackBNeon: neon.B, successNeon: neon.success,
    amberNeon: neon.A, amberGlow: 'rgba(255,101,123,.5)',
    cyanNeon: neon.B, cyanGlow: 'rgba(35,207,224,.45)',
    violetNeon: '#b4a0ff', violetGlow: 'rgba(155,128,255,.4)',
    emerald: '#4c5b69', emeraldSoft: '#4c5b69', red: '#963c47', redSoft: '#963c47',
    inactiveBeat: '#e9edf0', inactiveBeatB: '#e9edf0',
    inactiveBeatSoft: '#e0e5e9', inactiveBeatSoftB: '#e0e5e9', selectedControl: '#e0e5e9',
  },
  accent: { groupColors: ['#4c5b69', '#75818c', '#4c5b69'] },
  physical: {
    elevated: '0 7px 12px #503c7a26, 0 2px 4px #48356c29, inset 0 2px 2px #ffffffee, inset 0 -2px 2px #8a5cf533, 0 0 0 1px #9babff44',
    hover: '0 11px 18px #503c7a33, 0 3px 6px #48356c26, inset 0 2px 2px #fff, inset 0 -2px 3px #8a5cf54d, 0 0 0 1px #9babff88',
    inset: 'inset 0 2px 5px #67528838, inset 0 -1px 1px #ffffffee, 0 1px 0 #ffffffcc',
    pressed: 'inset 0 3px 7px #61478455, inset 0 -1px 2px #ffffffee, 0 1px 2px #5e477322',
    selected: 'inset 0 2px 6px #61478444, inset 0 -1px 2px #ffffffdd, 0 3px 8px #8a5cf533',
    shell: '0 24px 46px #4833682e, 0 7px 14px #4833681f, inset 0 2px 2px #ffffffee, inset 0 -1px 2px #9babff66, 0 0 0 1px #8a5cf52b',
  },
  shadows: {
    sm: '0 7px 12px #503c7a26, 0 2px 4px #48356c29, inset 0 2px 2px #ffffffee',
    md: '0 14px 26px #503c7a2e, inset 0 2px 2px #ffffffee',
    lg: '0 24px 46px #48336838, inset 0 2px 2px #ffffffee',
    glowAmber: '0 6px 15px #8a5cf52b, inset 0 2px 2px #ffffffcc',
    glowCyan: '0 6px 15px #2dd9d033, inset 0 2px 2px #ffffffcc',
  },
}

// Stable theme objects: switching levels changes presentation only.
function levelTheme(warm) {
  const main = warm ? '#efb8a7' : '#79dce8'
  const middle = warm ? '#f2bdce' : '#9babff'
  const accent = warm ? '#98dce2' : '#f2c1b3'
  const rim = warm ? '#edb39d' : '#8fc8ed'
  return {
    ...liteTheme,
    colors: {
      ...liteTheme.colors,
      primaryBorder: warm ? '#c58a9b' : '#6eacca',
      secondaryBorder: warm ? '#c69aad' : '#9aabcf',
      selectionBorder: warm ? '#bf7595' : '#758ad4',
    },
    gradients: {
      ...gradients,
      primary: `${sheen}, linear-gradient(120deg, ${main}dd, ${middle}cc 65%, ${accent}aa)`,
      secondary: `${sheen}, linear-gradient(120deg, ${main}22, ${middle}55 65%, ${accent}33)`,
      preset: `${sheen}, linear-gradient(120deg, ${main}44, ${middle}55 65%, ${accent}55)`,
      dial: `radial-gradient(ellipse at 28% 14%, #ffffffdd, #ffffff11 45%, ${middle}55 76%, ${accent}44)`,
      softWash: `${sheen}, linear-gradient(135deg, ${main}55, ${middle}33)`,
      strongWash: `${sheen}, linear-gradient(135deg, ${middle}55, ${accent}55)`,
    },
    glass: {
      ...glass,
      canvas: `radial-gradient(ellipse at 3% 22%, ${main}66, transparent 44%), radial-gradient(ellipse at 94% 10%, ${middle}66, transparent 44%), radial-gradient(ellipse at 76% 88%, ${accent}44, transparent 42%), #f7f6f4`,
      surface: `radial-gradient(ellipse at 3% 0%, #ffffffc9, transparent 40%), radial-gradient(ellipse at 100% 100%, ${accent}22, transparent 45%), linear-gradient(145deg, #ffffff55, ${middle}11 56%, #ffffff33)`,
      bar: `linear-gradient(135deg, #ffffffd9, ${middle}33 60%, #ffffffb8)`,
      edge: `linear-gradient(125deg, #ffffff 4%, ${rim}bb 14%, #ffffffee 20%, ${accent}88 40%, #ffffffdd 48%, ${main}bb 65%, #ffffff 78%, ${middle}99 90%, #ffffffcc)`,
    },
    physical: {
      ...liteTheme.physical,
      shell: `0 22px 38px #40345024, 0 4px 8px #40345022, inset 0 1px 1px #ffffffee, inset 1px 0 1px #ffffffaa, inset 0 -1px 2px ${rim}88`,
    },
  }
}
export const levelThemes = { 1: levelTheme(false), 2: levelTheme(true) }
