import { expect, test } from '@playwright/test'

const widths = [320, 375, 768, 1280]
const getGrid = page => page.getByRole('group', { name: 'Acentos de la pista A' })
const getNumerator = page => page.getByRole('spinbutton', { name: 'Cantidad de posiciones de A' })

async function setNumerator(page, count) {
  const input = getNumerator(page)
  await input.fill(String(count))
  await input.press('Tab')
}

test('the development prototype is isolated from the main lab', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))

  await page.goto('/?prototype=rhythm-a')
  await expect(page.getByRole('heading', { name: 'Un ciclo, muchas huellas' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Ciclo rítmico · A/ })).toBeVisible()
  expect(pageErrors).toEqual([])

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Ritmia — Lab Rítmico' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Un ciclo, muchas huellas' })).toHaveCount(0)
  expect(pageErrors).toEqual([])
})

test('short pulse grids are centered and the prototype has no page overflow at supported widths', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.goto('/?prototype=rhythm-a')

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 })
    await expect(page.getByLabel('Reducir movimiento')).not.toBeChecked()
    for (const count of [4, 7, 12]) {
      await setNumerator(page, count)
      const grid = getGrid(page)
      await expect(grid.getByRole('button')).toHaveCount(count)

      const geometry = await grid.evaluate(element => {
        const gridRect = element.getBoundingClientRect()
        const rows = new Map()
        for (const button of element.querySelectorAll('button')) {
          const rect = button.getBoundingClientRect()
          const row = Math.round(rect.top)
          const centers = rows.get(row) ?? []
          centers.push(rect.left + rect.width / 2)
          rows.set(row, centers)
        }
        return {
          gridCenter: gridRect.left + gridRect.width / 2,
          rowCenters: [...rows.values()].map(centers =>
            centers.reduce((sum, center) => sum + center, 0) / centers.length
          ),
          viewport: document.documentElement.clientWidth,
          document: document.documentElement.scrollWidth,
          body: document.body.scrollWidth,
        }
      })

      for (const rowCenter of geometry.rowCenters) {
        expect(Math.abs(rowCenter - geometry.gridCenter), `${count} positions at ${width}px`).toBeLessThanOrEqual(4)
      }
      expect(geometry.document).toBeLessThanOrEqual(geometry.viewport)
      expect(geometry.body).toBeLessThanOrEqual(geometry.viewport)
    }
  }

  expect(pageErrors).toEqual([])
})

test('long pulse grids begin at the first position and scroll focused pulses into view', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('/?prototype=rhythm-a')

  for (const count of [16, 32]) {
    await setNumerator(page, count)
    const grid = getGrid(page)
    const first = grid.getByRole('button', { name: 'Posición 1: fuerte. Cambiar acento' })
    const last = grid.getByRole('button', { name: new RegExp(`Posición ${count}:`) })
    const initial = await grid.evaluate(element => ({
      scrollLeft: element.scrollLeft,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }))

    expect(initial.scrollWidth).toBeGreaterThan(initial.clientWidth)
    expect(initial.scrollLeft).toBe(0)
    await grid.scrollIntoViewIfNeeded()
    const visibleRegion = await grid.evaluate(element => {
      const gridRect = element.getBoundingClientRect()
      const firstRect = element.querySelector('button').getBoundingClientRect()
      const left = gridRect.left + element.clientLeft
      const top = gridRect.top + element.clientTop
      return {
        scrollLeft: element.scrollLeft,
        firstIsHorizontallyVisible:
          firstRect.left >= left && firstRect.right <= left + element.clientWidth,
        firstIsVerticallyVisible:
          firstRect.top >= top && firstRect.bottom <= top + element.clientHeight,
      }
    })
    expect(visibleRegion.scrollLeft).toBe(0)
    expect(visibleRegion.firstIsHorizontallyVisible).toBe(true)
    expect(visibleRegion.firstIsVerticallyVisible).toBe(true)
    await expect(first).toBeInViewport()

    await last.focus()
    await expect(last).toBeFocused()
    await expect.poll(() => grid.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
    await expect(last).toBeInViewport()
  }
})

test('play, pause, resume, and reset preserve the visible musical position', async ({ page }) => {
  await page.goto('/?prototype=rhythm-a')
  const trajectory = page.getByTestId('cycle-trajectory')
  await expect(trajectory).toBeVisible()
  await expect(page.getByTestId('cycle-progress')).toHaveCount(0)
  await expect(page.getByText('patrón en reposo')).toBeVisible()

  await page.getByRole('button', { name: 'Iniciar reproducción' }).click()
  await expect(page.getByText(/posición \d+ de \d+/)).toBeVisible()
  await expect(page.getByTestId('cycle-progress')).toBeVisible()
  await page.getByRole('button', { name: 'Pausar reproducción' }).click()
  await expect(page.getByText(/en pausa · posición \d+ de \d+/)).toBeVisible()
  const frozenOffset = await page.getByTestId('cycle-progress').getAttribute('stroke-dashoffset')
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() =>
    requestAnimationFrame(resolve)
  )))
  await expect(page.getByTestId('cycle-progress')).toHaveAttribute('stroke-dashoffset', frozenOffset)

  await page.getByRole('button', { name: 'Reanudar reproducción' }).click()
  await expect(page.getByRole('button', { name: 'Pausar reproducción' })).toBeEnabled()
  await page.getByRole('button', { name: 'Reiniciar ciclo' }).click()
  await expect(page.getByText('patrón en reposo')).toBeVisible()
  await expect(trajectory).toBeVisible()
  await expect(page.getByTestId('cycle-progress')).toHaveCount(0)
})

test('system reduced-motion preference takes precedence over the unchecked internal preference', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?prototype=rhythm-a')
  const internalPreference = page.getByLabel('Reducir movimiento')

  await expect(internalPreference).not.toBeChecked()
  await expect(page.getByText('El sistema operativo solicita reducir el movimiento', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Iniciar reproducción' }).click()
  await expect(page.getByRole('button', { name: 'Pausar reproducción' })).toBeEnabled()
  await expect(page.getByTestId('cycle-progress')).toHaveCount(0)
  await page.getByRole('button', { name: 'Pausar reproducción' }).click()
  await expect(page.getByText(/en pausa · posición \d+ de \d+/)).toBeVisible()
  await expect(page.getByTestId('cycle-progress')).toHaveCount(0)

  await internalPreference.check()
  await expect(internalPreference).toBeChecked()
  await expect(page.getByTestId('cycle-progress')).toHaveCount(0)
  await page.getByRole('button', { name: 'Reiniciar ciclo' }).click()
})

test('silence, soft, and strong accents remain distinguishable by accessible labels', async ({ page }) => {
  await page.goto('/?prototype=rhythm-a')
  const position = state => page.getByRole('button', {
    name: `Posición 2: ${state}. Cambiar acento`,
  })

  await expect(position('silencio')).toBeVisible()
  await position('silencio').click()
  await expect(position('suave')).toBeVisible()
  await position('suave').click()
  await expect(position('fuerte')).toBeVisible()
  await position('fuerte').click()
  await expect(position('silencio')).toBeVisible()
})
