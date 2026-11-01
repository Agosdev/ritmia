import { expect, test } from '@playwright/test'

async function activate(page, mode) {
  await page.getByLabel('Tipo de visualizador').selectOption(mode)
  const canvas = page.getByTestId(`physical-${mode}`)
  await expect(canvas).toBeVisible()
  await expect.poll(() => canvas.evaluate(el => el.__ritmiaVisual?.frames ?? 0)).toBeGreaterThan(0)
  return canvas
}
const snapshot = canvas => canvas.evaluate(el => ({
  frames: el.__ritmiaVisual.frames, time: el.__ritmiaVisual.time,
  tracks: el.__ritmiaVisual.tracks.map(({ track, phase, height, impact, gain, audible, scaleX, scaleY }) => ({ track, phase, height, impact, gain, audible, scaleX, scaleY })),
}))

test('classic is the default and Three.js is requested only after explicit 3D activation', async ({ page }) => {
  const requests = []
  page.on('request', request => requests.push(request.url()))
  await page.goto('/')
  await expect(page.getByLabel('Tipo de visualizador')).toHaveValue('classic')
  await expect(page.getByRole('button', { name: 'Activar visualizador especial' })).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('canvas')).toHaveCount(0)
  const threeRequests = () => requests.filter(url => /three(?:[./_-]|\?)/i.test(url))
  expect(threeRequests()).toEqual([])
  const bounce = await activate(page, 'bounce')
  expect(threeRequests()).toEqual([])
  await page.evaluate(() => { window.__retiredVisual = document.querySelector('canvas') })
  const before = (await snapshot(bounce)).frames
  await page.getByRole('button', { name: 'Desactivar visualizador especial' }).click()
  await expect(page.getByLabel('Tipo de visualizador')).toHaveValue('classic')
  await expect(page.locator('canvas')).toHaveCount(0)
  expect(await page.evaluate(() => window.__retiredVisual.__ritmiaVisual.disposed)).toBe(true)
  await page.waitForTimeout(100)
  expect(await page.evaluate(() => window.__retiredVisual.__ritmiaVisual.frames)).toBe(before)
  await activate(page, 'orbit')
  expect(threeRequests().length).toBeGreaterThan(0)
  await page.reload()
  await expect(page.getByLabel('Tipo de visualizador')).toHaveValue('classic')
  await expect(page.locator('canvas')).toHaveCount(0)
})

for (const mode of ['bounce', 'orbit']) {
  test(`${mode}: A/B freeze on pause, resume from the audio clock, reset and release resources`, async ({ page }) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message))
    await page.goto('/')
    await page.getByRole('button', { name: 'Nivel 3 — Dos pistas' }).click()
    const canvas = await activate(page, mode)
    await page.getByRole('button', { name: 'Reproducir' }).click()
    await expect.poll(async () => (await snapshot(canvas)).time).toBeGreaterThan(.15)
    await page.getByRole('button', { name: 'Detener reproducción' }).click()
    await expect(page.getByText('En pausa', { exact: true })).toBeVisible()
    await page.waitForTimeout(80)
    const frozen = await snapshot(canvas)
    await page.waitForTimeout(180)
    expect(await snapshot(canvas)).toEqual(frozen)
    expect(frozen.tracks).toHaveLength(2)
    await page.getByRole('spinbutton', { name: 'Valor numérico BPM' }).fill('140')
    await page.getByRole('button', { name: 'Reproducir' }).click()
    await expect.poll(async () => (await snapshot(canvas)).time).toBeGreaterThan(frozen.time)
    await page.getByRole('button', { name: 'Detener reproducción' }).click()
    await page.getByRole('button', { name: 'Reiniciar ciclo' }).click()
    await expect.poll(async () => (await snapshot(canvas)).tracks.every(item => item.phase === 0 && item.impact === 0 && item.height === 0)).toBe(true)
    await page.evaluate(() => { window.__retiredVisual = document.querySelector('canvas') })
    await page.getByRole('button', { name: 'Desactivar visualizador especial' }).click()
    expect(await page.evaluate(() => window.__retiredVisual.__ritmiaVisual.resourcesDisposed)).toBe(true)
    if (mode === 'orbit') expect(await page.evaluate(() => window.__retiredVisual.getContext('webgl2').isContextLost())).toBe(true)
    expect(errors).toEqual([])
  })

  test(`${mode}: silence and fully muted Morph tracks never create impacts`, async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Nivel 3 — Dos pistas' }).click()
    const grid = page.getByRole('group', { name: 'Secuenciador pista A' })
    for (const pulse of await grid.getByRole('button').all()) {
      while (await pulse.getAttribute('data-accent') !== '0') await pulse.click()
    }
    const canvas = await activate(page, mode)
    await page.getByRole('button', { name: 'Reproducir' }).click()
    await expect.poll(async () => (await snapshot(canvas)).time).toBeGreaterThan(.2)
    let frame = await snapshot(canvas)
    expect(frame.tracks[0]).toMatchObject({ impact: 0, height: 0, audible: false })
    await page.getByRole('button', { name: /Morph —/ }).click()
    const slider = page.getByLabel('Porcentaje de morphing')
    await slider.focus(); await slider.press('Home')
    await expect.poll(async () => (await snapshot(canvas)).tracks[1].gain).toBe(0)
    frame = await snapshot(canvas)
    expect(frame.tracks[1]).toMatchObject({ impact: 0, height: 0, audible: false })
    await slider.press('End')
    await expect.poll(async () => (await snapshot(canvas)).tracks[0].gain).toBe(0)
    expect((await snapshot(canvas)).tracks[0]).toMatchObject({ impact: 0, height: 0, audible: false })
    for (const level of [1, 2]) {
      await page.getByRole('button', { name: new RegExp(`^Nivel ${level} —`) }).click()
      await expect.poll(async () => (await snapshot(canvas)).tracks[0].gain).toBe(1)
    }
    await page.getByRole('button', { name: 'Nivel 3 — Dos pistas' }).click()
    await expect(page.getByLabel('Porcentaje de morphing')).toHaveValue('1')
    await expect.poll(async () => (await snapshot(canvas)).tracks[0].gain).toBe(0)
  })

  test(`${mode}: system reduced motion removes bounce, squash and decorative rotation`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const canvas = await activate(page, mode)
    await expect(page.getByText('Movimiento reducido: escena estable, sin rebotes ni rotación decorativa.')).toBeVisible()
    await page.getByRole('button', { name: 'Reproducir' }).click()
    await expect.poll(async () => (await snapshot(canvas)).time).toBeGreaterThan(.2)
    // Measure entirely inside the browser: CDP round trips can exceed 350 ms on a busy host.
    const rate = await canvas.evaluate(async el => {
      const frames = el.__ritmiaVisual.frames, start = performance.now()
      await new Promise(resolve => setTimeout(resolve, 350))
      return { frames: el.__ritmiaVisual.frames - frames, elapsed: performance.now() - start }
    })
    const end = await snapshot(canvas)
    expect(rate.frames).toBeLessThanOrEqual(Math.ceil(rate.elapsed / 150) + 1)
    expect(end.tracks[0]).toMatchObject({ height: 0, impact: 0, scaleX: 1, scaleY: 1 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await expect(page.getByText('Movimiento reducido: escena estable, sin rebotes ni rotación decorativa.')).toHaveCount(0)
  })
}

