import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
const output = process.env.AUDIO_EVIDENCE_DIR || '/private/tmp/ritmia-10-evidence'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true })
const page = await browser.newPage()
const report = { url: process.env.AUDIO_AUDIT_URL || 'http://127.0.0.1:4173/ritmia/', errors: [], notes: 'Actual AudioContext and decoded WAVs. Timestamp instrumentation, not a listening assessment; no physical-device latency measurement.' }
page.on('pageerror', e => report.errors.push(e.message))
await page.addInitScript(() => {
  const Native = window.AudioContext
  window.__audioAudit = { starts: [], oscillators: 0, decoded: 0 }
  const records = window.__audioAudit
  window.AudioContext = class extends Native {
    constructor(...args) { super(...args); window.__auditContext = this; this.ids = new WeakMap(); this.nextId = 0 }
    decodeAudioData(...args) { return super.decodeAudioData(...args).then(buffer => { this.ids.set(buffer, ++this.nextId); records.decoded++; return buffer }) }
    createGain() {
      const node = super.createGain(), set = node.gain.setValueAtTime.bind(node.gain)
      node.gain.setValueAtTime = (...args) => { node.__targetGain = args[0]; return set(...args) }
      return node
    }
    createOscillator() { records.oscillators++; return super.createOscillator() }
    createBufferSource() {
      const source = super.createBufferSource()
      const start = source.start.bind(source), stop = source.stop.bind(source)
      let record
      const connect = source.connect.bind(source)
      source.connect = (...args) => { source.__gainNode = args[0]; return connect(...args) }
      source.start = (...args) => { record = { time: args[0], requestedAt: this.currentTime, buffer: this.ids.get(source.buffer), duration: source.buffer?.duration, gain: source.__gainNode?.__targetGain, stop: null }; records.starts.push(record); return start(...args) }
      source.stop = (...args) => { if (record) record.stop = args[0]; return stop(...args) }
      return source
    }
  }
})
try {
  await page.goto(report.url, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Nivel 2 — Dos ritmos' }).click()
  for (const track of ['A', 'B']) {
    await page.getByLabel(`Numerador compás ${track}`, { exact: true }).fill('4')
    await page.getByLabel(`Denominador compás ${track}`, { exact: true }).selectOption('4')
    for (const key of await page.getByRole('group', { name: `Secuenciador pista ${track}` }).getByRole('button').all()) {
      while (await key.getAttribute('data-accent') !== '2') await key.click()
    }
  }
  await page.getByRole('spinbutton', { name: 'Valor numérico BPM' }).fill('120')
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
  await page.waitForTimeout(8000)
  await page.getByRole('button', { name: 'Detener reproducción' }).click()
  const frozen = await page.evaluate(() => ({ time: __auditContext.currentTime, state: __auditContext.state, trace: structuredClone(__audioAudit) }))
  await page.waitForTimeout(200)
  expect(await page.evaluate(() => __auditContext.currentTime)).toBe(frozen.time)
  expect(frozen.state).toBe('suspended')
  expect(frozen.trace.decoded).toBe(4)
  expect(frozen.trace.oscillators).toBe(0)
  const groups = Object.groupBy(frozen.trace.starts, item => item.buffer)
  const metrics = Object.entries(groups).map(([buffer, notes]) => {
    const due = notes.filter(n => n.time <= frozen.time)
    const intervals = due.slice(1).map((n, i) => n.time - due[i].time)
    const drift = Math.max(0, ...due.map((n, i) => Math.abs(n.time - due[0].time - i * .5)))
    expect(due.length).toBeGreaterThan(12)
    intervals.forEach(interval => expect(interval).toBeCloseTo(.5, 10))
    expect(new Set(notes.map(n => n.time)).size).toBe(notes.length)
    return { buffer, notes: due.length, expectedStep: .5, maxDriftSeconds: drift, minimumLeadSeconds: Math.min(...notes.map(n => n.time - n.requestedAt)) }
  })
  expect(metrics).toHaveLength(2)
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
  await page.waitForTimeout(350)
  await page.getByRole('button', { name: 'Reiniciar ciclo' }).click()
  await expect(page.getByRole('button', { name: 'Detener reproducción' })).toBeVisible()
  await page.waitForTimeout(600)
  const aBuffer = frozen.trace.starts[0].buffer
  await page.getByRole('button', { name: /Morph —/ }).click()
  await page.getByLabel('Porcentaje de morphing').focus()
  await page.getByLabel('Porcentaje de morphing').press('End')
  const observeGain = async () => {
    await page.waitForTimeout(100)
    const since = await page.evaluate(() => __auditContext.currentTime)
    await page.waitForTimeout(650)
    return page.evaluate(({ since, buffer }) => __audioAudit.starts.filter(n => n.requestedAt >= since && n.buffer === buffer).map(n => n.gain), { since, buffer: aBuffer })
  }
  const muted = await observeGain()
  expect(muted.length).toBeGreaterThan(0); expect(muted.every(gain => gain === 0)).toBe(true)
  await page.getByRole('button', { name: 'Nivel 1 — Ritmo' }).click()
  const restored = await observeGain()
  expect(restored.length).toBeGreaterThan(0); expect(restored.every(gain => gain === 1)).toBe(true)
  report.morphLevels = { level2Gains: muted, level1Gains: restored }
  await page.getByRole('button', { name: 'Detener reproducción' }).click()
  const stopped = await page.evaluate(() => {
    const now = __auditContext.currentTime
    return { now, state: __auditContext.state, decoded: __audioAudit.decoded, voicesAlive: __audioAudit.starts.filter(n => n.time <= now && n.stop > now).length, trace: __audioAudit.starts }
  })
  expect(stopped.voicesAlive).toBe(0)
  expect(stopped.decoded).toBe(4)
  report.regular120Bpm = metrics
  report.pause = { phaseFrozen: true, time: frozen.time }
  report.final = stopped
  report.passed = report.errors.length === 0
} finally {
  await writeFile(`${output}/real-audio.json`, JSON.stringify(report, null, 2))
  await browser.close()
}
console.log(JSON.stringify(report, null, 2))
