// Cada instrumento conserva sus fuentes y nodos hasta finalizar o recibir Stop.
// El retorno es opcional para los callers existentes que solo disparan un sonido.
function createVoice(ctx, branches) {
  const pending = new Set(branches)
  const voice = {
    onended: null,
    startTime: Math.min(...branches.map(branch => branch.startTime)),
    endTime: Math.max(...branches.map(branch => branch.endTime)),
    stop(fadeSeconds = 0, atTime = ctx.currentTime) {
      const end = Math.min(voice.endTime, atTime + fadeSeconds)
      voice.endTime = end
      for (const branch of [...pending]) {
        const fading = fadeSeconds > 0 && end > ctx.currentTime
        try {
          if (fading) {
            const gain = branch.nodes[0]?.gain
            gain?.cancelScheduledValues?.(atTime)
            gain?.setValueAtTime(branch.level, atTime)
            gain?.linearRampToValueAtTime(0, end)
            branch.source.stop(end)
          } else branch.source.stop(ctx.currentTime)
        } finally {
          if (!fading) finish(branch)
        }
      }
    },
  }

  function finish(branch) {
    if (!pending.delete(branch)) return
    branch.source.onended = null
    branch.source.disconnect()
    for (const node of branch.nodes) node.disconnect()
    if (pending.size === 0) {
      const onended = voice.onended
      voice.onended = null
      onended?.()
    }
  }

  for (const branch of branches) branch.source.onended = () => finish(branch)
  return voice
}

export function playSample(ctx, destination, time, buffer, velocity = 1, volume = 1, maxDuration = buffer?.duration) {
  if (!ctx || !destination || !buffer) return
  const source = ctx.createBufferSource()
  const gain = ctx.createGain()

  source.buffer = buffer
  gain.gain.setValueAtTime(velocity * volume, time)
  source.connect(gain)
  gain.connect(destination)

  source.start(time)
  const duration = Math.min(buffer.duration, maxDuration)
  if (duration < buffer.duration) {
    gain.gain.setValueAtTime(velocity * volume, time + Math.max(0, duration - 0.015))
    gain.gain.linearRampToValueAtTime(0, time + duration)
  }
  source.stop(time + duration)

  return createVoice(ctx, [{ source, nodes: [gain], startTime: time, endTime: time + duration, level: velocity * volume }])
}

export function playPitchedSample(ctx, destination, time, buffer, rootMidi, midi, velocity = 1, volume = 1, maxDuration = 0.42) {
  if (!ctx || !destination || !buffer || !Number.isInteger(rootMidi) || !Number.isInteger(midi)) return
  const rate = 2 ** ((midi - rootMidi) / 12)
  if (!Number.isFinite(rate) || rate < 0.5 || rate > 2) return
  const source = ctx.createBufferSource()
  const gain = ctx.createGain()
  source.buffer = buffer
  source.playbackRate.setValueAtTime(rate, time)
  gain.gain.setValueAtTime(velocity * volume, time)
  source.connect(gain)
  gain.connect(destination)
  const duration = Math.min(maxDuration, buffer.duration / rate)
  source.start(time)
  gain.gain.setValueAtTime(velocity * volume, time + Math.max(0, duration - 0.035))
  gain.gain.linearRampToValueAtTime(0, time + duration)
  source.stop(time + duration)
  return createVoice(ctx, [{ source, nodes: [gain], startTime: time, endTime: time + duration, level: velocity * volume }])
}
