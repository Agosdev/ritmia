import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
const output = process.env.PRODUCT_EVIDENCE_DIR || path.join(tmpdir(), 'ritmia-11-evidence')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), headless: true })
const report = { screenshots: [], errors: [], badResponses: [] }
try {
  for (const width of [375, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    page.on('pageerror', e => report.errors.push(e.message))
    page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()) })
    page.on('response', r => { if (r.status() >= 400) report.badResponses.push(r.url()) })
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
    for (const level of [1,2]) {
      await page.getByRole('button', { name: new RegExp(`^Nivel ${level} —`) }).click()
      const file = `level-${level}-${width}.png`
      await page.screenshot({ path: `${output}/${file}`, fullPage: true }); report.screenshots.push(file)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.close()
  }
  expect(report.errors).toEqual([]); expect(report.badResponses).toEqual([])
  report.passed = true
} finally {
  await browser.close()
  await writeFile(`${output}/screenshots.json`, JSON.stringify(report, null, 2))
  await writeFile(`${output}/index.html`, `<!doctype html><html lang="es"><meta charset="utf-8"><title>Ritmia · cierre</title><style>body{font:16px system-ui;background:#e9edf0;color:#2d3945;padding:1rem}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem}img{width:100%}figure{margin:0;padding:1rem;background:white;border-radius:16px}</style><h1>Ritmia — Tarea 11</h1><main>${report.screenshots.map(file => `<figure><figcaption>${file}</figcaption><a href="${file}"><img loading="lazy" src="${file}" alt="${file}"></a></figure>`).join('')}</main></html>`)
}
console.log(report)
