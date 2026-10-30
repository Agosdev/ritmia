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

export function playSample(ctx, destination, time, buffer, velocity = 1, volume = 1) {
  if (!ctx || !destination || !buffer) return
  const source = ctx.createBufferSource()
  const gain = ctx.createGain()

  source.buffer = buffer
  gain.gain.setValueAtTime(velocity * volume, time)
  source.connect(gain)
  gain.connect(destination)

  source.start(time)
  source.stop(time + buffer.duration)

  return createVoice(ctx, [{ source, nodes: [gain] }])
}

let cachedNoiseBuffer = null

/**
 * Genera o reutiliza un buffer de ruido blanco de 0.5 segundos.
 */
export function getNoiseBuffer(ctx) {
  if (!ctx || !ctx.sampleRate) return null
  if (cachedNoiseBuffer && cachedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return cachedNoiseBuffer
  }
  const length = Math.floor(ctx.sampleRate * 0.5)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1
  }
  cachedNoiseBuffer = buffer
  return buffer
}

/**
 * Síntesis de Bombo (Kick) analógico:
 * Onda senoidal con barrido rápido de tono 160Hz -> 45Hz y envolvente percusiva.
 */
export function playKick(ctx, destination, time, velocity = 1, volume = 1) {
  if (!ctx || !destination) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(160, time)
  osc.frequency.linearRampToValueAtTime(45, time + 0.11)

  const peak = 0.85 * velocity * volume
  gain.gain.setValueAtTime(0.001, time)
  gain.gain.linearRampToValueAtTime(peak, time + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28)

  osc.connect(gain)
  gain.connect(destination)

  osc.start(time)
  osc.stop(time + 0.28)

  return createVoice(ctx, [{ source: osc, nodes: [gain] }])
}

/**
 * Síntesis de Bajo suave / pulso secundario (Bass/Pulse):
 * Onda triangular a 110Hz pasada por filtro pasa-bajos a 850Hz.
 */
export function playBass(ctx, destination, time, velocity = 1, volume = 1) {
  if (!ctx || !destination) return
  const osc = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()

  osc.type = 'triangle'
  osc.frequency.setValueAtTime(110, time)

  filter.type = 'lowpass'
  filter.frequency.value = 850

  const peak = 0.22 * velocity * volume
  gain.gain.setValueAtTime(0.001, time)
  gain.gain.linearRampToValueAtTime(peak, time + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(destination)

  osc.start(time)
  osc.stop(time + 0.33)

  return createVoice(ctx, [{ source: osc, nodes: [filter, gain] }])
}

/**
 * Síntesis de Redoblante (Snare):
 * Ruido blanco filtrado en pasa-banda (180Hz) combinado con cuerpo tonal (185Hz).
 */
export function playSnare(ctx, destination, time, velocity = 1, volume = 1) {
  if (!ctx || !destination) return
  const noiseBuf = getNoiseBuffer(ctx)
  if (!noiseBuf) return

  // Componente de ruido
  const noiseSource = ctx.createBufferSource()
  noiseSource.buffer = noiseBuf

  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 180
  bandpass.Q.value = 1

  const noiseGain = ctx.createGain()
  const noisePeak = 0.42 * velocity * volume
  noiseGain.gain.setValueAtTime(0.001, time)
  noiseGain.gain.linearRampToValueAtTime(noisePeak, time + 0.005)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18)

  noiseSource.connect(bandpass)
  bandpass.connect(noiseGain)
  noiseGain.connect(destination)

  // Componente de tono tonal
  const tonalOsc = ctx.createOscillator()
  tonalOsc.type = 'sine'
  tonalOsc.frequency.setValueAtTime(185, time)

  const tonalGain = ctx.createGain()
  const tonalPeak = 0.22 * velocity * volume
  tonalGain.gain.setValueAtTime(0.001, time)
  tonalGain.gain.linearRampToValueAtTime(tonalPeak, time + 0.004)
  tonalGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12)

  tonalOsc.connect(tonalGain)
  tonalGain.connect(destination)

  noiseSource.start(time)
  noiseSource.stop(time + 0.18)
  tonalOsc.start(time)
  tonalOsc.stop(time + 0.12)

  return createVoice(ctx, [
    { source: tonalOsc, nodes: [tonalGain] },
    { source: noiseSource, nodes: [bandpass, noiseGain] },
  ])
}

/**
 * Síntesis de Charles / Hi-Hat:
 * Ráfaga corta de ruido blanco pasada por filtro pasa-altos a 6500Hz.
 */
export function playHat(ctx, destination, time, velocity = 1, volume = 1) {
  if (!ctx || !destination) return
  const noiseBuf = getNoiseBuffer(ctx)
  if (!noiseBuf) return

  const source = ctx.createBufferSource()
  source.buffer = noiseBuf

  const highpass = ctx.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = 6500

  const gain = ctx.createGain()
  const peak = 0.11 * velocity * volume
  gain.gain.setValueAtTime(0.001, time)
  gain.gain.linearRampToValueAtTime(peak, time + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045)

  source.connect(highpass)
  highpass.connect(gain)
  gain.connect(destination)

  source.start(time)
  source.stop(time + 0.06)

  return createVoice(ctx, [{ source, nodes: [highpass, gain] }])
}

/**
 * Síntesis de Clave / Woodblock para el metrónomo en tiempo 1:
 * Senoide percusiva a 850Hz con caída a 420Hz.
 */
export function playWoodblock(ctx, destination, time, volume = 0.8) {
  if (!ctx || !destination) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(850, time)
  osc.frequency.exponentialRampToValueAtTime(420, time + 0.12)

  const peak = 0.38 * volume
  gain.gain.setValueAtTime(0.001, time)
  gain.gain.linearRampToValueAtTime(peak, time + 0.003)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12)

  osc.connect(gain)
  gain.connect(destination)

  osc.start(time)
  osc.stop(time + 0.13)

  return createVoice(ctx, [{ source: osc, nodes: [gain] }])
}