test('hidden page stops drawing while the audio clock continues, and resumes without replaying a visual timeline', async ({ page }) => {
  await page.goto('/')
  const canvas = await activate(page, 'bounce')
  await page.getByRole('button', { name: 'Reproducir' }).click()
  await expect.poll(async () => (await snapshot(canvas)).time).toBeGreaterThan(.1)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  const hidden = await snapshot(canvas)
  await page.waitForTimeout(350)
  expect(await snapshot(canvas)).toEqual(hidden)
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')) })
  await expect.poll(async () => (await snapshot(canvas)).time).toBeGreaterThan(hidden.time + .3)
})

test('WebGL unavailable and context loss both fall back to 2D without touching transport', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('spinbutton', { name: 'Numerador compás A' }).fill('9')
  const orbit = await activate(page, 'orbit')
  await page.getByRole('button', { name: 'Reproducir' }).click()
  await orbit.evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext())
  await expect(page.getByTestId('physical-bounce')).toBeVisible()
  await expect(page.getByText('Órbita 3D no disponible en este dispositivo. Se muestra Rebote 2D.')).toBeVisible()
  await expect(page.getByRole('spinbutton', { name: 'Numerador compás A' })).toHaveValue('9')
  await expect(page.getByRole('button', { name: 'Detener reproducción' })).toBeEnabled()
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
      return kind === 'webgl2' ? null : original.call(this, kind, ...rest)
    }
  })
  await page.reload()
  await page.getByLabel('Tipo de visualizador').selectOption('orbit')
  await expect(page.getByTestId('physical-bounce')).toBeVisible()
  await expect(page.getByTestId('physical-orbit')).toHaveCount(0)
  expect(errors).toEqual([])
})

for (const width of [320, 375, 768, 1280]) {
  test(`both optional views remain operable at ${width}px and keep musical configuration`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await page.getByRole('spinbutton', { name: 'Numerador compás A' }).fill('9')
    for (const mode of ['bounce', 'orbit']) {
      const canvas = await activate(page, mode)
      await page.getByRole('button', { name: 'Nivel 2 — Agrupaciones' }).click()
      await page.getByLabel('Agrupación métrica pista A').fill('3+3+3')
      await page.getByRole('button', { name: 'Nivel 3 — Dos pistas' }).click()
      await expect.poll(async () => (await snapshot(canvas)).tracks.length).toBe(2)
      await expect(page.getByRole('spinbutton', { name: 'Numerador compás A' })).toHaveValue('9')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.getByLabel('Tipo de visualizador').focus()
      await expect(page.getByLabel('Tipo de visualizador')).toHaveCSS('outline-width', '3px')
      await expect(page.getByRole('button', { name: 'Reproducir' })).toBeVisible()
    }
  })
}
