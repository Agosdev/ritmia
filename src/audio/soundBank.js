const ACOUSTIC_SAMPLE_FILES = {
  kickSoft: 'kick-soft.wav',
  kickStrong: 'kick-strong.wav',
  snareSoft: 'snare-soft.wav',
  snareStrong: 'snare-strong.wav',
}

export async function loadAcousticSoundBank(ctx) {
  const entries = Object.entries(ACOUSTIC_SAMPLE_FILES)
  const results = await Promise.allSettled(entries.map(async ([name, file]) => {
    const url = `${import.meta.env.BASE_URL}audio/acoustic/${file}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`No se pudo cargar la muestra ${file}: HTTP ${response.status}`)
    const encoded = await response.arrayBuffer()
    return [name, await ctx.decodeAudioData(encoded.slice(0))]
  }))
  const failed = results.find(result => result.status === 'rejected')
  if (failed?.status === 'rejected') throw failed.reason
  return Object.fromEntries(results.map(result => result.status === 'fulfilled' ? result.value : null))
}
