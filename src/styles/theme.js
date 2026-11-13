export const neon = { A: '#00dcea', B: '#f45cda', success: '#42e58b' }

// Reference palette: violet #8A5CF5, cyan #2DD9D0, pink #F59CEB,
// lavender #9BABFF and warm translucent white #F5F5EE.
// Specular stays a separate layer so capsule fills can include it
// without turning into opaque pastel washes.
const sheen = 'linear-gradient(180deg, #ffffffee 0%, #ffffff6b 16%, #ffffff00 40%)'
const streak = 'linear-gradient(118deg, #ffffff8c 0%, #ffffff00 20%, #ffffff00 63%, #ffffff73 64.2%, #ffffff00 74%)'
const clearBody = 'linear-gradient(168deg, #ffffffc7 0%, #ffffff47 46%, #ffffff85 100%)'
export const gradients = {
  primary: `${sheen}, linear-gradient(120deg, #7ee7ea, #67b7ee 52%, #b7c4ff)`,
  secondary: `${streak}, ${sheen}, ${clearBody}`,
  preset: `${sheen}, linear-gradient(160deg, #ffffffd4, #ffffff66 58%, #e7f4ff88)`,
  visualizer: 'linear-gradient(140deg, #ffffffa8, #e4f7ff66 45%, #efe7ff55)',
  dial: 'radial-gradient(ellipse at 30% 14%, #fffffffa, #ffffff66 26%, #ffffff14 52%), linear-gradient(160deg, #ffffff88, #d7ecff44 70%, #efe4ff33)',
  soft: `${sheen}, linear-gradient(120deg, #2dd9d0, #7aa0ef)`,
  strong: `${sheen}, linear-gradient(120deg, #b98cff, #f59ceb)`,
  silence: 'linear-gradient(120deg, #8a5cf5, #9babff)',
  softWash: `${sheen}, linear-gradient(135deg, #d9fbff88, #e4e9ff77)`,
  strongWash: `${sheen}, linear-gradient(135deg, #efe4ff88, #ffd6f277)`,
}

export const glass = {
  canvas: 'radial-gradient(ellipse at 8% 0%, #b7f6f266, transparent 42%), radial-gradient(ellipse at 100% 8%, #c9d4ff55, transparent 40%), radial-gradient(ellipse at 72% 100%, #e7fbff44, transparent 42%), linear-gradient(180deg, #f5f8fb, #eef3f8 58%, #f7f5fb)',
  fallback: '#f6f8fc',
  surface: `${streak}, linear-gradient(180deg, #ffffff8f 0%, #ffffff42 46%, #ffffff73 100%)`,
  bar: `${streak}, linear-gradient(180deg, #ffffffb0 0%, #ffffff57 48%, #ffffff82 100%)`,
  rim: '#ffffffd4',
  field: `${sheen}, linear-gradient(180deg, #ffffffb3, #ffffff66)`,
  insetSurface: 'linear-gradient(180deg, #ffffff73, #ffffff3d)',
  reflection: 'linear-gradient(180deg, #ffffffd1 0%, #ffffff00 100%)',
  panelRadius: '28px',
  controlRadius: '16px',
  capsuleRadius: '999px',
  panelBlur: '16px',
  barBlur: '22px',
  saturation: '160%',
  focus: '#4d5f9c',
  halo: '#7ec8ff40',
  edge: 'linear-gradient(125deg, #ffffff 0%, #7ef3ee 14%, #ffffff 30%, #9babff 48%, #ffffff 64%, #d7c6ff 80%, #8fd0ff 92%, #ffffff 100%)',
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
  physical: {
    elevated: '0 12px 28px #3a4a6816, 0 2px 6px #3a4a6814, inset 0 1px 0 #ffffffee',
    hover: '0 16px 32px #3a4a681c, 0 3px 8px #3a4a6814, 0 0 18px #9babff2e, inset 0 1px 0 #fff',
    inset: 'inset 0 1px 2px #3a4a6818, inset 0 0 0 1px #ffffff80',
    pressed: '0 3px 8px #3a4a6812, inset 0 2px 5px #3a4a682b, inset 0 1px 0 #ffffff9e',
    selected: '0 12px 26px #3a4a6818, 0 0 22px #7ec8ff47, inset 0 1px 0 #fffffffa',
    shell: '0 26px 52px #3a4a6816, 0 6px 14px #3a4a680f, inset 0 1px 0 #ffffffee',
    bar: '0 10px 28px #3a4a6812, 0 2px 6px #3a4a680e, inset 0 1px 0 #ffffffee',
    dock: '0 -18px 40px #3a4a6814, 0 -3px 8px #3a4a680e, inset 0 1px 0 #ffffffee',
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
    // Float: wide ambient shadow, short contact, top specular. Press keeps a
    // single inset so the control compresses without a clay highlight pair.
    elevated: '0 12px 28px #3a4a6816, 0 2px 6px #3a4a6814, inset 0 1px 0 #ffffffee',
    hover: '0 16px 32px #3a4a681c, 0 3px 8px #3a4a6814, 0 0 18px #9babff2e, inset 0 1px 0 #fff',
    inset: 'inset 0 1px 2px #3a4a6818, inset 0 0 0 1px #ffffff80',
    pressed: '0 3px 8px #3a4a6812, inset 0 2px 5px #3a4a682b, inset 0 1px 0 #ffffff9e',
    selected: '0 12px 26px #3a4a6818, 0 0 22px #7ec8ff47, inset 0 1px 0 #fffffffa',
    shell: '0 26px 52px #3a4a6816, 0 6px 14px #3a4a680f, inset 0 1px 0 #ffffffee',
    bar: '0 10px 28px #3a4a6812, 0 2px 6px #3a4a680e, inset 0 1px 0 #ffffffee',
    dock: '0 -18px 40px #3a4a6814, 0 -3px 8px #3a4a680e, inset 0 1px 0 #ffffffee',
  },
  shadows: {
    sm: '0 8px 18px #3a4a6812, 0 1px 3px #3a4a6810, inset 0 1px 0 #ffffffee',
    md: '0 16px 32px #3a4a6814, 0 3px 8px #3a4a680f, inset 0 1px 0 #ffffffee',
    lg: '0 26px 52px #3a4a6818, 0 6px 14px #3a4a680f, inset 0 1px 0 #ffffffee',
    glowAmber: '0 8px 18px #f59ceb2e, inset 0 1px 0 #ffffffee',
    glowCyan: '0 8px 18px #2dd9d033, inset 0 1px 0 #ffffffee',
  },
}

