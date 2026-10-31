import { expect, test } from '@playwright/test'

test('Lite and Art share the musical state and transport without reloading the instrument', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Ritmia Lite' })).toBeVisible()
  await expect(page.getByRole('img', { name: /Visualizador circular de los ciclos musicales/ })).toBeVisible()
  await expect(page.locator('.artwork-plane')).toHaveCount(0)
  expect(await page.evaluate(() => performance.getEntriesByType('resource')
    .some(entry => entry.name.includes('RitmiaArtVisualizer')))).toBe(false)

  const numeratorA = page.getByRole('spinbutton', { name: 'Numerador compás A' })
  await numeratorA.fill('7')
  await page.getByRole('button', { name: 'Art', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Ritmia Art' })).toBeVisible()
  await expect(page.getByRole('spinbutton', { name: 'Numerador compás A' })).toHaveValue('7')

  await page.getByRole('button', { name: 'Explorar', exact: true }).click()
  await page.getByRole('button', { name: 'Activar pista B' }).click()
  await page.getByRole('button', { name: 'Mostrar controles de edición' }).click()
  await page.getByRole('spinbutton', { name: 'Numerador compás B' }).fill('5')
  await page.getByRole('button', { name: /Polimetría/ }).click()
  await expect(page.getByRole('button', { name: /Polimetría/ })).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Practicar', exact: true }).click()
  await page.getByRole('button', { name: 'Iniciar reproducción' }).click()
  await expect(page.getByRole('button', { name: 'Pausar reproducción' })).toBeEnabled()
  await page.getByRole('button', { name: 'Pausar reproducción' }).click()

  await page.getByRole('button', { name: 'Lite', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Ritmia Lite' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reanudar reproducción' })).toBeEnabled()
  await expect(page.getByRole('spinbutton', { name: 'Numerador compás A' })).toHaveValue('7')
  await expect(page.getByTestId('lite-cycle-title')).toHaveCount(1)

  await page.getByRole('button', { name: 'Explorar', exact: true }).click()
  await expect(page.getByRole('spinbutton', { name: 'Numerador compás B' })).toHaveValue('5')
  await expect(page.getByRole('button', { name: /Polimetría/ })).toHaveAttribute('aria-pressed', 'true')
  expect(errors).toEqual([])
})

for (const width of [320, 375, 768, 1280]) {
  test(`Lite fits ${width}px and keeps its primary controls usable`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Ritmia Lite' })).toBeVisible()
    await page.getByRole('button', { name: 'Abrir guía de uso' }).click()
    await expect(page.getByRole('dialog', { name: /Bienvenido a Ritmia/ })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Iniciar reproducción' })).toBeVisible()
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

test('Lite long A/B grids scroll internally without expanding the mobile page', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await page.getByRole('spinbutton', { name: 'Numerador compás A' }).fill('32')
  const gridA = page.getByRole('group', { name: 'Secuenciador pista A' })
  expect(await gridA.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true)

  await page.getByRole('button', { name: 'Explorar', exact: true }).click()
  await page.getByRole('button', { name: 'Activar pista B' }).click()
  await page.getByRole('button', { name: 'Mostrar controles de edición' }).click()
  await page.getByRole('spinbutton', { name: 'Numerador compás B' }).fill('32')
  await page.getByRole('button', { name: 'Practicar', exact: true }).click()
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

test('Lite respects reduced motion and retains a visible keyboard focus indicator', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByLabel('Reducir movimiento')).toBeChecked()
  const liteButton = page.getByRole('button', { name: 'Lite', exact: true })
  await page.keyboard.press('Tab')
  await expect(liteButton).toBeFocused()
  await expect.poll(() => liteButton.evaluate(element => getComputedStyle(element).outlineWidth)).toBe('3px')
})
