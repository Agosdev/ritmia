import { expect, test } from '@playwright/test'

for (const width of [320, 375, 768, 1280]) {
  test(`Ritmia fits ${width}px and keeps its primary controls usable`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Ritmia' })).toBeVisible()
    await page.getByRole('button', { name: 'Abrir guía de uso' }).click()
    await expect(page.getByRole('dialog', { name: /Bienvenido a Ritmia/ })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Reproducir' })).toBeVisible()
    await expect(page.getByRole('spinbutton', { name: 'Numerador compás A' })).toBeVisible()
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }))
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)
  })
}

test('Ritmia long A/B grids scroll internally without expanding the mobile page', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await page.getByRole('spinbutton', { name: 'Numerador compás A' }).fill('32')
  const gridA = page.getByRole('group', { name: 'Secuenciador pista A' })
  expect(await gridA.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true)

  await page.getByRole('button', { name: 'Nivel 2 — Dos ritmos' }).click()
  await page.getByRole('spinbutton', { name: 'Numerador compás B' }).fill('32')
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }))
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)
  for (const track of ['A', 'B']) {
    const grid = page.getByRole('group', { name: `Secuenciador pista ${track}` })
    expect(await grid.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true)
    await grid.getByRole('button', { name: 'Pulso 32, acento: silencio' }).focus()
    expect(await grid.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
  }
})

test('Ritmia respects reduced motion and retains a visible keyboard focus indicator', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const liteButton = page.getByRole('button', { name: 'Nivel 1 — Ritmo', exact: true })
  await page.getByRole('button', { name: 'Abrir guía de uso' }).focus()
  await page.keyboard.press('Tab')
  await expect(liteButton).toBeFocused()
  await expect.poll(() => liteButton.evaluate(element => getComputedStyle(element).outlineWidth)).toBe('3px')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const level = page.getByRole('button', { name: 'Nivel 2 — Dos ritmos' })
  await level.hover()
  await expect(level).toHaveCSS('transform', 'none')
  await level.click()
  await expect(level).toHaveAttribute('aria-pressed', 'true')
  await expect(level).toHaveCSS('transition-duration', '0s')
  // Reduced motion must not remove SVG geometry transforms or move phase origin.
  await expect(page.getByTestId('lite-track-A-progress')).toHaveAttribute('transform', 'rotate(-90 120 120)')
  expect(await page.getByTestId('lite-track-A-progress').evaluate(el => getComputedStyle(el).transform)).not.toBe('none')
})

test('Ritmia press overrides hover and selection remains visibly distinct after release', async ({ page }) => {
  await page.goto('/')
  const button = page.getByRole('button', { name: 'Nivel 2 — Dos ritmos' })
  const raised = await button.evaluate(el => getComputedStyle(el).boxShadow)
  await button.hover()
  await page.mouse.down()
  await expect(button).toHaveAttribute('aria-pressed', 'false')
  await expect.poll(() => button.evaluate(el => {
    const transform = getComputedStyle(el).transform
    return transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42
  })).toBeGreaterThan(0)
  await expect.poll(() => button.evaluate(el => getComputedStyle(el).boxShadow.includes('inset'))).toBe(true)
  const held = await button.evaluate(el => getComputedStyle(el).boxShadow)
  await page.mouse.up()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(button).toHaveCSS('transform', 'none')
  const selected = await button.evaluate(el => getComputedStyle(el).boxShadow)
  expect(selected).not.toBe(raised)
  expect(selected).not.toBe(held)
})

test('Ritmia supports real touch input without retaining hover elevation', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })
  try {
    const page = await context.newPage()
    await page.goto('/')
    await page.getByRole('button', { name: 'Nivel 2 — Dos ritmos' }).tap()
    const grid = page.getByRole('group', { name: 'Secuenciador pista B' })
    const pulse = grid.getByRole('button').first()
    await pulse.tap()
    await expect(pulse).toHaveAccessibleName('Pulso 1, acento: silencio')
    await expect(pulse).toHaveCSS('transform', 'none')
    await expect(page.getByRole('button', { name: 'Reproducir' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  } finally {
    await context.close()
  }
})
