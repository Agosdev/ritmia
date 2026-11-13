import { expect, test } from '@playwright/test'

for (const width of [320, 1280]) {
  test(`selector por familias: teclado, foco, métrica y cierre a ${width}px`, async ({ page }) => {
    test.setTimeout(60_000) // Full keyboard/pointer journey, matching the existing preset tests.
    await page.setViewportSize({ width, height: 812 })
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto('/')
    const combo = page.getByRole('combobox', { name: 'Preset', exact: true })
    await combo.focus()
    await expect(combo).toHaveCSS('outline-width', '3px')
    await combo.press('ArrowDown')
    const list = page.getByRole('listbox', { name: 'Presets', exact: true })
    await expect(list).toBeVisible()
    await expect(combo).toBeFocused()
    await expect(combo).toHaveAttribute('aria-expanded', 'true')
    await combo.press('End')
    const last = list.getByRole('option').last()
    await expect(last).toContainText('Funk clásico')
    await expect(combo).toHaveAttribute('aria-activedescendant', await last.getAttribute('id'))
    await expect(last).toBeInViewport()
    await combo.press('Home')
    await combo.press('ArrowDown')
    await expect(combo).toHaveAttribute('aria-activedescendant', await list.getByRole('option').nth(1).getAttribute('id'))
    await combo.press('Escape')
    await expect(list).toHaveCount(0)
    await expect(combo).toHaveValue('Compás libre')
    await expect(combo).toBeFocused()
    await combo.press('Enter')
    await combo.press('m')
    await combo.press('a')
    await combo.press('r')
    await combo.press('t')
    await combo.press('i')
    await combo.press('Enter')
    await expect(combo).toHaveValue('Martinete')
    await combo.click()
    // A direct option click then exercises pointer selection.
    await page.getByRole('option', { name: 'Árabe Maqsum', exact: true }).click()
    await expect(combo).toHaveValue('Maqsum')
    const triggerBox = await combo.boundingBox()
    const clearBox = await page.getByRole('button', { name: 'Quitar preset desde el selector', exact: true }).boundingBox()
    expect(clearBox.y).toBeGreaterThanOrEqual(triggerBox.y)
    expect(clearBox.y + clearBox.height).toBeLessThanOrEqual(triggerBox.y + triggerBox.height)
    await expect(page.getByLabel('Numerador compás A', { exact: true })).toHaveValue('4')
    await expect(page.getByLabel('Denominador compás A', { exact: true })).toHaveValue('4')
    await expect(page.getByRole('group', { name: 'Secuenciador pista A' }).getByRole('button')).toHaveCount(8)
    await expect(page.getByText(/La articulación audible depende del instrumento elegido/)).toBeVisible()
    await combo.click()
    await expect(page.getByRole('option', { name: 'Árabe Maqsum', exact: true })).toHaveAttribute('aria-selected', 'true')
    await combo.press('Tab')
    await expect(list).toHaveCount(0)
    await combo.click()
    await page.getByRole('heading', { name: 'Ritmia', exact: true }).click()
    await expect(list).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `/private/tmp/ritmia-recovery/selector-${width}-closed.png`, fullPage: true })
    await combo.click()
    await combo.press('End')
    await page.screenshot({ path: `/private/tmp/ritmia-recovery/selector-${width}-open.png` })
    await page.getByRole('button', { name: 'Quitar preset desde el selector', exact: true }).click()
    await expect(list).toHaveCount(0)
    await expect(combo).toHaveValue('Compás libre')
    await expect(combo).toBeFocused()
    expect(errors).toEqual([])
  })
}

test('selector en pantalla táctil, contraste de etiquetas y todos los ritmos', async ({ browser }) => {
  test.setTimeout(90_000) // Ten complete touch selections and a contrast measurement.
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })
  try {
    const page = await context.newPage()
    await page.goto('/')
    const combo = page.getByRole('combobox', { name: 'Preset', exact: true })
    const rhythms = [ ['Maqsum',4,4,8], ['Baladi',4,4,8], ['Saidi',4,4,8], ['Malfuf',2,4,8], ['Ayoub',2,4,8], ['Masmoudi Kabir',8,4,8], ['Chiftetelli',8,4,16], ['Wahda',4,4,8], ['Fallahi',2,4,8], ['Karsilama',9,8,9] ]
    for (const [name, num, den, steps] of rhythms) {
      await combo.tap()
      const option = page.getByRole('option', { name: `Árabe ${name}`, exact: true })
      await option.scrollIntoViewIfNeeded()
      await option.tap()
      await expect(combo).toHaveValue(name)
      await expect(page.getByRole('listbox')).toHaveCount(0)
      await expect(page.getByRole('group', { name: 'Compás elegido' })).toContainText(`${num}/${den}`)
      await expect(page.getByRole('group', { name: 'Secuenciador pista A' }).getByRole('button')).toHaveCount(steps)
    }
    await combo.tap()
    const badges = page.getByRole('listbox', { name: 'Presets', exact: true }).getByRole('option').locator(':scope > span')
    const contrasts = await badges.evaluateAll(elements => {
      const lum = color => {
        const values = color.match(/[\d.]+/g).slice(0,3).map(Number).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
        return values[0] * .2126 + values[1] * .7152 + values[2] * .0722
      }
      return elements.map(el => {
        const css = getComputedStyle(el), a = lum(css.color), b = lum(css.backgroundColor)
        return (Math.max(a,b)+.05) / (Math.min(a,b)+.05)
      })
    })
    expect(Math.min(...contrasts)).toBeGreaterThanOrEqual(4.5)
    const first = page.getByRole('listbox', { name: 'Presets', exact: true }).getByRole('option').first()
    await first.scrollIntoViewIfNeeded()
    await first.tap()
    await expect(combo).toHaveValue('Compás libre')
    await expect(page.getByRole('group', { name: 'Secuenciador pista A' }).getByRole('button')).toHaveCount(9)
  } finally { await context.close() }
})
