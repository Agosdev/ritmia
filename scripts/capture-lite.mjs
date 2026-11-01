import { chromium } from '@playwright/test'
import { mkdir, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'

// Run against the current Vite server. Writes evidence outside the repository by default.
const output = process.env.RITMIA_EVIDENCE_DIR || '/private/tmp/ritmia-08E2-evidence'
const baseURL = process.env.RITMIA_EVIDENCE_URL || 'http://127.0.0.1:5173'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true })
const evidence = { baseURL, browser: browser.version(), captures: [], performance: [], errors: [] }
async function capture(page, name, options = {}) {
  await page.screenshot({ path: path.join(output, name), animations: 'allow', ...options })
  evidence.captures.push(name)
}
try {
  for (const width of [375, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    page.on('pageerror', error => evidence.errors.push(error.message))
    await page.goto(baseURL)
    await page.getByRole('heading', { name: 'Ritmia Lite' }).waitFor()
    const nav = page.getByRole('navigation', { name: 'Niveles musicales' })
    for (const level of [1, 2, 3]) {
      await page.getByRole('button', { name: new RegExp(`^Nivel ${level} —`) }).click()
      await page.evaluate(() => scrollTo(0, 0))
      await capture(page, `lite-${width}-level-${level}.png`, { fullPage: true })
      await capture(page, `lite-${width}-level-${level}-viewport.png`)
    }
    await page.getByRole('button', { name: /^Nivel 1 —/ }).click()
    const grid = page.getByRole('group', { name: 'Secuenciador pista A' })
    await grid.scrollIntoViewIfNeeded()
    await grid.screenshot({ path: path.join(output, `lite-${width}-sequencer.png`) })
    evidence.captures.push(`lite-${width}-sequencer.png`)
    await page.getByRole('group', { name: 'Controles de reproducción' }).screenshot({ path: path.join(output, `lite-${width}-transport.png`) })
    evidence.captures.push(`lite-${width}-transport.png`)
    await nav.scrollIntoViewIfNeeded()
    const navBox = await nav.boundingBox()
    const clip = { x: 0, y: navBox.y, width, height: navBox.height + 10 }
    await capture(page, `lite-${width}-selected-and-elevated.png`, { clip })
    const button = page.getByRole('button', { name: /^Nivel 2 —/ })
    const box = await button.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(90)
    await capture(page, `lite-${width}-pressed.png`, { clip })
    await page.mouse.up()
    await page.waitForTimeout(220)
    await capture(page, `lite-${width}-selected-after-press.png`, { clip })
    await page.keyboard.press('Tab')
    await capture(page, `lite-${width}-focus.png`, { clip })
    // A physical pulse sequence: elevated → held down → release → settled.
    await page.getByRole('button', { name: /^Nivel 1 —/ }).click()
    await grid.scrollIntoViewIfNeeded()
    const key = grid.getByRole('button').first()
    const keyBox = await key.boundingBox()
    const keyClip = { x: Math.max(0, keyBox.x - 7), y: keyBox.y - 7, width: Math.min(width - keyBox.x, keyBox.width + 14), height: keyBox.height + 14 }
    await page.mouse.move(1, 1)
    await page.waitForTimeout(220)
    await capture(page, `lite-${width}-pulse-01-raised.png`, { clip: keyClip })
    await page.mouse.move(keyBox.x + keyBox.width / 2, keyBox.y + keyBox.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(90)
    await capture(page, `lite-${width}-pulse-02-pressed.png`, { clip: keyClip })
    await page.mouse.up()
    await page.waitForTimeout(60)
    await capture(page, `lite-${width}-pulse-03-release.png`, { clip: keyClip })
    await page.waitForTimeout(220)
    await capture(page, `lite-${width}-pulse-04-settled.png`, { clip: keyClip })
    await page.getByRole('button', { name: /^Nivel 3 —/ }).click()
    await page.getByRole('button', { name: 'Iniciar reproducción' }).click()
    await page.waitForTimeout(300)
    await page.evaluate(() => scrollTo(0, 0))
    await capture(page, `lite-${width}-playing.png`)
    const deltas = await page.evaluate(() => new Promise(resolve => {
      const samples = []; let previous
      const tick = time => {
        if (previous !== undefined) samples.push(time - previous)
        previous = time
        if (samples.length < 90) requestAnimationFrame(tick)
        else resolve(samples.sort((a, b) => a - b))
      }
      requestAnimationFrame(tick)
    }))
    evidence.performance.push({ width, sampleFrames: deltas.length, medianFrameMs: deltas[45], p95FrameMs: deltas[85], note: 'Local headless Chrome, two-track playback; not an audio latency benchmark.' })
    await page.getByRole('button', { name: 'Pausar reproducción' }).click()
    await capture(page, `lite-${width}-paused.png`)
    await page.close()
  }
  const images = (await readdir(output)).filter(name => /^(before-lite-|lite-).*\.png$/.test(name)).sort()
  await writeFile(path.join(output, 'index.html'), `<!doctype html><html lang="es"><meta charset="utf-8"><title>Ritmia 08E.2 — Revisión</title><style>body{font:15px system-ui;background:#edf0f3;color:#263542;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}figure{margin:0;background:white;padding:12px;border-radius:12px}img{max-width:100%;height:auto}figcaption{margin-bottom:12px;overflow-wrap:anywhere}a{color:#293f65}</style><h1>Ritmia Lite · 08E.2</h1><p>Antes y después; niveles 1–3, transporte, foco y secuencia de pulsación. Capturas reales de Chrome local.</p><main>${images.map(name => `<figure><figcaption><a href="${name}">${name}</a></figcaption><img loading="lazy" src="${name}" alt="${name}"></figure>`).join('')}</main></html>`)
  await writeFile(path.join(output, 'capture-report.json'), JSON.stringify(evidence, null, 2) + '\n')
  console.log(JSON.stringify({ output, ...evidence }, null, 2))
} finally {
  await browser.close()
}
