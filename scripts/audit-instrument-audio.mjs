// Reproducible real Web Audio renders, not a perceptual or cultural authenticity test.
// Requires the Vite dev server; outputs review WAVs and peak measurements outside the repo.
import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
const out=process.env.AUDIO_REVIEW_DIR || '/private/tmp/ritmia-instruments/listening'
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH})
try{
  const page=await browser.newPage()
  await page.goto(process.env.AUDIO_REVIEW_URL || 'http://127.0.0.1:5173/')
  const results=await page.evaluate(async()=>{
    const {INSTRUMENTS,resolveInstrumentHits}=await import('/src/audio/instrumentCatalog.js')
    const {loadInstrumentBank}=await import('/src/audio/instrumentBank.js')
    const {AudioEngine}=await import('/src/audio/AudioEngine.js')
    const {createMasterBus}=await import('/src/audio/masterBus.js')
    const {MUSICAL_PRESETS}=await import('/src/music/presets.js')
    const {calculateTiming}=await import('/src/music/timingCalculator.js')
    const cases=[...MUSICAL_PRESETS.filter(p=>p.events).map(p=>[p.id,p.recommendedInstrument,p.id]),['maqsum-darbuka','darbuka','maqsum'],['maqsum-cajon','cajon','maqsum'],['ayoub-darbuka','darbuka','ayoub'],
      ...Object.keys(INSTRUMENTS).map(id=>[`${id}-stress`,id,null]),
      ['drums-crash-stress','drums',null,'C'], ['cymbals-dense-B','cymbals',null,null,.00234375]]
    const results=[]
    for(const [name,id,presetId,strokeOverride,stepOverride] of cases){
      const preset=MUSICAL_PRESETS.find(p=>p.id===presetId)
      const step=preset ? calculateTiming({bpm:preset.bpm,numA:preset.num,denA:preset.den,subdivisionA:preset.subdivision??1}).stepA : stepOverride ?? .0375
      const ctx=new OfflineAudioContext(1,48000*7,48000)
      const {masterGain}=createMasterBus(ctx)
      const engine=new AudioEngine()
      engine.ctx=ctx;engine.masterGain=masterGain
      await engine.ensureAcousticSoundBank()
      await engine.prepareInstrument('A',id)
      await engine.prepareInstrument('B',id)
      let onsets=0,voices=0
      for(let time=.08,index=0;time<3;time+=step,index++){
        const pos=preset ? index%preset.accents.length : 0
        const accent=preset ? preset.accents[pos] : 2
        for(const track of (preset || stepOverride ? [preset ? 'A' : 'B'] : ['A','B'])){
          if(accent)onsets++
          voices+=engine.playTrackHit(track,time,accent,strokeOverride ?? (preset?.events ? {events:preset.events[pos],referenceAccent:preset.accents[pos]} : preset?.strokes?.[pos]),1).length
        }
      }
      const rendered=await ctx.startRendering()
      const data=rendered.getChannelData(0)
      let peak=0,energy=0
      for(const x of data){peak=Math.max(peak,Math.abs(x));energy+=x*x}
      // PCM16 is only used for review; inspect float peaks before quantization.
      const pcm=new Int16Array(data.length)
      for(let i=0;i<data.length;i++)pcm[i]=Math.round(Math.max(-1,Math.min(1,data[i]))*32767)
      const bytes=new Uint8Array(pcm.buffer)
      let binary=''
      for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384))
      results.push({name,instrument:INSTRUMENTS[id].name,presetId,step,onsets,voices,peak,rms:Math.sqrt(energy/data.length),rate:48000,base64:btoa(binary)})
    }
    return results
  })
  const measurements=[]
  for(const {base64,...result} of results){
    const pcm=Buffer.from(base64,'base64'),header=Buffer.alloc(44)
    header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16)
    header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(result.rate,24);header.writeUInt32LE(result.rate*2,28)
    header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40)
    await writeFile(`${out}/${result.name}.wav`,Buffer.concat([header,pcm]))
    measurements.push(result)
  }
  await writeFile(`${out}/measurements.json`,JSON.stringify(measurements,null,2)+'\n')
  console.log(JSON.stringify(measurements,null,2))
  if(measurements.some(r=>r.peak>=.99 || !Number.isFinite(r.peak)))throw new Error('Peak headroom audit failed')
}finally{await browser.close()}
