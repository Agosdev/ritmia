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
  const stats = window.__ritmiaAudioStats = { sources: [], contexts: 0, decodedBuffers: [] }
  if (!Native) return
  const Instrumented = class extends Native {
    constructor(...args) { super(...args); stats.contexts++ }
    decodeAudioData(...args) {
      return super.decodeAudioData(...args).then(buffer => {
        stats.decodedBuffers.push({ sampleRate: buffer.sampleRate, channels: buffer.numberOfChannels, frames: buffer.length, pcmBytes: buffer.length * buffer.numberOfChannels * 4 })
        return buffer
      })
    }
    createBufferSource() {
      const source = super.createBufferSource()
      const record = { start: null, requestedAt: null, ended: false }
      stats.sources.push(record)
      const start = source.start.bind(source)
      source.start = (...args) => { record.start = args[0] ?? this.currentTime; record.requestedAt = this.currentTime; return start(...args) }
      source.addEventListener('ended', () => { record.ended = true }, { once: true })
      return source
    }
  }
  window.AudioContext = Instrumented
  if (window.webkitAudioContext) window.webkitAudioContext = Instrumented
})

async function measure(label, ms) {
  const before = await client.send('Performance.getMetrics')
  const result = await page.evaluate(duration => new Promise(resolve => {
    const frames = [], longTasks = [], mutations = { attributes: 0, childList: 0, characterData: 0 }
    let previous, start = performance.now()
    const svg = document.querySelector('svg[aria-labelledby="rhythm-art-title rhythm-art-description"]')
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
        observer?.disconnect(); mutation?.disconnect()
        const sorted = [...frames].sort((a, b) => a - b)
        const pct = p => sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)] ?? null
        resolve({ durationMs: Math.round(timestamp - start), frames: frames.length,
          fps: Number((frames.length / ((timestamp - start) / 1000)).toFixed(1)),
          frameIntervalMs: { p50: pct(.5), p95: pct(.95), p99: pct(.99), max: Math.max(0, ...frames) },
          intervalsOver32ms: frames.filter(value => value > 32).length,
          intervalsOver50ms: frames.filter(value => value > 50).length,
          longTasks: { count: longTasks.length, totalMs: Number(longTasks.reduce((a,b)=>a+b,0).toFixed(2)), maxMs: Math.max(0,...longTasks), supported: Boolean(observer) },
          svgMutations: mutations, heapBytes: performance.memory?.usedJSHeapSize ?? null,
          audio: window.__ritmiaAudioStats,
          audioRequests: performance.getEntriesByType('resource').filter(entry => /\/audio\/.*\.wav/.test(entry.name)).map(entry => ({ name: entry.name.split('/').slice(-2).join('/'), transferBytes: entry.transferSize, decodedBodyBytes: entry.decodedBodySize })),
        })
      }, 0)
    }
    requestAnimationFrame(frame)
  }), ms)
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
  await selectPreset('maqsum')
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
  await page.getByRole('button', { name: 'Detener reproducción', exact: true }).waitFor()
  samples.push(await measure('simple-maqsum-level-1', durationMs))
  await page.getByRole('button', { name: 'Detener reproducción', exact: true }).click()

  await selectPreset('funk-clasico')
  await page.getByRole('spinbutton', { name: 'Valor numérico BPM', exact: true }).fill('200')
  await page.getByRole('button', { name: 'Nivel 2 — Dos ritmos', exact: true }).click()
  await page.getByRole('button', { name: /^Polimetría —/ }).click()
  await page.getByLabel('Numerador compás B', { exact: true }).fill('32')
  await page.getByLabel('Denominador compás B', { exact: true }).selectOption('16')
  const cellsB = page.getByRole('group', { name: 'Secuenciador pista B', exact: true }).getByRole('button')
  for (const cell of await cellsB.all()) if (await cell.getAttribute('data-accent') === '0') await cell.click()
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
  await page.getByRole('button', { name: 'Detener reproducción', exact: true }).waitFor()
  samples.push(await measure('dense-funk-plus-32-step-track-B', durationMs))
  await page.getByRole('button', { name: 'Detener reproducción', exact: true }).click()

  await mkdir(output, { recursive: true })
  const report = {
    methodology: 'Chrome DevTools Performance metrics, requestAnimationFrame intervals, PerformanceObserver long tasks, SVG mutation counts, JS heap when exposed, WAV Resource Timing, and instrumented AudioBufferSource starts/ends. Browser viewport simulation is not a physical mobile device. Samples are collected after playback begins and include this instrumentation overhead.',
    browser: { name: browser.browserType().name(), version: browser.version(), userAgent: await page.evaluate(() => navigator.userAgent), platform: process.platform, architecture: process.arch, viewport: { width, height }, isMobileContext: mobile },
    durationMs, samples, errors,
  }
  await writeFile(path.join(output, 'performance.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
  if (errors.length) process.exitCode = 1
} finally {
  await context.close()
  await browser.close()
}
