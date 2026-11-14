import { expect, test } from '@playwright/test'

test('acoustic only, samples cached across pause/reset and marker disabled by default', async ({ page }) => {
  const requests = []
  page.on('request', request => { if (/\/audio\/acoustic\/.*\.wav/.test(request.url())) requests.push(request.url()) })
  await page.goto('/')
  await expect(page.getByLabel('Kit de sonido')).toHaveCount(0)
  await expect(page.getByLabel('Marcar inicio de compás').filter({ visible: true })).not.toBeChecked()
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Detener reproducción' })).toBeVisible()
  expect(requests).toHaveLength(4)
  await page.getByRole('button', { name: 'Detener reproducción' }).click()
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
  await page.getByRole('button', { name: 'Reiniciar ciclo' }).click()
  await page.getByRole('button', { name: 'Nivel 2 — Dos ritmos' }).click()
  await expect(page.getByLabel('Tipo de visualizador')).toHaveCount(0)
  await expect(page.getByTestId('lite-track-B-progress')).toBeVisible()
  await expect(page.getByLabel('Marcar inicio de compás').filter({ visible: true })).not.toBeChecked()
  expect(requests).toHaveLength(4)
})

for (const width of [375, 1280]) {
test(`failed sample load at ${width} presents a visible retry without synthesis`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 })
  await page.route('**/audio/acoustic/*.wav', route => route.fulfill({ status: 503, body: '' }))
  await page.goto('/')
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('No pudimos iniciar el sonido')
  await expect(page.getByRole('alert')).toBeInViewport()
  await expect(page.getByRole('button', { name: 'Detener reproducción' })).toHaveCount(0)
  await page.unroute('**/audio/acoustic/*.wav')
  await expect(page.getByText('¿No escuchás el ritmo?', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Volver a intentar' }).click()
  await expect(page.getByRole('button', { name: 'Detener reproducción' })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})
}
