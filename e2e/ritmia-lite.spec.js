import { expect, test } from '@playwright/test'

test('Lite and Art share the musical state and transport without reloading the instrument', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/?dev=1')

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

  await expect(page.getByRole('button', { name: 'Nivel 3 — Dos pistas' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('spinbutton', { name: 'Numerador compás B' })).toHaveValue('5')
  await expect(page.getByRole('button', { name: /Polimetría/ })).toHaveAttribute('aria-pressed', 'true')
  expect(errors).toEqual([])

  // Starting from Art must also preserve a later pattern equal to the old lab preset.
  await page.goto('/?interface=art&dev=1')
  await page.getByRole('button', { name: 'Lite', exact: true }).click()
  await page.getByLabel('Numerador compás A', { exact: true }).fill('7')
  await page.getByLabel('Denominador compás A', { exact: true }).selectOption('8')
  await page.getByRole('button', { name: 'Nivel 2 — Agrupaciones' }).click()
  await page.getByLabel('Agrupación métrica pista A').fill('3+2+2')
  await page.getByRole('group', { name: 'Secuenciador pista A' }).getByRole('button').nth(4).click()
  await page.getByRole('button', { name: 'Art', exact: true }).click()
  await expect(page.getByLabel('Numerador compás A', { exact: true })).toHaveValue('7')
  await expect(page.getByLabel('Denominador compás A', { exact: true })).toHaveValue('8')
  await expect(page.getByRole('group', { name: 'Secuenciador pista A' }).getByRole('button').nth(4))
    .toHaveAccessibleName('Pulso 5, acento: suave')
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

  await page.getByRole('button', { name: 'Nivel 3 — Dos pistas' }).click()
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

test('Lite respects reduced motion and retains a visible keyboard focus indicator', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const liteButton = page.getByRole('button', { name: 'Nivel 1 — Ritmo', exact: true })
  await page.getByRole('button', { name: 'Abrir guía de uso' }).focus()
  await page.keyboard.press('Tab')
  await expect(liteButton).toBeFocused()
  await expect.poll(() => liteButton.evaluate(element => getComputedStyle(element).outlineWidth)).toBe('3px')
  await page.getByText('Sonido y preferencias', { exact: true }).click()
  await expect(page.getByLabel('Reducir movimiento')).toBeChecked()
})

test('Lite transport stays available from the sequencer at mobile and desktop widths', async ({ page }) => {
  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 812 })
    await page.goto('/')
    const toolbar = page.getByRole('group', { name: 'Controles de reproducción' })
    await expect(toolbar).toBeVisible()

    if (width <= 900) {
      const dock = page.getByTestId('lite-mobile-transport')
      await expect(dock).toBeVisible()
      const dockBox = await dock.boundingBox()
      expect(dockBox.y + dockBox.height).toBeCloseTo(812, 0)
    } else {
      await expect(page.getByTestId('lite-mobile-transport')).toBeHidden()
    }

    const grid = page.getByRole('group', { name: 'Secuenciador pista A' })
    await grid.scrollIntoViewIfNeeded()
    if (width > 900) {
      expect((await page.locator('header').boundingBox()).y).toBeCloseTo(0, 0)
    }
    await grid.getByRole('button').first().click()
    await expect(page.getByRole('button', { name: 'Iniciar reproducción' })).toBeVisible()
    await page.getByRole('button', { name: 'Iniciar reproducción' }).click()
    await expect(page.getByRole('button', { name: 'Pausar reproducción' })).toBeEnabled()
    await grid.getByRole('button').nth(1).click()
    await page.getByRole('button', { name: 'Pausar reproducción' }).click()
    await expect(page.getByText('En pausa')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reanudar reproducción' })).toBeVisible()
  }
})

test('Lite fixed transport does not cover the last pulse and preserves phase across pause/resume', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  const numerator = page.getByRole('spinbutton', { name: 'Numerador compás A' })
  await numerator.fill('32')

  const grid = page.getByRole('group', { name: 'Secuenciador pista A' })
  const finalPulse = grid.getByRole('button', { name: /Pulso 32/ })
  await finalPulse.focus()
  await finalPulse.scrollIntoViewIfNeeded()
  await expect(finalPulse).toBeFocused()

  const dock = page.getByTestId('lite-mobile-transport')
  const dockBox = await dock.boundingBox()
  const pulseBox = await finalPulse.boundingBox()
  expect(pulseBox.y + pulseBox.height).toBeLessThan(dockBox.y)
  expect(await finalPulse.evaluate(element => getComputedStyle(element).outlineWidth)).toBe('3px')

  await page.getByRole('button', { name: 'Iniciar reproducción' }).click()
  const progress = page.getByTestId('lite-track-A-progress')
  await expect.poll(() => progress.getAttribute('stroke-dasharray')).not.toBe('0 552.9203070318035')
  await page.getByRole('button', { name: 'Pausar reproducción' }).click()
  const pausedPhase = await progress.getAttribute('stroke-dasharray')
  await page.waitForTimeout(150)
  await expect(progress).toHaveAttribute('stroke-dasharray', pausedPhase)

  await page.getByRole('button', { name: 'Reanudar reproducción' }).click()
  await expect.poll(() => progress.getAttribute('stroke-dasharray')).not.toBe(pausedPhase)
  await page.getByRole('button', { name: 'Pausar reproducción' }).click()
  await grid.getByRole('button', { name: /Pulso 32/ }).click()
  await expect(page.getByRole('button', { name: 'Reanudar reproducción' })).toBeVisible()

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }))
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)
})


