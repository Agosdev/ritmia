const MAX_VISIBLE_IMPACTS = 4
const HIGH_TEMPO = 160
const DENSE_STEP_SECONDS = 0.18
const EMPTY_IMPACTS = Object.freeze([])

export function isDenseVisualPlayback({ bpm, numA, numB, stepA, stepB, showTrackB }) {
  return bpm >= HIGH_TEMPO ||
    stepA < DENSE_STEP_SECONDS ||
    (showTrackB && stepB < DENSE_STEP_SECONDS) ||
    numA + (showTrackB ? numB : 0) >= 48
}

export function getVisibleMusicalImpacts({
  scheduledNotes,
  audioTime,
  transportState,
  showTrackB,
  reduceMotion,
  bpm,
  numA,
  numB,
  stepA,
  stepB,
  volumeA,
  volumeB,
  mode,
  morphAmount,
}) {
  if (reduceMotion || transportState === 'stopped' || !Number.isFinite(audioTime)) {
    return EMPTY_IMPACTS
  }

  if (isDenseVisualPlayback({ bpm, numA, numB, stepA, stepB, showTrackB })) {
    return EMPTY_IMPACTS
  }

  const impacts = []
  for (const note of scheduledNotes) {
    if ((note.type !== 'A' && note.type !== 'B') || (note.type === 'B' && !showTrackB)) continue
    if (note.accent !== 1 && note.accent !== 2) continue

    const age = audioTime - note.time
    const step = note.type === 'A' ? stepA : stepB
    if (!Number.isFinite(step) || step <= 0) continue
    const duration = Math.min(note.accent === 2 ? 0.16 : 0.11, step * 0.72)
    if (age < 0 || age >= duration) continue

    const gain = note.type === 'A' ? volumeA : volumeB
    const morphGain = mode === 'morph'
      ? note.type === 'A' ? 1 - morphAmount : morphAmount
      : 1
    if (gain * morphGain <= 0.01) continue

    impacts.push({
      ...note,
      age,
      progress: age / duration,
      intensity: (note.accent === 2 ? 1 : 0.52) * gain * morphGain,
    })
  }

  if (!impacts.length) return EMPTY_IMPACTS
  impacts.sort((a, b) => b.time - a.time)
  return impacts.slice(0, MAX_VISIBLE_IMPACTS).reverse()
}

export function getAmbientTransform(audioTime, transportState, reduceMotion, dense = false) {
  if (transportState === 'stopped' || reduceMotion || dense || !Number.isFinite(audioTime)) {
    return 'translate(0 0)'
  }
  const sampledTime = Math.floor(audioTime * 30) / 30
  const x = Math.sin(sampledTime * 0.47) * 1.7
  const y = Math.sin(sampledTime * 0.31 + 1.4) * 1.25
  const rotation = Math.sin(sampledTime * 0.19) * 0.16
  return `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rotation.toFixed(3)} 380 250)`
}
