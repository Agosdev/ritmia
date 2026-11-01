import { chromium } from '@playwright/test'
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { gzipSync } from 'node:zlib'

const output = process.env.VISUAL_EVIDENCE_DIR || path.join(os.tmpdir(), 'ritmia-09A-evidence')
const beforeURL = process.env.VISUAL_BASELINE_URL || 'http://127.0.0.1:4174/ritmia/'
const currentURL = process.env.VISUAL_CURRENT_URL || 'http://127.0.0.1:4173/ritmia/'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true })
const report = { browser: browser.version(), beforeURL, currentURL, cases: [], errors: [], videos: [], notes: [
  'Sequential headless Chrome measurements on this Mac, without CPU throttling; not a physical phone benchmark.',
  '90 display RAF intervals per case; physical renderers are intentionally capped at 30 Hz.',
  'Heap is the current JS heap, without forced GC. Optional module code remains cached after deactivation; GPU resources must be released.',
  'Videos record only canvas motion, with no audio track; acoustic quality has not been assessed by listening.',
] }
const quantile = (values, q) => values.length ? [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * q))] : null
const metrics = async cdp => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]))
try {
  for (const width of [375, 1280]) {
    for (const dense of [false, true]) {
      for (const variant of ['before', 'classic', 'bounce', 'orbit']) {
        const page = await browser.newPage({ viewport: { width, height: 900 } })
        page.on('pageerror', error => report.errors.push({ variant, width, error: error.message }))
        page.on('console', message => { if (message.type() === 'error') report.errors.push({ variant, width, console: message.text() }) })
        page.on('response', response => { if (response.status() >= 400) report.errors.push({ variant, width, url: response.url(), status: response.status() }) })
        const start = performance.now()
        await page.goto(variant === 'before' ? beforeURL : currentURL, { waitUntil: 'networkidle' })
        const readyMs = performance.now() - start
        const initialRequests = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => ({ url: entry.name, transferBytes: entry.transferSize, encodedBytes: entry.encodedBodySize })))
        await page.getByRole('button', { name: 'Nivel 3 — Dos pistas' }).click()
        if (dense) {
          await page.getByRole('spinbutton', { name: 'Numerador compás A', exact: true }).fill('32')
          await page.getByRole('spinbutton', { name: 'Numerador compás B', exact: true }).fill('32')
          await page.getByRole('spinbutton', { name: 'Valor numérico BPM' }).fill('200')
        }
        if (variant === 'bounce' || variant === 'orbit') {
          await page.getByLabel('Tipo de visualizador').selectOption(variant)
          await page.getByTestId(`physical-${variant}`).waitFor()
          await page.waitForFunction(() => document.querySelector('canvas')?.__ritmiaVisual?.frames > 0)
        }
        await page.getByRole('button', { name: variant === 'before' ? 'Iniciar reproducción' : 'Reproducir' }).click()
        await page.waitForTimeout(400)
        await page.evaluate(() => scrollTo(0, 0))
        const cdp = await page.context().newCDPSession(page)
        await cdp.send('Performance.enable')
        const initial = await metrics(cdp)
        const cadence = await page.evaluate(() => new Promise(resolve => {
          const frames = [], draws = []; let previous, lastDraw, lastCount
          const tick = time => {
            if (previous !== undefined) frames.push(time - previous)
            previous = time
            const visual = document.querySelector('canvas')?.__ritmiaVisual
            if (visual && visual.frames !== lastCount) {
              if (lastDraw !== undefined) draws.push(time - lastDraw)
              lastDraw = time; lastCount = visual.frames
            }
            if (frames.length < 90) requestAnimationFrame(tick)
            else resolve({ frames, draws, resources: visual?.resources, drawMs: visual?.renderMs })
          }
          requestAnimationFrame(tick)
        }))
        const end = await metrics(cdp)
        const resources = await page.evaluate(() => performance.getEntriesByType('resource').filter(entry => /(?:three|OrbitVisualizer|BounceVisualizer)/i.test(entry.name)).map(entry => ({ url: entry.name, encodedBytes: entry.encodedBodySize })))
        const item = { variant, width, dense, readyMs, fcpMs: await page.evaluate(() => performance.getEntriesByName('first-contentful-paint')[0]?.startTime),
          rafMedianMs: quantile(cadence.frames, .5), rafP95Ms: quantile(cadence.frames, .95),
          drawP95Ms: quantile(cadence.draws, .95), latestDrawCostMs: cadence.drawMs,
          measurementMs: (end.Timestamp - initial.Timestamp) * 1000,
          scriptMsPerSecond: 1000 * (end.ScriptDuration - initial.ScriptDuration) / (end.Timestamp - initial.Timestamp),
          taskMsPerSecond: 1000 * (end.TaskDuration - initial.TaskDuration) / (end.Timestamp - initial.Timestamp),
          scriptMs: (end.ScriptDuration - initial.ScriptDuration) * 1000,
          taskMs: (end.TaskDuration - initial.TaskDuration) * 1000,
          heapMB: end.JSHeapUsedSize / 1024 / 1024, nodes: end.Nodes,
          gpuResources: cadence.resources, initialThreeRequests: initialRequests.filter(entry => /three(?:[./_-]|\?)/i.test(entry.url)), optionalResources: resources,
        }
        report.cases.push(item)
        if (!dense) {
          await page.screenshot({ path: path.join(output, `${variant}-${width}.png`), fullPage: true })
          await page.screenshot({ path: path.join(output, `${variant}-${width}-viewport.png`) })
          if (variant === 'bounce' || variant === 'orbit') await page.locator('canvas').screenshot({ path: path.join(output, `${variant}-${width}-canvas.png`) })
        }
        if (!dense && width === 1280 && (variant === 'bounce' || variant === 'orbit')) {
          const video = await page.locator('canvas').evaluate(canvas => new Promise(resolve => {
            if (!canvas.captureStream || typeof MediaRecorder === 'undefined') return resolve(null)
            const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type))
            const stream = canvas.captureStream(30)
            const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1500000 })
            const chunks = []
            recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
            recorder.onstop = async () => {
              stream.getTracks().forEach(track => track.stop())
              resolve(Array.from(new Uint8Array(await new Blob(chunks, { type: mimeType }).arrayBuffer())))
            }
            recorder.start(); setTimeout(() => recorder.stop(), 4000)
          }))
          if (video) {
            const file = `${variant}-motion.webm`
            await writeFile(path.join(output, file), Buffer.from(video)); report.videos.push(file)
          }
        }
        await page.close()
        console.log(JSON.stringify(item))
      }
    }
  }
  for (const dir of [process.env.VISUAL_BASELINE_ASSETS || '/private/tmp/ritmia-09A-baseline-dist/assets', 'dist/assets']) {
    const bundles = []
    for (const file of await readdir(dir)) {
      if (!file.endsWith('.js')) continue
      const data = await readFile(path.join(dir, file))
      bundles.push({ file, bytes: data.length, gzipBytes: gzipSync(data).length })
    }
    report[dir.startsWith('/private/tmp') ? 'baselineBundles' : 'currentBundles'] = bundles
  }
  const images = (await readdir(output)).filter(file => /^(before|classic|bounce|orbit)-.*\.png$/.test(file)).sort()
  await writeFile(path.join(output, 'index.html'), `<!doctype html><html lang="es"><meta charset="utf-8"><title>Ritmia 09A · revisión</title><style>body{font:15px system-ui;background:#e9edf0;color:#2d3945;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}figure{margin:0;background:white;padding:12px;border-radius:16px}img,video{max-width:100%;height:auto}a{color:#2d3945}</style><h1>Visualizadores 09A</h1><p>Capturas reales a 375 y 1280 px. Videos de movimiento sin audio.</p>${report.videos.map(file => `<figure><figcaption>${file}</figcaption><video controls loop src="${file}"></video></figure>`).join('')}<main>${images.map(file => `<figure><figcaption><a href="${file}">${file}</a></figcaption><img loading="lazy" src="${file}" alt="${file}"></figure>`).join('')}</main></html>`)
} finally {
  await writeFile(path.join(output, 'performance.json'), JSON.stringify(report, null, 2) + '\n')
  await browser.close()
  console.log('Evidence:', output)
}
