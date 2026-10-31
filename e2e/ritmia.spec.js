import { expect, test } from '@playwright/test'

test('main musical workflow works with user input and no uncaught JavaScript errors', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))

  await page.goto('/?prototype=lab')
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
  await playButton.focus()
  await page.keyboard.press('Enter')
  await expect(playButton).toHaveAttribute('aria-pressed', 'true')
  const pauseButton = page.getByRole('button', { name: 'Pausar reproducción' })
  await expect(pauseButton).toBeEnabled()
  await pauseButton.focus()
  await page.keyboard.press('Enter')
  const resumeButton = page.getByRole('button', { name: 'Reanudar reproducción' })
  await expect(resumeButton).toHaveAttribute('aria-pressed', 'false')
  await resumeButton.focus()
  await page.keyboard.press('Enter')
  await expect(playButton).toHaveAttribute('aria-pressed', 'true')
  const resetButton = page.getByRole('button', { name: 'Reiniciar ciclo' })
  await resetButton.focus()
  await page.keyboard.press('Enter')
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

test('level three transport freezes both tracks across pause, mode changes, and reset', async ({ page }) => {
  await page.goto('/?prototype=lab')
  await page.getByRole('button', { name: 'Nivel 3 — Polirritmia' }).click()

  const progressA = page.getByTestId('progress-track-a')
  const progressB = page.getByTestId('progress-track-b')
  const widths = async () => Promise.all([
    progressA.evaluate(element => getComputedStyle(element).width),
    progressB.evaluate(element => getComputedStyle(element).width),
  ])
  const begin = async () => {
    await page.getByRole('button', { name: /^(Iniciar|Reanudar) reproducción$/ }).click()
    await expect(page.getByRole('button', { name: 'Pausar reproducción' })).toBeEnabled()
    await expect.poll(async () => (await widths()).every(width => parseFloat(width) > 0))
      .toBe(true)
  }
  const pause = async () => {
    await page.getByRole('button', { name: 'Pausar reproducción' }).click()
    await expect(page.getByRole('button', { name: 'Reanudar reproducción' })).toBeEnabled()
    const frozen = await widths()
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() =>
      requestAnimationFrame(resolve)
    )))
    expect(await widths()).toEqual(frozen)
  }

  for (const mode of [
    'Polirritmia — B se estira/comprime',
    'Polimetría — corchea=corchea',
    'Morph — crossfade de ganancia',
    'Clave — 6 patrones tradicionales',
  ]) {
    const modeButton = page.getByRole('button', { name: mode })
    await modeButton.click()
    await expect(modeButton).toHaveAttribute('aria-pressed', 'true')

    await begin()
    await pause()
    const bpm = page.getByRole('spinbutton', { name: 'Valor numérico BPM' })
    await bpm.fill('200')
    const frozenAfterTempoChange = await widths()
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() =>
      requestAnimationFrame(resolve)
    )))
    expect(await widths()).toEqual(frozenAfterTempoChange)
  }

  const clave = page.getByRole('button', { name: 'Son 3-2' })
  await expect(clave).toBeVisible()
  await clave.click()
  await expect(clave).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Reiniciar ciclo' }).click()
  await expect(page.getByTestId('progress-track-a')).toHaveCSS('width', '0px')
  await expect(page.getByTestId('progress-track-b')).toHaveCSS('width', '0px')
})
