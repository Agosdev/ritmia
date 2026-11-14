// Current Ritmia mobile/desktop performance sampling. This replaces an older
// prototype-only harness whose selectors no longer existed in the shipped app.
// Run with the Vite server available at RITMIA_URL and Node 22.
import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const baseURL = process.env.RITMIA_URL ?? 'http://127.0.0.1:5173'
const output = process.env.PERFORMANCE_EVIDENCE_DIR ?? path.join(tmpdir(), 'ritmia-audio-performance')
const durationMs = Number(process.env.PERFORMANCE_SAMPLE_MS ?? 8000)
const longDurationMs = Number(process.env.PERFORMANCE_LONG_SAMPLE_MS ?? 0)
const width = Number(process.env.PERFORMANCE_VIEWPORT_WIDTH ?? 375)
const height = Number(process.env.PERFORMANCE_VIEWPORT_HEIGHT ?? 812)
const mobile = width <= 600
const launchOptions = { headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) }
const browser = await chromium.launch(launchOptions)
const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile })
const page = await context.newPage()
const client = await context.newCDPSession(page)
const errors = []
page.on('pageerror', error => errors.push(error.message))
await client.send('Performance.enable')
await page.addInitScript(() => {
  const Native = window.AudioContext || window.webkitAudioContext
  const stats = window.__ritmiaAudioStats = { sources: [], contexts: 0, contextRefs: [], decodedBuffers: [] }
  if (!Native) return
  const Instrumented = class extends Native {
    constructor(...args) { super(...args); stats.contexts++; stats.contextRefs.push(this) }
    decodeAudioData(...args) {
      const decodeStartedAt = performance.now()
      return super.decodeAudioData(...args).then(buffer => {
        stats.decodedBuffers.push({ sampleRate: buffer.sampleRate, channels: buffer.numberOfChannels, frames: buffer.length,
          pcmBytes: buffer.length * buffer.numberOfChannels * 4, decodeMs: performance.now() - decodeStartedAt })
        return buffer
      })
    }
    createBufferSource() {
      const source = super.createBufferSource()
      const record = { start: null, requestedAt: null, duration: null, contextIndex: stats.contextRefs.length - 1, ended: false }
      stats.sources.push(record)
      const start = source.start.bind(source)
      source.start = (...args) => {
        record.start = args[0] ?? this.currentTime
        record.requestedAt = this.currentTime
        record.duration = source.buffer?.duration ?? 0
        return start(...args)
      }
      source.addEventListener('ended', () => { record.ended = true }, { once: true })
      return source
    }
  }
  window.AudioContext = Instrumented
  if (window.webkitAudioContext) window.webkitAudioContext = Instrumented
})

