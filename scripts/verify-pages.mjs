import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const url = process.env.PAGES_PREVIEW_URL || 'http://127.0.0.1:4173/ritmia/'
const output = path.join(os.tmpdir(), 'ritmia-pages-verification')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true })
const report = { url, errors: [], badResponses: [], failedRequests: [], widths: [], productionRoutes: [] }
try {
  for (const width of [375, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const samples = new Set()
    page.on('pageerror', error => report.errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') report.errors.push({ text: message.text(), location: message.location() }) })
    page.on('requestfailed', request => {
      if (request.failure()?.errorText !== 'net::ERR_ABORTED') report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText })
    })
    page.on('response', response => {
      if (response.status() >= 400) report.badResponses.push({ url: response.url(), status: response.status() })
      if (response.url().includes('/audio/acoustic/') && response.ok()) samples.add(response.url())
    })
    await page.addInitScript(() => {
      window.__decodedSamples = 0
      const original = AudioContext.prototype.decodeAudioData
      AudioContext.prototype.decodeAudioData = function (...args) {
        const result = original.apply(this, args)
        result.then(() => { window.__decodedSamples++ })
        return result
      }
    })
    await page.goto(url, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Ritmia Lite' })).toBeVisible()
    await page.getByRole('spinbutton', { name: 'Valor numérico BPM' }).fill('120')
    await expect(page.getByRole('spinbutton', { name: 'Valor numérico BPM' })).toHaveValue('120')
    const first = page.getByRole('group', { name: 'Secuenciador pista A' }).getByRole('button').first()
    for (const accent of ['silencio', 'suave', 'fuerte']) {
      await first.click()
      await expect(first).toHaveAccessibleName(`Pulso 1, acento: ${accent}`)
    }
    for (const level of [1, 2, 3]) {
      const button = page.getByRole('button', { name: new RegExp(`^Nivel ${level} —`) })
      await button.click()
      await expect(button).toHaveAttribute('aria-pressed', 'true')
      if (level >= 2) await expect(page.getByLabel('Agrupación métrica pista A')).toBeVisible()
      if (level === 3) await expect(page.getByRole('group', { name: 'Secuenciador pista B' })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.evaluate(() => scrollTo(0, 0))
      await page.screenshot({ path: path.join(output, `pages-${width}-level-${level}.png`), fullPage: true })
    }
    await page.getByText('Sonido y preferencias', { exact: true }).click()
    await expect(page.getByLabel('Kit de sonido')).toHaveValue('acoustic')
    await page.getByRole('button', { name: 'Iniciar reproducción' }).click()
    await expect.poll(() => samples.size).toBe(4)
    await expect.poll(() => page.evaluate(() => window.__decodedSamples)).toBe(4)
    expect([...samples].every(sample => new URL(sample).pathname.startsWith('/ritmia/audio/acoustic/'))).toBe(true)
    const phases = ['A', 'B'].map(track => page.getByTestId(`lite-track-${track}-progress`))
    for (const phase of phases) await expect.poll(() => phase.getAttribute('stroke-dasharray')).not.toMatch(/^0 /)
    await page.getByRole('button', { name: 'Pausar reproducción' }).click()
    for (const phase of phases) {
      const frozen = await phase.getAttribute('stroke-dasharray')
      await page.waitForTimeout(120)
      await expect(phase).toHaveAttribute('stroke-dasharray', frozen)
    }
    const frozen = await phases[0].getAttribute('stroke-dasharray')
    await page.getByRole('button', { name: 'Reanudar reproducción' }).click()
    await expect.poll(() => phases[0].getAttribute('stroke-dasharray')).not.toBe(frozen)
    await page.getByRole('button', { name: 'Reiniciar ciclo' }).click()
    for (const phase of phases) await expect(phase).toHaveAttribute('stroke-dasharray', /^0 /)
    report.widths.push({ width, levels: [1, 2, 3], decodedAcousticSamples: 4, sampleURLs: [...samples], transport: 'play/pause/resume/reset verified' })
    if (width === 1280) {
      for (const query of ['?interface=art', '?prototype=rhythm-art', '?prototype=lab', '?prototype=rhythm-a', '?dev=1&interface=art']) {
        await page.goto(url + query, { waitUntil: 'networkidle' })
        await expect(page.getByRole('heading', { name: 'Ritmia Lite' })).toBeVisible()
        await expect(page.getByRole('group', { name: 'Presentación visual' })).toHaveCount(0)
        await expect(page.locator('.artwork-plane')).toHaveCount(0)
        report.productionRoutes.push({ query, interface: 'Lite' })
      }
      await page.evaluate(() => {
        history.pushState({}, '', '?interface=art')
        dispatchEvent(new PopStateEvent('popstate'))
      })
      await expect(page.getByRole('heading', { name: 'Ritmia Lite' })).toBeVisible()
    }
    await page.close()
  }
  expect(report.errors).toEqual([])
  expect(report.badResponses).toEqual([])
  expect(report.failedRequests).toEqual([])
  report.passed = true
} finally {
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  await browser.close()
  console.log(JSON.stringify({ output, ...report }, null, 2))
}
