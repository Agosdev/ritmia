import { expect, test } from '@playwright/test'
for (const width of [320,1280]) test(`grooves populares, kits y teclado ${width}px`,async({page},testInfo)=>{
  test.setTimeout(120_000)
  await page.setViewportSize({width,height:900})
  await page.goto('/')
  const combo=page.getByRole('combobox',{name:'Preset',exact:true})
  const kit=page.getByRole('combobox',{name:'Instrumento pista A',exact:true})
  const state=page.getByRole('status',{name:'Estado instrumento A',exact:true})
  const choose=async id=>{await combo.click();await page.locator(`[role="option"][data-preset-id="${id}"]`).click()}
  for(const [id,num,den,sub,count,bank] of [
    ['pop-clasico',4,4,2,8,'Batería acústica'],['dance-pop',4,4,2,8,'Batería acústica'],
    ['rock-clasico',4,4,2,8,'Batería acústica'],['half-time-rock',4,4,2,8,'Batería acústica'],
    ['blues-shuffle',4,4,3,12,'Batería suave'],['slow-blues',12,8,1,12,'Batería acústica'],
    ['jazz-swing',4,4,3,12,'Batería jazz (ride y pedal)'],['jazz-waltz',3,4,3,9,'Batería jazz (ride y pedal)'],['funk-clasico',4,4,4,16,'Batería acústica']]){
    await choose(id)
    await expect(page.getByLabel('Numerador compás A',{exact:true})).toHaveValue(String(num))
    await expect(page.getByLabel('Denominador compás A',{exact:true})).toHaveValue(String(den))
    await expect(page.getByLabel('Subdivisiones por unidad del compás A',{exact:true})).toHaveValue(String(sub))
    await expect(page.getByRole('group',{name:'Secuenciador pista A',exact:true}).getByRole('button')).toHaveCount(count)
    await expect(state).toHaveText(`Automático · ${bank}`)
  }
  await page.getByRole('button',{name:'Reproducir',exact:true}).click()
  await kit.selectOption('cajon')
  await choose('jazz-swing')
  await expect(state).toHaveText('Manual · Cajón flamenco')
  await kit.selectOption('auto')
  await expect(state).toHaveText('Automático · Batería jazz (ride y pedal)')
  await page.getByRole('button',{name:'Nivel 2 — Dos ritmos',exact:true}).click()
  await page.getByRole('combobox',{name:'Instrumento pista B',exact:true}).selectOption('darbuka')
  await choose('blues-shuffle')
  await expect(page.getByRole('combobox',{name:'Instrumento pista B',exact:true})).toHaveValue('darbuka')
  await combo.focus(); await combo.press('ArrowDown')
  await expect(combo).toHaveAttribute('aria-expanded','true')
  await combo.press('End')
  const last=page.getByRole('listbox',{name:'Presets',exact:true}).getByRole('option').last()
  await expect(combo).toHaveAttribute('aria-activedescendant',await last.getAttribute('id'))
  // Scrolling a list below a stationary mouse must not steal keyboard navigation.
  await page.locator('[role="option"][data-preset-id="jazz-swing"]').dispatchEvent('mouseenter')
  await expect(combo).toHaveAttribute('aria-activedescendant',await last.getAttribute('id'))
  await combo.press('Enter')
  await expect(combo).toHaveValue('Funk clásico')
  await combo.press('Enter'); await combo.press('Escape'); await expect(combo).toBeFocused()
  await page.screenshot({path:testInfo.outputPath('popular.png'),fullPage:true})
  await page.getByRole('button',{name:'Detener reproducción',exact:true}).click()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('buscador táctil del selector y selección por familia sin recorte en móvil',async({browser})=>{
  const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true})
  try {
    const page=await context.newPage()
    await page.goto('/')
    const combo=page.getByRole('combobox',{name:'Preset',exact:true})
    await combo.tap()
    const search=page.getByPlaceholder('Buscar ritmo o estilo...')
    await expect(search).toBeFocused()
    await expect(search).toBeInViewport()
    await search.fill('arabe')
    const maqsum=page.getByRole('option',{name:'Árabe Maqsum',exact:true})
    await expect(maqsum).toBeVisible()
    await maqsum.tap()
    await expect(page.getByRole('combobox',{name:'Preset',exact:true})).toHaveValue('Maqsum')
    await combo.tap()
    const searchAgain=page.getByPlaceholder('Buscar ritmo o estilo...')
    await expect(searchAgain).toHaveValue('')
    const bounds=await searchAgain.boundingBox()
    expect(bounds.y).toBeGreaterThanOrEqual(0)
    expect(bounds.y+bounds.height).toBeLessThan(812)
  } finally { await context.close() }
})
