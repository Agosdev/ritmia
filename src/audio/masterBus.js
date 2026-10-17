/**
 * Crea la cadena de masterización de audio:
 * masterGain (0.6) -> DynamicsCompressorNode -> destination
 */
export function createMasterBus(audioContext) {
  const masterGain = audioContext.createGain()
  masterGain.gain.value = 0.6

  const compressor = audioContext.createDynamicsCompressor()
  compressor.threshold.value = -20
  compressor.ratio.value = 6
  compressor.knee.value = 20
  compressor.attack.value = 0.003
  compressor.release.value = 0.2

  masterGain.connect(compressor)
  compressor.connect(audioContext.destination)

  return {
    masterGain,
    compressor,
  }
}
