import { chromium } from '@playwright/test'

const baseURL = process.env.RITMIA_URL ?? 'http://127.0.0.1:5173'
const viewport = { width: 1280, height: 900 }
const sampleDurationMs = 1200
const bpmValues = [40, 92, 174, 200]
const positionCounts = [4, 12, 32]
const pageErrors = []
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
})

try {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference' })
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.goto(`${baseURL}/?prototype=rhythm-a`)
  await page.getByRole('heading', { name: 'Un ciclo, muchas huellas' }).waitFor()

  const userAgent = await page.evaluate(() => navigator.userAgent)
  const samples = []

  for (const positions of positionCounts) {
    for (const bpm of bpmValues) {
      const bpmInput = page.getByRole('spinbutton', { name: 'Valor numérico del tempo en BPM' })
      await bpmInput.fill(String(bpm))
      await bpmInput.press('Tab')

      const positionInput = page.getByRole('spinbutton', { name: 'Cantidad de posiciones de A' })
      await positionInput.fill(String(positions))
      await positionInput.press('Tab')

      await page.getByRole('button', { name: 'Iniciar reproducción' }).click()
      await page.getByRole('button', { name: 'Detener reproducción' }).waitFor()
      await page.waitForTimeout(200)

      const sample = await page.evaluate(duration => new Promise(resolve => {
        const frameIntervals = []
        const longTasks = []
        let previousFrame
        let observer
        try {
          observer = new PerformanceObserver(entries => {
            for (const entry of entries.getEntries()) {
              longTasks.push(Math.round(entry.duration * 100) / 100)
            }
          })
          observer.observe({ type: 'longtask', buffered: false })
        } catch {
          observer = null
        }

        const start = performance.now()
        const collectFrame = timestamp => {
          if (previousFrame !== undefined) frameIntervals.push(timestamp - previousFrame)
          previousFrame = timestamp
          if (timestamp - start < duration) {
            requestAnimationFrame(collectFrame)
            return
          }

          setTimeout(() => {
            observer?.disconnect()
            const sorted = [...frameIntervals].sort((a, b) => a - b)
            const percentile = value => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * value))] ?? null
            resolve({
              durationMs: Math.round(timestamp - start),
              frames: frameIntervals.length,
              observedFps: Math.round(frameIntervals.length / ((timestamp - start) / 1000) * 10) / 10,
              intervalMs: {
                median: Math.round(percentile(0.5) * 100) / 100,
                p95: Math.round(percentile(0.95) * 100) / 100,
                max: Math.round((sorted.at(-1) ?? 0) * 100) / 100,
              },
              framesOver32ms: frameIntervals.filter(interval => interval > 32).length,
              framesOver50ms: frameIntervals.filter(interval => interval > 50).length,
              longTasks: {
                count: longTasks.length,
                totalDurationMs: Math.round(longTasks.reduce((sum, durationMs) => sum + durationMs, 0) * 100) / 100,
                maxDurationMs: Math.round(Math.max(0, ...longTasks) * 100) / 100,
                supported: Boolean(observer),
              },
            })
          }, 0)
        }

        requestAnimationFrame(collectFrame)
      }), sampleDurationMs)

      samples.push({ positions, bpm, ...sample })
      await page.getByRole('button', { name: 'Detener reproducción' }).click()
      await page.getByRole('button', { name: 'Iniciar reproducción' }).waitFor()
    }
  }

  console.log(JSON.stringify({
    methodology: {
      browser: `${browser.browserType().name()} ${browser.version()}`,
      userAgent,
      viewport,
      deviceScaleFactor: 1,
      zoom: '100% (default Chromium page scale)',
      reducedMotion: 'no-preference',
      scenario: 'active prototype; one 1.2s requestAnimationFrame sample after 200ms warm-up per case',
      matrix: { positions: positionCounts, bpm: bpmValues },
      longTaskSupport: 'PerformanceObserver longtask when available',
      interpretation: 'render-loop diagnostic only; not acoustic latency or audio/visual synchronization measurement',
    },
    samples,
    pageErrors,
  }, null, 2))
  if (pageErrors.length) process.exitCode = 1
} finally {
  await browser.close()
}
