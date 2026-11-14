import { expect, test } from '@playwright/test'

async function choosePreset(page, id) {
  await page.getByRole('combobox', { name: 'Preset', exact: true }).click()
  await page.getByPlaceholder('Buscar ritmo o estilo...').fill(id === 'funk-clasico' ? 'funk' : 'blues')
  await page.getByRole('option', { name: id === 'funk-clasico' ? /Funk clásico/ : /Blues Shuffle/ }).click()
}

test('Funk automático activa bajo sincopado, lo carga bajo demanda y permite apagarlo en móvil', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })
  try {
    const page = await context.newPage()
    const bassResponses = []
    page.on('response', async response => {
      if (response.url().includes('/bass-')) bassResponses.push({ url: response.url(), bytes: (await response.body()).byteLength })
    })
    await page.goto('/')
    expect(await page.evaluate(() => performance.getEntriesByType('resource').filter(entry => /\.wav(?:$|\?)/.test(entry.name)).length)).toBe(0)
    await choosePreset(page, 'funk-clasico')
    const accompaniment = page.getByRole('combobox', { name: 'Acompañamiento de bajo pista A' })
    await expect(accompaniment).toHaveValue('auto')
    await expect(page.getByRole('status', { name: 'Estado bajo pista A' })).toContainText('Bajo en G minor')
    await page.getByRole('button', { name: 'Reproducir', exact: true }).tap()
    await expect.poll(() => bassResponses.length, { timeout: 10_000 }).toBe(2)
    expect(bassResponses.map(item => item.url).join(' ')).toContain('bass-d2.wav')
    expect(bassResponses.map(item => item.url).join(' ')).toContain('bass-g1.wav')
    expect(bassResponses.reduce((sum, item) => sum + item.bytes, 0)).toBe(132388)
    await expect(page.getByRole('button', { name: 'Detener reproducción', exact: true })).toBeVisible()
    const cells = page.getByRole('group', { name: 'Secuenciador pista A' }).getByRole('button')
    const count = await cells.count()
    await accompaniment.selectOption('off')
    await expect(accompaniment).toHaveValue('off')
    await expect(cells).toHaveCount(count)
    await page.getByRole('button', { name: 'Detener reproducción', exact: true }).tap()
    await choosePreset(page, 'blues-shuffle')
    await accompaniment.selectOption('on')
    await expect(page.getByLabel('Subdivisiones por unidad del compás A', { exact: true })).toHaveValue('3')
    expect(bassResponses).toHaveLength(2)
  } finally { await context.close() }
})

test('el error de descarga del bajo informa fallback y no detiene la batería', async ({ page }) => {
  await page.route('**/audio/instruments/bass-*.wav', route => route.fulfill({ status: 503, body: '' }))
  await page.goto('/')
  await choosePreset(page, 'funk-clasico')
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
  await expect(page.getByRole('alert', { name: 'Estado bajo pista A' })).toContainText('No pudimos cargar el bajo')
  await expect(page.getByRole('button', { name: 'Detener reproducción', exact: true })).toBeVisible()
  await page.unroute('**/audio/instruments/bass-*.wav')
  await page.getByRole('button', { name: 'Reintentar bajo', exact: true }).click()
  await expect(page.getByRole('status', { name: 'Estado bajo pista A' })).toContainText('Bajo en G minor')
})
