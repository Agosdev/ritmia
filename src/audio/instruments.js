// Cada instrumento conserva sus fuentes y nodos hasta finalizar o recibir Stop.
// El retorno es opcional para los callers existentes que solo disparan un sonido.
function createVoice(ctx, branches) {
  const pending = new Set(branches)
  const voice = {
    onended: null,
    stop() {
      for (const branch of [...pending]) {
        try {
          branch.source.stop(ctx.currentTime)
        } finally {
          finish(branch)
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

  return createVoice(ctx, [{ source, nodes: [gain] }])
}