// Stable theme objects: switching levels changes presentation only.
function levelTheme(warm) {
  const main = warm ? '#f3b19a' : '#6fd4e4'
  const middle = warm ? '#f3b4cb' : '#a9b8f2'
  const accent = warm ? '#f7c7b4' : '#c9b6ff'
  const rim = warm ? '#e7a498' : '#8eb6e2'
  const focus = warm ? '#945568' : '#526b9c'
  const edge = warm
    ? 'linear-gradient(125deg, #ffffff 0%, #ffd0c4 13%, #ffffff 28%, #f59ceb 46%, #ffffff 62%, #ffb48f 78%, #ffd0e2 92%, #ffffff 100%)'
    : 'linear-gradient(125deg, #ffffff 0%, #7ef3ee 13%, #ffffff 28%, #9babff 46%, #ffffff 62%, #b7e4ff 78%, #d5c8ff 92%, #ffffff 100%)'
  const canvas = warm
    ? `radial-gradient(ellipse at 6% 0%, #ffd4c866, transparent 42%), radial-gradient(ellipse at 100% 8%, #ffd0e655, transparent 40%), radial-gradient(ellipse at 74% 100%, #ffe6d244, transparent 42%), linear-gradient(180deg, #fbf7f5, #f8f1ee 56%, #fbf6f8)`
    : `radial-gradient(ellipse at 8% 0%, #b7f6f266, transparent 42%), radial-gradient(ellipse at 100% 8%, #c9d4ff55, transparent 40%), radial-gradient(ellipse at 72% 100%, #e7fbff44, transparent 42%), linear-gradient(180deg, #f5f8fb, #eef3f8 58%, #f7f5fb)`
  return {
    ...liteTheme,
    colors: {
      ...liteTheme.colors,
      primaryBorder: `${rim}b8`,
      secondaryBorder: `${rim}80`,
      selectionBorder: focus,
      border: `${rim}80`,
      borderStrong: focus,
      text: '#283249', textDim: '#536077', textBright: '#202c43',
      panel2: '#f4f5f9',
    },
    gradients: {
      ...gradients,
      primary: `${sheen}, linear-gradient(118deg, ${main}e0, ${middle}c2 54%, ${accent}aa)`,
      secondary: `${streak}, ${sheen}, ${clearBody}`,
      preset: `${sheen}, linear-gradient(155deg, #ffffffd6, ${middle}3d 68%, ${accent}33)`,
      dial: `radial-gradient(ellipse at 30% 14%, #fffffffa 0%, #ffffff6e 24%, #ffffff12 50%), radial-gradient(ellipse at 76% 88%, ${accent}44, transparent 46%), linear-gradient(165deg, #ffffff80, ${middle}2a)`,
      softWash: `${sheen}, linear-gradient(145deg, #ffffffaa, ${main}55 78%, ${middle}33)`,
      strongWash: `${sheen}, linear-gradient(145deg, #ffffffaa, ${middle}66 62%, ${accent}73)`,
    },
    glass: {
      ...glass,
      canvas,
      fallback: warm ? '#fcf8f7' : '#f6f9fc',
      surface: `${streak}, linear-gradient(180deg, #ffffff91 0%, #ffffff40 48%, ${middle}1a 100%)`,
      bar: `${streak}, linear-gradient(180deg, #ffffffb5 0%, #ffffff52 50%, ${middle}1c 100%)`,
      field: `${sheen}, linear-gradient(180deg, #ffffffc2, ${middle}22)`,
      insetSurface: `linear-gradient(180deg, #ffffff78, ${middle}16)`,
      edge,
      reflection: 'linear-gradient(180deg, #ffffffd6, #ffffff00)',
      focus,
      halo: `${main}59`,
      rangeFrom: warm ? '#f09aaf' : '#3ecad8',
      rangeTo: warm ? '#f0b08a' : '#8aa4ef',
    },
    physical: {
      ...liteTheme.physical,
      hover: `0 16px 32px #3a4a681c, 0 3px 8px #3a4a6814, 0 0 20px ${main}47, inset 0 1px 0 #fff`,
      selected: `0 12px 26px #3a4a6818, 0 0 24px ${main}66, inset 0 1px 0 #fffffffa`,
      shell: `0 26px 52px #3a4a6816, 0 6px 14px #3a4a680f, inset 0 1px 0 #ffffffee`,
    },
  }
}
export const levelThemes = { 1: levelTheme(false), 2: levelTheme(true) }
