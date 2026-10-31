import { expect, test } from '@playwright/test'

test('Art starts with an accessible beginner pattern and keeps Explore presentation-only', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.goto('/?prototype=rhythm-art')

  await expect(page.getByRole('heading', { name: 'Ritmia Art' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'El ritmo, en pantalla' })).toBeVisible()
  await expect(page.getByRole('spinbutton', { name: 'Numerador compás A' })).toHaveValue('4')
  await expect(page.getByRole('group', { name: 'Secuenciador pista A' }).getByRole('button')).toHaveCount(4)
  await expect(page.getByTestId('art-cycle-b')).toHaveCount(0)

  await page.getByRole('button', { name: 'Explorar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Activar pista B' })).toBeVisible()
  await expect(page.getByTestId('art-cycle-b')).toHaveCount(0)
  await page.getByRole('button', { name: 'Practicar', exact: true }).click()
  await expect(page.getByRole('spinbutton', { name: 'Numerador compás A' })).toHaveValue('4')
  await expect(page.getByTestId('art-cycle-b')).toHaveCount(0)
  expect(pageErrors).toEqual([])
})

test('Art explicitly activates B and exposes the existing advanced modes and grids', async ({ page }) => {
  await page.goto('/?prototype=rhythm-art')
  await page.getByRole('button', { name: 'Explorar', exact: true }).click()
  await page.getByRole('button', { name: 'Activar pista B' }).click()

  await page.getByRole('button', { name: 'Mostrar controles de edición' }).click()
  await expect(page.getByRole('button', { name: /Polimetría/ })).toBeVisible()
  await page.getByRole('button', { name: /Polimetría/ }).click()
  await expect(page.getByRole('button', { name: /Polimetría/ })).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Practicar', exact: true }).click()
  await expect(page.getByTestId('art-cycle-a')).toBeVisible()
  await expect(page.getByTestId('art-cycle-b')).toBeVisible()
  const gridA = page.getByRole('group', { name: 'Secuenciador pista A' })
  const gridB = page.getByRole('group', { name: 'Secuenciador pista B' })
  await expect(gridA.getByRole('button')).toHaveCount(4)
  await expect(gridB.getByRole('button')).toHaveCount(5)
  await expect(page.getByText(/Polimetría/).first()).toBeVisible()
})

test('Art transport freezes phase on pause and reset returns to the start', async ({ page }) => {
  await page.goto('/?prototype=rhythm-art')
  const phase = page.getByTestId('art-phase-a')
  const startPosition = await phase.evaluate(element => ({
    cx: element.getAttribute('cx'),
    cy: element.getAttribute('cy'),
  }))

  await page.getByRole('button', { name: 'Iniciar reproducción' }).click()
  await expect.poll(() => phase.getAttribute('cy')).not.toBe(startPosition.cy)
  await expect(page.getByText('Reproduciendo')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pausar reproducción' })).toBeEnabled()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'Pausar reproducción' }).click()
  await expect(page.getByText('En pausa')).toBeVisible()
  const positionWhenPaused = await phase.evaluate(element => ({
    cx: element.getAttribute('cx'),
    cy: element.getAttribute('cy'),
  }))
  expect(positionWhenPaused).not.toEqual(startPosition)
  await page.waitForTimeout(120)
  await expect(phase).toHaveAttribute('cx', positionWhenPaused.cx)
  await expect(phase).toHaveAttribute('cy', positionWhenPaused.cy)

  await page.getByRole('button', { name: 'Reanudar reproducción' }).click()
  await expect(page.getByRole('button', { name: 'Pausar reproducción' })).toBeEnabled()
  await page.getByRole('button', { name: 'Reiniciar ciclo' }).click()
  await expect(page.getByText('Patrón en reposo')).toBeVisible()
  await expect(phase).toHaveAttribute('cx', startPosition.cx)
  await expect(phase).toHaveAttribute('cy', startPosition.cy)
})

test('Art stays within supported viewport widths and respects reduced-motion preference', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?prototype=rhythm-art')

  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }))
    expect(dimensions.document, `${width}px document overflow`).toBeLessThanOrEqual(dimensions.viewport)
    expect(dimensions.body, `${width}px body overflow`).toBeLessThanOrEqual(dimensions.viewport)
    await expect(page.getByRole('button', { name: 'Iniciar reproducción' })).toBeVisible()
  }

  await expect(page.getByLabel('Reducir movimiento')).toBeChecked()
})
