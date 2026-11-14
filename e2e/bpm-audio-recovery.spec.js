import { expect, test } from '@playwright/test'

async function selectPreset(page, id) {
  await page.getByRole('combobox', { name: 'Preset', exact: true }).click()
  await page.locator(`[data-preset-id="${id}"]`).click()
}

test('mantiene el BPM manual entre presets y niveles; ofrece el recomendado solo como acción opcional', async ({ page }) => {
  await page.goto('/')
  const bpm = page.getByRole('spinbutton', { name: 'Valor numérico BPM', exact: true })
  await bpm.fill('100')

  for (const [id, suggested] of [['maqsum', '100'], ['funk-clasico', '100'], ['bulerias', '180']]) {
    await selectPreset(page, id)
    await expect(bpm).toHaveValue('100')
    await expect(page.getByText(`Sugerido para este ritmo: ${suggested} BPM`, { exact: true })).toBeVisible()
    if (suggested === '100') await expect(page.getByRole('button', { name: 'Usar BPM sugerido' })).toHaveCount(0)
    else await expect(page.getByRole('button', { name: 'Usar BPM sugerido' })).toBeVisible()
  }

  await page.getByRole('button', { name: 'Nivel 2 — Dos ritmos', exact: true }).click()
  await expect(bpm).toHaveValue('100')
  await page.getByRole('button', { name: 'Nivel 1 — Ritmo', exact: true }).click()
  await expect(bpm).toHaveValue('100')
  await page.getByRole('button', { name: 'Usar BPM sugerido' }).click()
  await expect(bpm).toHaveValue('180')
  await expect(page.getByRole('button', { name: 'Usar BPM sugerido' })).toHaveCount(0)
})

test('BPM y preset se pueden cambiar durante playback sin detener el transporte', async ({ page }) => {
  await page.goto('/')
  const bpm = page.getByRole('spinbutton', { name: 'Valor numérico BPM', exact: true })
  await bpm.fill('100')
  await selectPreset(page, 'maqsum')
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
  const stop = page.getByRole('button', { name: 'Detener reproducción', exact: true })
  await expect(stop).toBeVisible()
  await bpm.fill('112')
  await selectPreset(page, 'funk-clasico')
  await expect(bpm).toHaveValue('112')
  await expect(stop).toBeVisible()
})

test('pausa manual no avisa de error; interrupción del AudioContext permite reanudar en el mismo contexto', async ({ page }) => {
  await page.addInitScript(() => {
    const Native = window.AudioContext || window.webkitAudioContext
    window.__ritmiaAudioContexts = []
    class TrackedAudioContext extends Native {
      constructor(...args) {
        super(...args)
        window.__ritmiaAudioContexts.push(this)
      }
    }
    window.AudioContext = TrackedAudioContext
    if (window.webkitAudioContext) window.webkitAudioContext = TrackedAudioContext
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
  const stop = page.getByRole('button', { name: 'Detener reproducción', exact: true })
  await expect(stop).toBeVisible()

  await stop.click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Detener reproducción', exact: true })).toBeVisible()
  await page.evaluate(async () => window.__ritmiaAudioContexts[0].suspend())
  await expect(page.getByRole('alert')).toContainText('El sonido se interrumpió.')
    await expect(page.getByText('¿No escuchás el ritmo?', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Reanudar sonido', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Detener reproducción', exact: true })).toBeVisible()
  expect(await page.evaluate(() => window.__ritmiaAudioContexts.length)).toBe(1)
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('aviso de inicio puede cerrarse; al reintentar no pierde el preset ni BPM', async ({ page }) => {
  await page.route('**/audio/acoustic/*.wav', route => route.fulfill({ status: 503, body: '' }))
  await page.goto('/')
  const bpm = page.getByRole('spinbutton', { name: 'Valor numérico BPM', exact: true })
  await bpm.fill('105')
  await selectPreset(page, 'maqsum')
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('No pudimos iniciar el sonido.')
  await page.getByRole('button', { name: 'Cerrar aviso de audio' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.unroute('**/audio/acoustic/*.wav')
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Detener reproducción', exact: true })).toBeVisible()
  await expect(bpm).toHaveValue('105')
  await expect(page.getByRole('combobox', { name: 'Preset', exact: true })).toHaveValue('Maqsum')
})

test('avisa de volumen cero solo mientras la pista está silenciada', async ({ page }) => {
  await page.goto('/')
  const volume = page.getByRole('slider', { name: 'Volumen pista A', exact: true })
  await volume.focus()
  await volume.press('Home')
  await expect(page.getByRole('status').filter({ hasText: 'El volumen de esta pista está en cero.' })).toHaveCount(1)
  await volume.press('ArrowRight')
  await expect(page.getByText('El volumen de esta pista está en cero.', { exact: true })).toHaveCount(0)
})
