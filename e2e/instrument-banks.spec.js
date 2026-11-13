import { expect, test } from '@playwright/test'

async function preset(page,id){
  await page.getByRole('combobox',{name:'Preset',exact:true}).click()
  await page.locator(`[role="option"][data-preset-id="${id}"]`).click()
}
async function musical(page){
  return {
    bpm:await page.getByRole('spinbutton',{name:'Valor numérico BPM',exact:true}).inputValue(),
    num:await page.getByLabel('Numerador compás A',{exact:true}).inputValue(),
    den:await page.getByLabel('Denominador compás A',{exact:true}).inputValue(),
    subdivision:await page.getByLabel('Subdivisiones por unidad del compás A',{exact:true}).inputValue(),
    accents:await page.getByRole('group',{name:'Secuenciador pista A',exact:true}).getByRole('button').evaluateAll(els=>els.map(el=>el.dataset.accent)),
  }
}
for(const width of [375,1280]){
  test(`bancos A/B, automático/manual, caché e invariancia musical ${width}px`,async({page})=>{
    test.setTimeout(120_000) // Full multi-kit playback journey on desktop and mobile.
    await page.setViewportSize({width,height:900})
    const requests=[], errors=[]
    page.on('request',r=>{if(/\/audio\/.*\.wav/.test(r.url()))requests.push(r.url())})
    page.on('pageerror',e=>errors.push(e.message))
    await page.goto('/')
    const a=page.getByRole('combobox',{name:'Instrumento pista A',exact:true})
    const stateA=page.getByRole('status',{name:'Estado instrumento A',exact:true})
    await expect(a).toHaveValue('auto')
    await preset(page,'maqsum')
    expect(requests).toHaveLength(0) // Choosing a preset while stopped creates no audio context/downloads.
    await expect(stateA).toHaveText('Automático · Darbuka')
    const before=await musical(page)
    await page.getByRole('button',{name:'Reproducir',exact:true}).click()
    const stop=page.getByRole('button',{name:'Detener reproducción',exact:true})
    await expect(stop).toBeVisible()
    expect(requests).toHaveLength(7) // Four safe fallback samples and three darbuka articulations.
    await a.selectOption('cajon')
    await expect(stateA).toHaveText('Manual · Cajón flamenco')
    expect(await musical(page)).toEqual(before)
    await preset(page,'baladi')
    await expect(a).toHaveValue('cajon')
    await expect(stateA).toHaveText('Manual · Cajón flamenco')
    await a.selectOption('auto')
    await expect(stateA).toHaveText('Automático · Darbuka')
    const afterPreset=await musical(page)
    await a.selectOption('darbuka-zills')
    await expect(stateA).toHaveText('Manual · Darbuka + crótalos')
    expect(await musical(page)).toEqual(afterPreset)
    await page.getByRole('button',{name:'Nivel 2 — Dos ritmos',exact:true}).click()
    const b=page.getByRole('combobox',{name:'Instrumento pista B',exact:true})
    const stateB=page.getByRole('status',{name:'Estado instrumento B',exact:true})
    await expect(b).toHaveValue('auto')
    await b.selectOption('cajon-palmas')
    await expect(stateB).toHaveText('Manual · Cajón + palmas')
    await expect(a).toHaveValue('darbuka-zills')
    const cellsB=page.getByRole('group',{name:'Secuenciador pista B',exact:true}).getByRole('button')
    const patternB=await cellsB.evaluateAll(els=>els.map(el=>el.dataset.accent))
    await a.selectOption('hihat')
    await expect(stateA).toHaveText('Manual · Hi-hat cerrado')
    expect(await cellsB.evaluateAll(els=>els.map(el=>el.dataset.accent))).toEqual(patternB)
    expect(await musical(page)).toEqual(afterPreset)
    await expect(page.getByText(/Drum samples provided by DrumGizmo.org/)).toBeVisible()
    await expect(page.getByRole('link',{name:'CC BY 4.0',exact:true})).toHaveAttribute('href','https://creativecommons.org/licenses/by/4.0/')
    await page.getByRole('button',{name:/^Clave —/}).click()
    await expect(cellsB).toHaveCount(16)
    await expect(b).toHaveValue('cajon-palmas')
    await expect(stop).toBeVisible()
    expect(new Set(requests).size).toBe(requests.length)
    expect(requests.filter(url=>url.includes('cajon-'))).toHaveLength(2)
    await a.focus()
    await expect(a).toHaveCSS('outline-width','3px')
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
    await page.screenshot({path:`/private/tmp/ritmia-instruments/controls-${width}.png`,fullPage:true})
    expect(errors).toEqual([])
  })
}

test('fallo de darbuka conserva playback con aviso y permite reintentar sin cambiar el patrón',async({page})=>{
  test.setTimeout(90_000)
  await page.setViewportSize({width:375,height:900})
  await page.route('**/audio/instruments/darbuka-*.wav',route=>route.fulfill({status:503,body:''}))
  await page.goto('/')
  await preset(page,'maqsum')
  const before=await musical(page)
  await page.getByRole('button',{name:'Reproducir',exact:true}).click()
  await expect(page.getByRole('button',{name:'Detener reproducción',exact:true})).toBeVisible()
  const status=page.getByRole('status',{name:'Estado instrumento A',exact:true})
  await expect(status).toContainText('Se usa el kit acústico actual')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.unroute('**/audio/instruments/darbuka-*.wav')
  await page.getByRole('button',{name:'Reintentar instrumento A',exact:true}).click()
  await expect(status).toHaveText('Automático · Darbuka')
  expect(await musical(page)).toEqual(before)
  await expect(page.getByRole('button',{name:'Detener reproducción',exact:true})).toBeVisible()
})

test('instrumentos usables en contexto táctil y con audio activado por gesto',async({browser})=>{
  const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true})
  try{
    const page=await context.newPage()
    const requests=[]
    page.on('request',r=>{if(/\/audio\/.*\.wav/.test(r.url()))requests.push(r.url())})
    await page.goto('/')
    const a=page.getByRole('combobox',{name:'Instrumento pista A',exact:true})
    await a.selectOption('castanets')
    expect(requests).toHaveLength(0)
    const box=await a.boundingBox()
    expect(box.height).toBeGreaterThanOrEqual(44)
    await page.getByRole('button',{name:'Reproducir',exact:true}).tap()
    await expect(page.getByRole('button',{name:'Detener reproducción',exact:true})).toBeVisible()
    await expect(a).toHaveValue('castanets')
    expect(requests.filter(url=>url.includes('castanets.wav'))).toHaveLength(1)
  }finally{await context.close()}
})
