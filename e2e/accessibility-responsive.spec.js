import { expect, test } from '@playwright/test'
for (const width of [320, 375, 768, 1280]) {
  test(`Ritmia keyboard and layout ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Ritmia', exact: true })).toBeVisible()
    await expect(page.getByLabel('Opciones', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Abrir guía de uso' })).toHaveCount(0)
    for (const level of [1, 2]) {
      await page.getByRole('button', { name: new RegExp(`^Nivel ${level} —`) }).click()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const lastKey = page.getByRole('group', { name: `Secuenciador pista ${level === 2 ? 'B' : 'A'}` }).getByRole('button').last()
      await lastKey.focus()
      await expect(lastKey).toHaveCSS('outline-width', '3px')
      {
        const key = await lastKey.boundingBox(), dock = await page.getByTestId('lite-mobile-transport').boundingBox()
        expect(key.y + key.height).toBeLessThanOrEqual(dock.y)
      }
      await expect(page.getByRole('button', { name: 'Reproducir', exact: true })).toBeVisible()
    }
    for (const name of ['Modo seguro', 'Reducir movimiento', 'Kit de sonido']) await expect(page.getByLabel(name, { exact: true })).toHaveCount(0)
    await expect(page.getByText('Relaciones y tiempos musicales')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Probar lectura' })).toHaveCount(0)
    const marker = page.getByLabel('Marcar inicio de compás').filter({ visible: true })
    await marker.focus(); await marker.press('Space'); await expect(marker).toBeChecked()
  })
}
for (const query of ['?interface=art', '?prototype=rhythm-art', '?prototype=lab', '?prototype=rhythm-a', '?dev=1']) {
  test(`legacy parameter ${query} cannot open another app`, async ({ page }) => {
    await page.goto('/' + query)
    await expect(page.getByRole('heading', { name: 'Ritmia', exact: true })).toBeVisible()
    await expect(page.getByRole('group', { name: 'Presentación visual' })).toHaveCount(0)
    await expect(page.locator('.artwork-plane')).toHaveCount(0)
  })
}
