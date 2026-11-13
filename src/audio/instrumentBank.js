import { INSTRUMENTS } from './instrumentCatalog'
import { PITCHED_INSTRUMENTS } from './pitchedInstruments'

// Context-scoped promises deduplicate both requests and decodes, including shared kits.
// Failed entries are removed so a deliberate retry can recover; successful files survive.
const contexts = new WeakMap()
export function loadSample(ctx, file) {
  let cache = contexts.get(ctx)
  if (!cache) { cache = new Map(); contexts.set(ctx, cache) }
  if (!cache.has(file)) {
    const pending = (async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}audio/${file}`)
      if (!response.ok) throw new Error(`No se pudo cargar ${file}: HTTP ${response.status}`)
      const bytes = await response.arrayBuffer()
      // Copy because Safari may detach the supplied ArrayBuffer during decode.
      return ctx.decodeAudioData(bytes.slice(0))
    })()
    cache.set(file, pending)
    pending.catch(() => { if (cache.get(file) === pending) cache.delete(file) })
  }
  return cache.get(file)
}
export async function loadInstrumentBank(ctx, id) {
  const kit = INSTRUMENTS[id] ?? INSTRUMENTS.acoustic
  const results = await Promise.allSettled(Object.entries(kit.files).map(async ([name, file]) => [name, await loadSample(ctx, file)]))
  const failure = results.find(r => r.status === 'rejected')
  if (failure) throw failure.reason
  return Object.fromEntries(results.map(r => r.value))
}

export async function loadPitchedInstrumentBank(ctx, id) {
  const instrument = PITCHED_INSTRUMENTS[id]
  if (!instrument) throw new Error(`Instrumento afinado desconocido: ${id}`)
  const entries = Object.entries(instrument.notes)
  const results = await Promise.allSettled(entries.map(async ([midi, note]) => [midi, await loadSample(ctx, note.file)]))
  const failure = results.find(result => result.status === 'rejected')
  if (failure) throw failure.reason
  return Object.fromEntries(results.map(result => result.value))
}
