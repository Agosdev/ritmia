import { chromium } from '@playwright/test'

const baseURL = process.env.RITMIA_URL ?? 'http://127.0.0.1:5173'
const viewport = { width: 1280, height: 900 }
const sampleDurationMs = 1500
const cases = [
  { positions: 4, bpm: 92 },
  { positions: 7, bpm: 92 },
  { positions: 12, bpm: 174 },
  { positions: 32, bpm: 200 },
]
const modes = ['active', 'idle', 'reduced-motion']
const pageErrors = []
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
})

async function getMetrics(client) {
  const { metrics } = await client.send('Performance.getMetrics')
  return Object.fromEntries(metrics.map(({ name, value }) => [name, value]))
}

async function traceFramePipeline(client, page, mode) {
  const completed = new Promise(resolve => client.once('Tracing.tracingComplete', resolve))
  await client.send('Tracing.start', {
    categories: [
      'devtools.timeline',
      'disabled-by-default-devtools.timeline',
      'disabled-by-default-devtools.timeline.frame',
    ].join(','),
    transferMode: 'ReturnAsStream',
  })
  await page.waitForTimeout(sampleDurationMs)
  await client.send('Tracing.end')
  const { stream } = await completed
  let trace = ''
  let eof = false
  while (!eof) {
    const chunk = await client.send('IO.read', { handle: stream })
    trace += chunk.data
    eof = chunk.eof
  }
  await client.send('IO.close', { handle: stream })

  const groups = {
    javascript: new Set(['FunctionCall', 'EvaluateScript', 'RunMicrotasks']),
    layout: new Set(['UpdateLayoutTree', 'Layout']),
    paint: new Set(['Paint']),
    compositing: new Set(['Layerize', 'Commit', 'CompositeLayers', 'RasterTask', 'DrawFrame']),
  }
  const durations = Object.fromEntries(Object.keys(groups).map(key => [key, []]))
  const events = JSON.parse(trace).traceEvents ?? []

  for (const event of events) {
    if (event.ph !== 'X' || typeof event.dur !== 'number') continue
    for (const [group, names] of Object.entries(groups)) {
      if (names.has(event.name)) durations[group].push(event.dur / 1000)
    }
  }

  return {
    mode,
    methodology: 'CDP timeline event durations; events overlap and totals are not additive',
    groups: Object.fromEntries(Object.entries(durations).map(([group, values]) => [
      group,
      {
        eventCount: values.length,
        summedEventMs: Math.round(values.reduce((sum, value) => sum + value, 0) * 100) / 100,
        p95EventMs: Math.round((values.sort((a, b) => a - b)[Math.min(values.length - 1, Math.ceil(values.length * 0.95) - 1)] ?? 0) * 100) / 100,
      },
    ])),
  }
}

