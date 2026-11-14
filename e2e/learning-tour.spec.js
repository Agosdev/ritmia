import { test, expect } from '@playwright/test'

const sizes = [
  { name: '320', width: 320, height: 740 },
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 900 },
  { name: '1280', width: 1280, height: 900 },
]

for (const viewport of sizes) {
  test(`tour completo accesible, Nivel 1 y Nivel 2 a ${viewport.name}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/')
    await expect(page.getByRole('region', { name: '¿Primera vez en Ritmia?' })).toBeVisible()

    const bpmBefore = await page.getByRole('spinbutton', { name: 'Valor numérico BPM' }).inputValue()
    const presetBefore = await page.getByRole('combobox', { name: 'Preset' }).inputValue()
    const instrumentBefore = await page.getByRole('combobox', { name: 'Instrumento pista A' }).inputValue()
    const accentsBefore = await page.locator('button[data-track="A"][data-accent]').evaluateAll(nodes => nodes.map(node => node.dataset.accent))
    await page.screenshot({ path: testInfo.outputPath(`invitation-${viewport.name}.png`) })
    await page.getByRole('button', { name: 'Mostrarme' }).click()
    const dialog = page.getByRole('dialog', { name: 'Elegí un ritmo' })
    await expect(dialog).toBeVisible()
    await expect(dialog).not.toHaveAttribute('aria-modal', 'true')
    await expect(dialog.getByText('Paso 1 de 5')).toBeVisible()
    await expect(page.locator('[data-tour-target="preset"]')).toHaveAttribute('data-tour-highlight', 'true')
    await page.screenshot({ path: testInfo.outputPath(`nivel-1-selector-${viewport.name}.png`) })

    await page.getByRole('button', { name: 'Siguiente' }).click()
    await expect(page.getByRole('dialog', { name: 'Probá los golpes' })).toBeVisible()
    await expect(page.locator('[data-tour-target="sequencer"]')).toHaveAttribute('data-tour-highlight', 'true')
    await page.screenshot({ path: testInfo.outputPath(`nivel-1-secuenciador-${viewport.name}.png`) })
    for (const title of ['Cambiá la velocidad', 'Elegí los instrumentos', 'Escuchá tu creación']) {
      await page.getByRole('button', { name: 'Siguiente' }).click()
      await expect(page.getByRole('dialog', { name: title })).toBeVisible()
    }
    await expect(page.locator('[data-tour-target="transport"]')).toHaveAttribute('data-tour-highlight', 'true')
    await page.screenshot({ path: testInfo.outputPath(`nivel-1-transporte-${viewport.name}.png`) })
    await expect(page.getByRole('spinbutton', { name: 'Valor numérico BPM' })).toHaveValue(bpmBefore)
    await expect(page.getByRole('combobox', { name: 'Preset' })).toHaveValue(presetBefore)
    await expect(page.getByRole('combobox', { name: 'Instrumento pista A' })).toHaveValue(instrumentBefore)
    expect(await page.locator('button[data-track="A"][data-accent]').evaluateAll(nodes => nodes.map(node => node.dataset.accent))).toEqual(accentsBefore)
    await expect(page.getByRole('button', { name: 'Reproducir' })).toHaveAttribute('aria-pressed', 'false')

    await page.getByRole('button', { name: 'Finalizar' }).click()
    await expect(page.getByRole('region', { name: '¿Querés combinar dos ritmos?' })).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath(`invitacion-nivel-2-${viewport.name}.png`) })
    await page.getByRole('button', { name: 'Explorar Dos ritmos' }).click()
    await expect(page.getByRole('dialog', { name: 'Combiná dos ritmos' })).toBeVisible()
    await expect(page.locator('[data-tour-target="tracks"]')).toHaveAttribute('data-tour-highlight', 'true')
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await expect(page.getByRole('dialog', { name: 'Explorá sus relaciones' })).toBeVisible()
    await expect(page.locator('[data-tour-target="modes"]')).toHaveAttribute('data-tour-highlight', 'true')
    await page.screenshot({ path: testInfo.outputPath(`nivel-2-modos-${viewport.name}.png`) })

    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      page: document.documentElement.scrollWidth,
      panel: document.querySelector('[data-tour-card]').getBoundingClientRect().toJSON(),
      dock: document.querySelector('[data-testid="lite-mobile-transport"]').getBoundingClientRect().toJSON(),
      target: document.querySelector('[data-tour-highlight]').getBoundingClientRect().toJSON(),
    }))
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport)
    expect(dimensions.panel.left).toBeGreaterThanOrEqual(0)
    expect(dimensions.panel.right).toBeLessThanOrEqual(dimensions.viewport)
    if (viewport.width <= 600) expect(dimensions.panel.bottom).toBeLessThanOrEqual(dimensions.dock.top)
    await page.getByRole('button', { name: 'Saltar tour' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
}

test('Ayuda, teclado, persistencia, zoom y movimiento reducido', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Ahora no' }).click()
  await expect(page.getByRole('region', { name: '¿Primera vez en Ritmia?' })).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('region', { name: '¿Primera vez en Ritmia?' })).toHaveCount(0)
  const help = page.getByRole('button', { name: 'Ayuda' })
  await help.focus()
  await page.keyboard.press('Enter')
  const tourDialog = page.getByRole('dialog', { name: 'Elegí un ritmo' })
  await expect(tourDialog).toBeVisible()
  await expect(tourDialog.getByRole('heading', { name: 'Elegí un ritmo' })).toBeFocused()
  await expect(page.locator('[data-tour-card]')).toHaveCSS('animation-name', 'none')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Saltar tour' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: 'Cerrar tour' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  expect(await page.evaluate(() => !document.activeElement.closest('[role="dialog"]'))).toBe(true)
  await help.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Elegí un ritmo' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(help).toBeFocused()

  await page.evaluate(() => { document.documentElement.style.zoom = '125%' })
  await help.click()
  const dialog = page.getByRole('dialog', { name: 'Elegí un ritmo' })
  await expect(dialog).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('tour-375-zoom-125.png') })
  const panel = await dialog.boundingBox()
  expect(panel.x).toBeGreaterThanOrEqual(0)
  expect(panel.x + panel.width).toBeLessThanOrEqual(375)
})

test('la invitación inicial no bloquea los controles de Ritmia', async ({ browser }) => {
  for (const width of [375, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width <= 600, hasTouch: width <= 600 })
    try {
      const page = await context.newPage()
      await page.goto('/')
      const invitation = page.getByRole('region', { name: '¿Primera vez en Ritmia?' })
      await expect(invitation).toBeVisible()
      await page.getByRole('button', { name: 'Nivel 2 — Dos ritmos', exact: true }).click()
      await expect(page.locator('.lite-interface')).toHaveAttribute('data-level', '2')
      await expect(invitation).toBeVisible()
      await invitation.getByRole('button', { name: 'Ahora no', exact: true }).click()
      await expect(invitation).toHaveCount(0)
      await expect(page.locator('.lite-interface')).toHaveAttribute('data-level', '2')
    } finally {
      await context.close()
    }
  }
})
