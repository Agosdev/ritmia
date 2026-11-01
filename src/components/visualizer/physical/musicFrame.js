// Presentation only: read scheduled events and AudioContext, never schedule audio.
export function trackGain(params, track) {
  const volume = track === 'A' ? params.volumeA : params.volumeB
  const morph = params.mode === 'morph' && params.level === 3
    ? track === 'A' ? 1 - params.morph : params.morph
    : 1
  return Math.max(0, Math.min(1, volume * morph))
}

export function readMusicFrame(engine, { showTrackB = false, reduceMotion = false } = {}) {
  const time = engine.getCurrentAudioTime()
  const stopped = engine.transportState === 'stopped'
  const tracks = (showTrackB ? ['A', 'B'] : ['A']).map(track => {
    const params = engine.params
    const accents = track === 'A' ? params.accentsA : params.accentsB
    const count = Math.max(1, accents.length)
    const step = track === 'A' ? params.stepA : params.stepB
    let previous = null
    let next = null
    if (!stopped) {
      for (const note of engine.scheduledNotes) {
        if (note.type !== track) continue
        if (note.time <= time) previous = note
        else { next = note; break }
      }
    }
    const nextTime = engine[`nextNoteTime${track}`]
    const cursor = engine[`stepCount${track}`]
    const interval = previous && nextTime > previous.time ? nextTime - previous.time : step
    const distance = previous && next ? (next.pos - previous.pos + count) % count || 1 : 1
    let position = previous
      ? previous.pos + (time - previous.time) / (next ? next.time - previous.time : interval) * distance
      : cursor - 1 + (time - (nextTime - step)) / step
    if (stopped || !Number.isFinite(position) || time < engine.startTime) position = 0
    const phase = ((position % count) + count) % count / count
    const gain = trackGain(params, track)
    const age = previous ? time - previous.time : Infinity
    const accent = previous?.accent ?? 0
    const audible = !stopped && age >= 0 && (accent === 1 || accent === 2) && gain > 0
    const duration = Math.min(Math.max(step * .9, .035), .8)
    const flight = audible && age < duration ? age / duration : 1
    const strength = (accent === 2 ? 1 : .55) * gain
    const impact = !reduceMotion && audible ? Math.max(0, 1 - age / Math.min(.1, step * .55)) * strength : 0
    return {
      track, count, accents, step, gain, phase,
      position: previous?.pos ?? 0, accent, audible,
      eventTime: audible ? previous.time : null,
      height: reduceMotion || !audible ? 0 : 4 * flight * (1 - flight) * strength,
      impact,
      scaleX: reduceMotion ? 1 : 1 + impact * .28 - (flight < .6 && audible ? .04 * strength : 0),
      scaleY: reduceMotion ? 1 : 1 - impact * .24 + (flight < .6 && audible ? .07 * strength : 0),
    }
  })
  return { time, tracks, stopped, playing: engine.isPlaying, reduceMotion }
}