try {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference' })
  const client = await page.context().newCDPSession(page)
  await client.send('Performance.enable')
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.goto(`${baseURL}/?prototype=rhythm-a`)
  await page.getByRole('heading', { name: 'Un ciclo, muchas huellas' }).waitFor()

  const userAgent = await page.evaluate(() => navigator.userAgent)
  const samples = []
  const traces = []

  for (const { positions, bpm } of cases) {
    const bpmInput = page.getByRole('spinbutton', { name: 'Valor numérico del tempo en BPM' })
    await bpmInput.fill(String(bpm))
    await bpmInput.press('Tab')

    const positionInput = page.getByRole('spinbutton', { name: 'Cantidad de posiciones de A' })
    await positionInput.fill(String(positions))
    await positionInput.press('Tab')
    await page.getByRole('heading', { name: `Ciclo rítmico · A ${positions}/8` }).waitFor()

    for (const mode of modes) {
      await page.emulateMedia({
        reducedMotion: mode === 'reduced-motion' ? 'reduce' : 'no-preference',
      })

      const startButton = page.getByRole('button', { name: 'Iniciar reproducción' })
      if (mode === 'idle') {
        if (await page.getByRole('button', { name: 'Reiniciar ciclo' }).isEnabled()) {
          await page.getByRole('button', { name: 'Reiniciar ciclo' }).click()
        }
      } else if (await startButton.count()) {
        await startButton.click()
      }

      const playing = mode !== 'idle'
      if (playing) {
        await page.getByRole('button', { name: 'Pausar reproducción' }).waitFor()
      } else {
        await page.getByRole('button', { name: 'Iniciar reproducción' }).waitFor()
      }

      const before = await getMetrics(client)
      const sample = await page.evaluate(duration => new Promise(resolve => {
        const frameIntervals = []
        const longTasks = []
        const svgMutations = { attributes: 0, childList: 0, characterData: 0 }
        let previousFrame
        let observer
        let mutationObserver
        const svg = document.querySelector('[aria-labelledby="rhythm-art-title rhythm-art-description"]')

        try {
          observer = new PerformanceObserver(entries => {
            for (const entry of entries.getEntries()) longTasks.push(entry.duration)
          })
          observer.observe({ type: 'longtask', buffered: false })
        } catch {
          observer = null
        }

        mutationObserver = new MutationObserver(records => {
          for (const record of records) svgMutations[record.type] += 1
        })
        mutationObserver.observe(svg, {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true,
        })

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
            mutationObserver.disconnect()
            const sortedIntervals = [...frameIntervals].sort((a, b) => a - b)
            const framePercentile = fraction =>
              sortedIntervals[Math.min(sortedIntervals.length - 1, Math.ceil(sortedIntervals.length * fraction) - 1)] ?? null
            resolve({
              durationMs: Math.round(timestamp - start),
              frames: frameIntervals.length,
              observedFps: Math.round(frameIntervals.length / ((timestamp - start) / 1000) * 10) / 10,
              intervalMs: {
                p50: Math.round((framePercentile(0.5) ?? 0) * 100) / 100,
                p95: Math.round((framePercentile(0.95) ?? 0) * 100) / 100,
                p99: Math.round((framePercentile(0.99) ?? 0) * 100) / 100,
                max: Math.round(Math.max(0, ...frameIntervals) * 100) / 100,
              },
              framesOver32ms: frameIntervals.filter(interval => interval > 32).length,
              framesOver50ms: frameIntervals.filter(interval => interval > 50).length,
              longTasks: {
                count: longTasks.length,
                totalDurationMs: Math.round(longTasks.reduce((sum, value) => sum + value, 0) * 100) / 100,
                maxDurationMs: Math.round(Math.max(0, ...longTasks) * 100) / 100,
                supported: Boolean(observer),
              },
              svgMutations,
            })
          }, 0)
        }

        requestAnimationFrame(collectFrame)
      }), sampleDurationMs)
      const after = await getMetrics(client)

      const metricDelta = {}
      for (const key of ['TaskDuration', 'ScriptDuration', 'TaskOtherDuration', 'LayoutDuration', 'RecalcStyleDuration']) {
        if (before[key] !== undefined && after[key] !== undefined) {
          metricDelta[`${key}Ms`] = Math.round((after[key] - before[key]) * 1000) / 1000
        }
      }

      samples.push({ positions, bpm, mode, ...sample, cdp: metricDelta })
    }

    if (await page.getByRole('button', { name: 'Reiniciar ciclo' }).isEnabled()) {
      await page.getByRole('button', { name: 'Reiniciar ciclo' }).click()
    }
  }

  const bpmInput = page.getByRole('spinbutton', { name: 'Valor numérico del tempo en BPM' })
  await bpmInput.fill('200')
  await bpmInput.press('Tab')
  const positionInput = page.getByRole('spinbutton', { name: 'Cantidad de posiciones de A' })
  await positionInput.fill('32')
  await positionInput.press('Tab')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.getByRole('button', { name: 'Iniciar reproducción' }).click()
  await page.getByRole('button', { name: 'Pausar reproducción' }).waitFor()
  traces.push(await traceFramePipeline(client, page, 'active'))
  await page.getByRole('button', { name: 'Reiniciar ciclo' }).click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Iniciar reproducción' }).click()
  await page.getByRole('button', { name: 'Pausar reproducción' }).waitFor()
  traces.push(await traceFramePipeline(client, page, 'reduced-motion'))
  await page.getByRole('button', { name: 'Reiniciar ciclo' }).click()

  console.log(JSON.stringify({
    methodology: {
      browser: `${browser.browserType().name()} ${browser.version()}`,
      userAgent,
      platform: process.platform,
      architecture: process.arch,
      viewport,
      deviceScaleFactor: 1,
      zoom: '100% (default Chromium page scale)',
      modes: {
        active: 'audio transport running; no reduced-motion media preference',
        idle: 'transport stopped; no reduced-motion media preference',
        'reduced-motion': 'transport running; emulateMedia(reducedMotion: reduce)',
      },
      sampleDurationMs,
      matrix: cases,
      metrics: 'requestAnimationFrame intervals, PerformanceObserver long tasks, SVG MutationObserver records, CDP Performance metrics deltas',
      trace: 'separate 32-position/200-BPM active and reduced-motion CDP timeline samples; instrumentation changes timing. React is included in JavaScript events. Trace event durations overlap. Frame cadence is not acoustic latency or an audio/visual synchronization measurement.',
    },
    samples,
    traces,
    pageErrors,
  }, null, 2))
  if (pageErrors.length) process.exitCode = 1
} finally {
  await browser.close()
}