test('public Lite exposes three free levels and preserves musical edits across them', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('group', { name: 'Presentación visual' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^(Practicar|Explorar)$/ })).toHaveCount(0)
  const level = n => page.getByRole('button', { name: new RegExp(`^Nivel ${n} —`) })
  await expect(level(1)).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('Agrupación métrica pista A')).toHaveCount(0)
  await expect(page.getByRole('group', { name: 'Secuenciador pista B' })).toHaveCount(0)
  await page.getByLabel('Numerador compás A', { exact: true }).fill('9')
  const gridA = page.getByRole('group', { name: 'Secuenciador pista A' })
  const first = gridA.getByRole('button').first()
  await first.click()
  await expect(first).toHaveAccessibleName('Pulso 1, acento: silencio')
  await first.press('Enter')
  await expect(first).toHaveAccessibleName('Pulso 1, acento: suave')
  await first.press('Space')
  await expect(first).toHaveAccessibleName('Pulso 1, acento: fuerte')
  await level(2).click()
  await page.getByLabel('Agrupación métrica pista A').fill('3+3+3')
  await expect(page.getByLabel('Agrupación métrica pista A')).toHaveAttribute('aria-invalid', 'false')
  await level(3).click()
  await expect(page.getByRole('group', { name: 'Secuenciador pista B' })).toBeVisible()
  await page.getByLabel('Numerador compás B', { exact: true }).fill('6')
  await page.getByRole('button', { name: /Morph —/ }).click()
  await expect(page.getByLabel('Porcentaje de morphing')).toBeVisible()
  await level(1).click()
  await expect(page.getByRole('group', { name: 'Secuenciador pista B' })).toHaveCount(0)
  await expect(page.getByLabel('Numerador compás A', { exact: true })).toHaveValue('9')
  await expect(gridA.getByRole('button').first()).toHaveAccessibleName('Pulso 1, acento: fuerte')
  await level(3).click()
  await expect(page.getByLabel('Numerador compás B', { exact: true })).toHaveValue('6')
  await expect(page.getByLabel('Agrupación métrica pista A')).toHaveValue('3+3+3')
  await expect(page.getByRole('button', { name: /Morph —/ })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: /Clave —/ }).click()
  await page.getByRole('button', { name: 'Son 3-2', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Son 3-2', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

for (const width of [320, 375, 768, 1280]) {
  test(`all Lite levels fit ${width}px with reachable keys and fixed navigation`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    await page.goto('/')
    for (const level of [1, 2, 3]) {
      const button = page.getByRole('button', { name: new RegExp(`^Nivel ${level} —`) })
      await button.click()
      await expect(button).toHaveAttribute('aria-pressed', 'true')
      await expect(page.getByRole('group', { name: 'Controles de reproducción' })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const grid = page.getByRole('group', { name: `Secuenciador pista ${level === 3 ? 'B' : 'A'}` })
      await grid.getByRole('button').last().focus()
      await expect(grid.getByRole('button').last()).toBeFocused()
      await expect(grid.getByRole('button').last()).toHaveCSS('outline-width', '3px')
      if (width <= 900) {
        const key = await grid.getByRole('button').last().boundingBox()
        const dock = await page.getByTestId('lite-mobile-transport').boundingBox()
        expect(key.y + key.height).toBeLessThanOrEqual(dock.y)
      }
    }
  })
}

test('Lite movement preference removes tactile transforms and retains selection', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Sonido y preferencias', { exact: true }).click()
  await page.getByLabel('Reducir movimiento').focus()
  await page.keyboard.press('Space')
  await expect(page.getByLabel('Reducir movimiento')).toBeChecked()
  const level = page.getByRole('button', { name: 'Nivel 2 — Agrupaciones' })
  await level.hover()
  await expect(level).toHaveCSS('transform', 'none')
  await level.click()
  await expect(level).toHaveAttribute('aria-pressed', 'true')
  await expect(level).toHaveCSS('transition-duration', '0s')
  // Reduced motion must not remove SVG geometry transforms or move phase origin.
  await expect(page.getByTestId('lite-track-A-progress')).toHaveAttribute('transform', 'rotate(-90 120 120)')
  expect(await page.getByTestId('lite-track-A-progress').evaluate(el => getComputedStyle(el).transform)).not.toBe('none')
})

test('Lite press overrides hover and selection remains visibly distinct after release', async ({ page }) => {
  await page.goto('/')
  const button = page.getByRole('button', { name: 'Nivel 2 — Agrupaciones' })
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

test('Lite supports real touch input without retaining hover elevation', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })
  try {
    const page = await context.newPage()
    await page.goto('/')
    await page.getByRole('button', { name: 'Nivel 3 — Dos pistas' }).tap()
    const grid = page.getByRole('group', { name: 'Secuenciador pista B' })
    const pulse = grid.getByRole('button').first()
    await pulse.tap()
    await expect(pulse).toHaveAccessibleName('Pulso 1, acento: silencio')
    await expect(pulse).toHaveCSS('transform', 'none')
    await expect(page.getByRole('button', { name: 'Iniciar reproducción' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  } finally {
    await context.close()
  }
})