async function measure(label, ms, during = null) {
  const before = await client.send('Performance.getMetrics')
  const pendingResult = page.evaluate(duration => new Promise(resolve => {
    const frames = [], longTasks = [], mutations = { attributes: 0, childList: 0, characterData: 0 }
    const audioStats = window.__ritmiaAudioStats
    const sourceOffset = audioStats.sources.length
    const bufferOffset = audioStats.decodedBuffers.length
    let previous, start = performance.now()
    const heapSamples = []
    const sampleHeap = () => heapSamples.push({ elapsedMs: Math.round(performance.now() - start), bytes: performance.memory?.usedJSHeapSize ?? null })
    sampleHeap()
    const heapSampler = setInterval(sampleHeap, 1000)
    const svg = document.querySelector('svg[role="img"][aria-labelledby="lite-cycle-title lite-cycle-description"]')
    let activeVoicesPeak = 0
    const voiceSampler = setInterval(() => {
      const audio = window.__ritmiaAudioStats
      const active = audio.sources.filter(source => {
        const audioContext = audio.contextRefs[source.contextIndex]
        return audioContext && !source.ended && source.start !== null && source.start <= audioContext.currentTime &&
          source.start + source.duration > audioContext.currentTime
      }).length
      activeVoicesPeak = Math.max(activeVoicesPeak, active)
    }, 50)
    let observer
    try {
      observer = new PerformanceObserver(entries => entries.getEntries().forEach(entry => longTasks.push(entry.duration)))
      observer.observe({ type: 'longtask', buffered: false })
    } catch {}
    const mutation = svg ? new MutationObserver(records => records.forEach(record => { mutations[record.type]++ })) : null
    mutation?.observe(svg, { attributes: true, childList: true, characterData: true, subtree: true })
    const frame = timestamp => {
      if (previous !== undefined) frames.push(timestamp - previous)
      previous = timestamp
      if (timestamp - start < duration) return requestAnimationFrame(frame)
      setTimeout(() => {
        observer?.disconnect(); mutation?.disconnect(); clearInterval(voiceSampler); clearInterval(heapSampler); sampleHeap()
        const sorted = [...frames].sort((a, b) => a - b)
        const pct = p => sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)] ?? null
        resolve({ durationMs: Math.round(timestamp - start), frames: frames.length,
          fps: Number((frames.length / ((timestamp - start) / 1000)).toFixed(1)),
          frameIntervalMs: { p50: pct(.5), p95: pct(.95), p99: pct(.99), max: Math.max(0, ...frames) },
          intervalsOver32ms: frames.filter(value => value > 32).length,
          intervalsOver50ms: frames.filter(value => value > 50).length,
          longTasks: { count: longTasks.length, totalMs: Number(longTasks.reduce((a,b)=>a+b,0).toFixed(2)), maxMs: Math.max(0,...longTasks), supported: Boolean(observer) },
          svgMutations: mutations,
          heapBytes: performance.memory?.usedJSHeapSize ?? null,
          heapTrend: (() => {
            const values = heapSamples.map(sample => sample.bytes).filter(Number.isFinite)
            return { samples: values.length, firstBytes: values[0] ?? null, lastBytes: values.at(-1) ?? null,
              minBytes: values.length ? Math.min(...values) : null, maxBytes: values.length ? Math.max(...values) : null,
              deltaBytes: values.length > 1 ? values.at(-1) - values[0] : null, series: heapSamples }
          })(),
          audio: {
            contexts: audioStats.contexts,
            sources: audioStats.sources.slice(sourceOffset),
            decodedBuffers: audioStats.decodedBuffers.slice(bufferOffset),
            decodedPcmBytes: audioStats.decodedBuffers.slice(bufferOffset).reduce((sum, buffer) => sum + buffer.pcmBytes, 0),
            decodedBuffersTotal: audioStats.decodedBuffers.length,
            decodedPcmBytesTotal: audioStats.decodedBuffers.reduce((sum, buffer) => sum + buffer.pcmBytes, 0),
            decodeMsTotal: audioStats.decodedBuffers.reduce((sum, buffer) => sum + buffer.decodeMs, 0),
            activeVoicesPeak,
          },
          scheduler: (() => {
            const starts = audioStats.sources.slice(sourceOffset).filter(source => source.start !== null)
            const lead = starts.map(source => (source.start - source.requestedAt) * 1000).sort((a, b) => a - b)
            const percentile = p => lead[Math.min(lead.length - 1, Math.ceil(lead.length * p) - 1)] ?? null
            return { startedSources: starts.length, startsLate: starts.filter(source => source.start < source.requestedAt).length,
              startLeadMs: { p50: percentile(.5), p95: percentile(.95), min: lead[0] ?? null } }
          })(),
          audioRequests: performance.getEntriesByType('resource').filter(entry => /\/audio\/.*\.wav/.test(entry.name)).map(entry => ({ name: entry.name.split('/').slice(-2).join('/'), transferBytes: entry.transferSize, decodedBodyBytes: entry.decodedBodySize })),
        })
      }, 0)
    }
    requestAnimationFrame(frame)
  }), ms)
  if (during) await during()
  const result = await pendingResult
  const after = await client.send('Performance.getMetrics')
  const select = response => Object.fromEntries((response.metrics ?? []).filter(m => ['TaskDuration','ScriptDuration','TaskOtherDuration','LayoutDuration','RecalcStyleDuration','JSHeapUsedSize'].includes(m.name)).map(m => [m.name, m.value]))
  const beforeMetrics = select(before), afterMetrics = select(after)
  const deltaMs = Object.fromEntries(Object.keys(beforeMetrics).filter(key => key !== 'JSHeapUsedSize').map(key => [key, Number(((afterMetrics[key] - beforeMetrics[key]) * 1000).toFixed(2))]))
  return { label, mainThreadDeltaMs: deltaMs, ...result }
}

