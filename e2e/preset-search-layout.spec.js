import { expect, test } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const shots = '/private/tmp/ritmia-search-layout'
mkdirSync(shots, { recursive: true })

for (const width of [320, 375, 768, 1280]) test(`selector responsive ${width}px: alineación, coincidencias y vacío`, async ({ browser }, testInfo) => {
  test.setTimeout(60000)
  const mobile = width <= 375
  const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: mobile, hasTouch: mobile })
  try {
    const page = await context.newPage()
    await page.goto('/')
    const trigger = page.getByRole('combobox', { name: 'Preset', exact: true })
    if (mobile) await trigger.tap()
    else await trigger.click()
    const search = page.getByPlaceholder('Buscar ritmo o estilo...')
    const popup = page.locator('[data-preset-popup]')
    await expect(search).toBeFocused()
    await expect(search).toBeVisible()
    const measure = async () => {
      const [field, icon, clear, panel, dock, viewport] = await Promise.all([
        search.boundingBox(), page.getByTestId('preset-search-icon').boundingBox(),
        page.getByTestId('preset-search-clear').count().then(count => count ? page.getByTestId('preset-search-clear').boundingBox() : null), popup.boundingBox(),
        page.getByTestId('lite-mobile-transport').boundingBox(),
        page.evaluate(() => ({ width: innerWidth, height: innerHeight, vvTop: visualViewport?.offsetTop ?? 0, vvHeight: visualViewport?.height ?? innerHeight })),
      ])
      expect(field.height).toBe(44)
      expect(Math.abs((field.y + field.height / 2) - (icon.y + icon.height / 2))).toBeLessThan(1)
      expect(icon.x).toBeGreaterThanOrEqual(field.x)
      expect(icon.x + icon.width).toBeLessThan(field.x + field.width - 24)
      expect(panel.x).toBeGreaterThanOrEqual(7)
      expect(panel.x + panel.width).toBeLessThanOrEqual(viewport.width - 7)
      expect(panel.y).toBeGreaterThanOrEqual(viewport.vvTop)
      expect(panel.y + panel.height).toBeLessThanOrEqual(viewport.vvTop + viewport.vvHeight + 2)
      expect(panel.y + panel.height).toBeLessThanOrEqual(dock.y + 2)
      if (clear) {
        expect(clear.width).toBeGreaterThanOrEqual(40)
        expect(clear.x).toBeGreaterThan(field.x + field.width - 52)
        expect(clear.x + clear.width).toBeLessThanOrEqual(field.x + field.width - 5)
        expect(Math.abs((field.y + field.height / 2) - (clear.y + clear.height / 2))).toBeLessThan(1)
      }
    }
    await measure()
    await page.screenshot({ path: `${shots}/open-${width}.png` })

    await search.fill('blues')
    await expect(page.getByRole('option', { name: /Blues Shuffle/ })).toBeVisible()
    await expect(page.getByRole('option', { name: /Slow Blues/ })).toBeVisible()
    await page.screenshot({ path: `${shots}/matches-${width}.png` })
    await measure()

    await search.fill('no-such-rhythm')
    await expect(page.getByRole('status').filter({ hasText: 'No se encontraron ritmos' })).toBeVisible()
    await page.screenshot({ path: `${shots}/empty-${width}.png` })
    await measure()

    if (mobile && width === 375) {
      await search.fill('rock')
      await page.setViewportSize({ width: 375, height: 500 }) // keyboard-visible viewport simulation
      await page.waitForTimeout(100)
      await expect(search).toBeFocused()
      await expect(page.getByRole('option', { name: /Rock clásico/ })).toBeVisible()
      await measure()
      await page.screenshot({ path: `${shots}/keyboard-375.png` })
    }
  } finally { await context.close() }
})
