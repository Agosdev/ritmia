// Produces a review matrix from the production preset objects. Timing is
// calculated independently here so a regression shared with timingCalculator
// cannot make this audit agree with the same faulty implementation.
import { build } from 'esbuild'
import { writeFile, mkdir, stat, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = process.env.RITMIA_AUDIT_DIR || path.join(tmpdir(), 'ritmia-audio-audit')
const loadSourceModule = async entry => {
  const { outputFiles: [{ contents }] } = await build({ entryPoints: [path.join(root, entry)], bundle: true, write: false, format: 'esm', platform: 'node', target: 'node22' })
  return import(`data:text/javascript;base64,${Buffer.from(contents).toString('base64')}`)
}
try {
  const [{ MUSICAL_PRESETS }, { INSTRUMENTS, recommendedInstrument, resolveInstrumentHits }, { BASS_PATTERNS }, { PITCHED_INSTRUMENTS }] = await Promise.all([
    loadSourceModule('src/music/presets.js'),
    loadSourceModule('src/audio/instrumentCatalog.js'),
    loadSourceModule('src/music/bassPatterns.js'),
    loadSourceModule('src/audio/pitchedInstruments.js'),
  ])
  let audioMeasurements = []
  try { audioMeasurements = JSON.parse(await readFile(path.join(root, 'docs/evidence/rendered-audio/measurements.json'), 'utf8')) } catch { /* Matrix can be generated before the audio render. */ }
  const measurementByPreset = new Map(audioMeasurements.filter(item => item.presetId).map(item => [item.presetId, item]))
  const rows = MUSICAL_PRESETS.map(preset => {
    const subdivision = preset.subdivision ?? 1
    const stepSeconds = (60 / preset.bpm) * (4 / preset.den) / subdivision
    const barSeconds = stepSeconds * preset.num * subdivision
    const attacks = preset.events
      ? preset.events.flatMap((events, position) => events.length ? [`${position}:${events.map(({ articulation }) => articulation).join('+')}`] : [])
      : preset.strokes
        ? preset.strokes.flatMap((stroke, position) => stroke === '-' ? [] : [`${position}:${stroke}`])
        : preset.accents.flatMap((accent, position) => accent ? [`${position}:${accent === 2 ? 'fuerte' : 'suave'}`] : [])
    const instrument = preset.recommendedInstrument ?? recommendedInstrument(preset)
    const instrumentCoverage = Object.entries(INSTRUMENTS).map(([instrumentId, definition]) => {
      const usedSamples = new Set()
      let resolvedOnsets = 0, silentCellsAudible = 0
      for (let position = 0; position < preset.accents.length; position++) {
        const accent = preset.accents[position]
        const stroke = preset.events
          ? { events: preset.events[position], referenceAccent: accent }
          : preset.strokes?.[position]
        const hits = resolveInstrumentHits(instrumentId, accent, stroke)
        if (accent === 0 && hits.length) silentCellsAudible++
        if (accent !== 0 && hits.length) resolvedOnsets++
        hits.forEach(hit => usedSamples.add(hit.sample))
      }
      return { instrumentId, resolvedOnsets, sourceOnsets: preset.accents.filter(Boolean).length,
        silentCellsAudible, usedSamples: [...usedSamples],
        mappedToDeclaredSamples: [...usedSamples].every(sample => Boolean(definition.files?.[sample])) }
    })
    return {
      id: preset.id, family: preset.family, name: preset.name, meter: `${preset.num}/${preset.den}`,
      bpm: preset.bpm, bpmUnit: 'quarter-note/minute (BPM = negra/min)', subdivision,
      grid: `${preset.num * subdivision} x 1/${preset.den * subdivision}`,
      stepSeconds: Number(stepSeconds.toFixed(6)), barSeconds: Number(barSeconds.toFixed(6)),
      attacks, silences: preset.accents.flatMap((accent, position) => accent === 0 ? [position] : []),
      strongPositions: preset.accents.flatMap((accent, position) => accent === 2 ? [position] : []),
      articulationEvents: preset.events ?? null, strokes: preset.strokes ?? null,
      recommendedInstrument: instrument,
      instrumentAvailable: Boolean(INSTRUMENTS[instrument]),
      instrumentCoverage,
      bass: (BASS_PATTERNS[preset.id]?.events ?? []).map(({ position, midi, velocity }) => ({ position, midi, velocity })),
      description: preset.description,
    }
  })
  const assetFiles = new Set(Object.values(INSTRUMENTS).flatMap(instrument => Object.values(instrument.files ?? {})))
  for (const instrument of Object.values(PITCHED_INSTRUMENTS)) {
    for (const note of Object.values(instrument.notes)) assetFiles.add(note.file)
  }
  const assets = await Promise.all([...assetFiles].sort().map(async file => {
    const absolute = path.join(root, 'public/audio', file)
    const bytes = await readFile(absolute)
    const length = bytes.toString('ascii', 0, 4) === 'RIFF' ? bytes.readUInt32LE(4) + 8 : bytes.length
    let sampleRate = null, channels = null, bitsPerSample = null, dataBytes = null
    for (let offset = 12; offset + 8 <= length;) {
      const chunk = bytes.toString('ascii', offset, offset + 4)
      const size = bytes.readUInt32LE(offset + 4)
      if (chunk === 'fmt ') { channels = bytes.readUInt16LE(offset + 10); sampleRate = bytes.readUInt32LE(offset + 12); bitsPerSample = bytes.readUInt16LE(offset + 22) }
      if (chunk === 'data') { dataBytes = size; break }
      offset += 8 + size + (size % 2)
    }
    return { file, bytes: (await stat(absolute)).size, decodedBytesEstimate: sampleRate && channels && bitsPerSample && dataBytes ? Math.ceil(dataBytes / (bitsPerSample / 8) / channels) * channels * 4 : null, sampleRate, channels, durationSeconds: dataBytes && sampleRate && channels && bitsPerSample ? dataBytes / sampleRate / channels / (bitsPerSample / 8) : null }
  }))
  const report = {
    method: 'Preset data loaded through Vite SSR; bar/step duration independently calculated as (60/BPM)*(4/den)/subdivision and multiplied by the written numerator/subdivision. This checks data and arithmetic, not cultural/perceptual correctness or live scheduler timing.',
    presets: rows,
    freeMode: { family: 'libre', name: 'Compás libre', fixedMeter: false, fixedBpm: false, fixedPattern: false, defaultInstrument: 'acoustic', note: 'Es un modo de edición, no una entrada de MUSICAL_PRESETS; el compás, BPM, subdivisión, ataques, acentos y silencios pertenecen al usuario.' },
    audioMeasurementSummary: { renderedPresets: measurementByPreset.size, totalDefinedPresets: rows.length, allAttackCountsMatch: rows.every(row => { const result = measurementByPreset.get(row.id); return result && result.expectedOnsets === result.scheduledUniqueAttackTimestamps && result.missingOnsets === 0 }), allOutputsBelowUnity: rows.every(row => { const result = measurementByPreset.get(row.id); return result && result.peak < 1 && result.clippingSamples === 0 }) },
    assets: { count: assets.length, totalBytes: assets.reduce((sum, item) => sum + item.bytes, 0), estimatedDecodedBytesAllInstruments: assets.reduce((sum, item) => sum + (item.decodedBytesEstimate ?? 0), 0), files: assets },
  }
  await mkdir(out, { recursive: true })
  await writeFile(path.join(out, 'musical-matrix.json'), `${JSON.stringify(report, null, 2)}\n`)
  const table = [
    '# Matriz musical automática', '', `Presets definidos: ${rows.length}. Compás libre se documenta por separado porque es un modo editable, sin métrica ni patrón fijos. ${report.method}`, '',
    `**Compás libre:** ${report.freeMode.note}`, '',
    '| Familia | Preset | Métrica | BPM (negra/min) | Subdivisión | Duración compás (s) | Ataques (posición: articulación/acento) | Recomendación | Bajo | Resultado técnico | Resultado auditivo | Estado móvil | Error/corrección/límite |',
    '|---|---|---:|---:|---:|---:|---|---|---|---|---|---|---|',
    ...rows.map(row => {
      const audio = measurementByPreset.get(row.id)
      const technical = audio ? `${audio.scheduledUniqueAttackTimestamps}/${audio.expectedOnsets} ataques únicos; peak ${audio.peak.toFixed(3)}; ${audio.clippingSamples} muestras recortadas` : 'Render no ejecutado'
      const listening = audio?.reviewWav ? 'WAV generado; escucha humana pendiente' : 'Render medido; escucha humana pendiente'
      const mobileStatus = 'No verificado en hardware; ver medición emulada global'
      const limitation = 'Modelo pedagógico; ver descripción y documentación de familia'
      return `| ${row.family} | ${row.name} | ${row.meter} | ${row.bpm} | ${row.grid} | ${row.barSeconds.toFixed(3)} | ${row.attacks.join(', ')} | ${row.recommendedInstrument} | ${row.bass.length ? row.bass.map(event => `${event.position}:MIDI ${event.midi}`).join(', ') : '—'} | ${technical} | ${listening} | ${mobileStatus} | ${limitation} |`
    }),
    '', `Assets referenciados por instrumentos: ${assets.length}; archivos: ${report.assets.totalBytes} bytes; estimación PCM decodificada de todos: ${report.assets.estimatedDecodedBytesAllInstruments} bytes. La carga efectiva es diferida; esta suma no representa la carga inicial.`, '',
  ]
  await writeFile(path.join(out, 'musical-matrix.md'), `${table.join('\n')}\n`)
  console.log(JSON.stringify({ output: out, count: rows.length, assets: report.assets, presets: rows.map(({ id, meter, bpm, subdivision, barSeconds, attacks, silences, strongPositions, recommendedInstrument }) => ({ id, meter, bpm, subdivision, barSeconds, attacks, silences, strongPositions, recommendedInstrument })) }, null, 2))
} finally {}