try {
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  const invitation = page.getByRole('button', { name: 'Ahora no', exact: true })
  if (await invitation.count()) await invitation.click()
  const samples = [await measure('idle', durationMs)]

  const selectPreset = async id => {
    await page.getByRole('combobox', { name: 'Preset', exact: true }).click()
    await page.locator(`[data-preset-id="${id}"]`).click()
  }
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
  await page.getByRole('button', { name: 'Detener reproducción', exact: true }).waitFor()
  samples.push(await measure('simple-free-time-level-1', durationMs))
  await page.getByRole('button', { name: 'Detener reproducción', exact: true }).click()

  await selectPreset('funk-clasico')
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
  await page.getByRole('button', { name: 'Detener reproducción', exact: true }).waitFor()
  samples.push(await measure('funk-battery-plus-bass-level-1', durationMs))
  await page.getByRole('button', { name: 'Detener reproducción', exact: true }).click()

  await page.getByRole('button', { name: 'Nivel 2 — Dos ritmos', exact: true }).click()
  await page.getByRole('button', { name: /^Polimetría —/ }).click()
  await page.getByRole('spinbutton', { name: 'Valor numérico BPM', exact: true }).fill('200')
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
  await page.getByRole('button', { name: 'Detener reproducción', exact: true }).waitFor()
  samples.push(await measure('two-tracks-funk-plus-default-B', durationMs))

  await page.getByLabel('Numerador compás B', { exact: true }).fill('32')
  await page.getByLabel('Denominador compás B', { exact: true }).selectOption('16')
  const cellsB = page.getByRole('group', { name: 'Secuenciador pista B', exact: true }).getByRole('button')
  for (const cell of await cellsB.all()) if (await cell.getAttribute('data-accent') === '0') await cell.click()
  samples.push(await measure('dense-funk-plus-32-step-track-B', durationMs))
  samples.push(await measure('preset-and-tempo-changes-during-playback', durationMs, async () => {
    const bpm = page.getByRole('spinbutton', { name: 'Valor numérico BPM', exact: true })
    for (const [value, preset] of [['178', 'blues-shuffle'], ['184', 'maqsum'], ['192', 'funk-clasico'], ['200', 'slow-blues']]) {
      await bpm.fill(value)
      await selectPreset(preset)
    }
  }))
  if (longDurationMs > 0) samples.push(await measure('dense-two-track-playback-long', longDurationMs))
  await page.getByRole('button', { name: 'Detener reproducción', exact: true }).click()

  await mkdir(output, { recursive: true })
  const report = {
    methodology: 'Chrome DevTools Performance metrics, requestAnimationFrame intervals, PerformanceObserver long tasks, LiteRhythmVisualizer SVG mutation counts, JS heap when exposed, WAV Resource Timing, instrumented AudioBufferSource starts/ends, active voice peak, and AudioBuffer start lead. Browser viewport simulation is not a physical mobile device. Samples are collected after playback begins and include instrumentation overhead.',
    browser: { name: browser.browserType().name(), version: browser.version(), userAgent: await page.evaluate(() => navigator.userAgent), platform: process.platform, architecture: process.arch, viewport: { width, height }, isMobileContext: mobile },
    durationMs, samples, errors,
  }
  await writeFile(path.join(output, 'performance.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify({
    evidence: path.join(output, 'performance.json'),
    browser: report.browser,
    samples: samples.map(sample => ({
      label: sample.label,
      durationMs: sample.durationMs,
      fps: sample.fps,
      frameIntervalMs: sample.frameIntervalMs,
      intervalsOver32ms: sample.intervalsOver32ms,
      intervalsOver50ms: sample.intervalsOver50ms,
      longTasks: sample.longTasks,
      mainThreadDeltaMs: sample.mainThreadDeltaMs,
      heapBytes: sample.heapBytes,
      heapTrend: sample.heapTrend ? { ...sample.heapTrend, series: undefined } : null,
      svgMutations: sample.svgMutations,
      audio: {
        contexts: sample.audio.contexts,
        sources: sample.audio.sources.length,
        decodedBuffers: sample.audio.decodedBuffers.length,
        decodedPcmBytes: sample.audio.decodedPcmBytes,
        decodedBuffersTotal: sample.audio.decodedBuffersTotal,
        decodedPcmBytesTotal: sample.audio.decodedPcmBytesTotal,
        decodeMsTotal: Number(sample.audio.decodeMsTotal.toFixed(3)),
        activeVoicesPeak: sample.audio.activeVoicesPeak,
      },
      scheduler: sample.scheduler,
      audioRequests: sample.audioRequests.length,
      transferredAudioBytes: sample.audioRequests.reduce((total, entry) => total + (entry.transferBytes ?? 0), 0),
    })),
    errors,
  }, null, 2))
  if (errors.length) process.exitCode = 1
} finally {
  await context.close()
  await browser.close()
}
