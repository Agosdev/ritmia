import { expect, test } from '@playwright/test'

for (const width of [320, 375, 768, 1280]) {
  test(`layout at ${width}px keeps primary controls usable without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Ritmia — Lab Rítmico' })).toBeVisible()
    await expect(page.getByRole('slider', { name: 'Ajustar tempo BPM' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Iniciar reproducción' })).toBeEnabled()
    await expect(page.getByRole('button', { name: 'Nivel 1 — Un compás' })).toBeVisible()
    await expect(page.getByRole('spinbutton', { name: 'Numerador compás A' })).toBeVisible()

    const documentWidths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }))
    expect(documentWidths.document).toBeLessThanOrEqual(documentWidths.viewport)
    expect(documentWidths.body).toBeLessThanOrEqual(documentWidths.viewport)

    const clipped = await page.locator('button, input, select').evaluateAll(elements => {
      const viewport = document.documentElement.clientWidth
      return elements.filter(element => {
        const rect = element.getBoundingClientRect()
        return rect.width > 0 && (rect.left < 0 || rect.right > viewport + 1)
      }).map(element => element.outerHTML)
    })
    expect(clipped).toEqual([])
  })
}

test('long beat grids scroll horizontally and remain keyboard reachable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Nivel 3 — Polirritmia' }).click()
  const numerator = page.getByRole('spinbutton', { name: 'Numerador compás A' })
  await numerator.fill('16')

  const grid = page.getByRole('group', { name: 'Secuenciador Compás A' })
  await expect(grid).toHaveAttribute('tabindex', '0')
  await expect(grid).toHaveAttribute('aria-describedby')
  expect(await grid.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true)
  await grid.focus()
  await page.getByRole('button', { name: 'Pulso 16, acento: silencio' }).focus()
  expect(await grid.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
})

test('dialog fits small viewports and isolates background focus', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Abrir guía de uso' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: /Bienvenido a Ritmia/ })
  await expect(dialog).toBeVisible()
  expect(await page.locator('header').getAttribute('inert')).not.toBeNull()
  const bounds = await dialog.boundingBox()
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320)
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
})

test('dialog remains operable by keyboard on a small viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Abrir guía de uso' })
  await trigger.focus()
  await page.keyboard.press('Enter')

  const dialog = page.getByRole('dialog', { name: /Bienvenido a Ritmia/ })
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cerrar modal' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})
