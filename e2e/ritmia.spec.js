import { expect, test } from '@playwright/test'

test('main musical workflow works with user input and no uncaught JavaScript errors', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Ritmia — Lab Rítmico' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Iniciar reproducción' })).toHaveAttribute('aria-pressed', 'false')

  const helpButton = page.getByRole('button', { name: 'Abrir guía de uso' })
  await helpButton.focus()
  await page.keyboard.press('Enter')
  const welcomeDialog = page.getByRole('dialog', { name: /Bienvenido a Ritmia/ })
  await expect(welcomeDialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(welcomeDialog).toBeHidden()
  await expect(helpButton).toBeFocused()

  const playButton = page.getByRole('button', { name: 'Iniciar reproducción' })
  await playButton.click()
  const stopButton = page.getByRole('button', { name: 'Detener reproducción' })
  await expect(stopButton).toHaveAttribute('aria-pressed', 'true')
  await stopButton.click()
  await expect(page.getByRole('button', { name: 'Iniciar reproducción' })).toHaveAttribute('aria-pressed', 'false')

  const bpm = page.getByRole('spinbutton', { name: 'Valor numérico BPM' })
  await bpm.fill('120')
  await expect(bpm).toHaveValue('120')

  const numeratorA = page.getByRole('spinbutton', { name: 'Numerador compás A' })
  await numeratorA.fill('4')
  await expect(numeratorA).toHaveValue('4')
  await page.getByRole('combobox', { name: 'Denominador compás A' }).selectOption('4')

  await page.getByRole('button', { name: 'Nivel 3 — Polirritmia' }).click()
  const numeratorB = page.getByRole('spinbutton', { name: 'Numerador compás B' })
  await numeratorB.fill('3')
  await expect(numeratorB).toHaveValue('3')
  await page.getByRole('button', { name: 'Clave — 6 patrones tradicionales' }).click()
  const clave = page.getByRole('button', { name: 'Son 3-2' })
  await clave.click()
  await expect(clave).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Ciclo de clave: ocho negras = 4.000s')).toBeVisible()

  expect(pageErrors).toEqual([])
})
