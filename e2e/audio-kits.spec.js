import { expect, test } from '@playwright/test'

test('acoustic samples load once before playback and the original synth remains selectable', async ({ page }) => {
  const sampleRequests = new Set()
  page.on('requestfinished', request => {
    if (request.url().includes('/audio/acoustic/')) sampleRequests.add(request.url())
  })

  await page.goto('/')
  await page.getByText('Sonido y preferencias', { exact: true }).click()
  const kit = page.getByLabel('Kit de sonido')
  await expect(kit).toHaveValue('acoustic')

  await page.getByRole('button', { name: 'Iniciar reproducción' }).click()
  await expect(page.getByRole('button', { name: 'Pausar reproducción' })).toBeEnabled()
  await expect.poll(() => sampleRequests.size).toBe(4)
  await expect(kit).toBeDisabled()

  await page.getByRole('button', { name: 'Pausar reproducción' }).click()
  await expect(kit).toBeEnabled()
  await kit.selectOption('synth')
  await expect(kit).toHaveValue('synth')
  await page.getByRole('button', { name: 'Reanudar reproducción' }).click()
  await expect(page.getByRole('button', { name: 'Pausar reproducción' })).toBeEnabled()
  expect(sampleRequests.size).toBe(4)
})
