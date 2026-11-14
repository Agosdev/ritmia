// Reproducible real Web Audio renders, not a perceptual or cultural authenticity test.
// Requires the Vite dev server; outputs review WAVs and peak measurements outside the repo.
import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
const out=process.env.AUDIO_REVIEW_DIR || path.join(tmpdir(),'ritmia-instruments','listening')
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
try{
  const page=await browser.newPage()
  await page.goto(process.env.AUDIO_REVIEW_URL || 'http://127.0.0.1:5173/')
  const results=await page.evaluate(async()=>{
    const {INSTRUMENTS,resolveInstrumentHits,recommendedInstrument}=await import('/src/audio/instrumentCatalog.js')
    const {loadPitchedInstrumentBank}=await import('/src/audio/instrumentBank.js')
    const {AudioEngine}=await import('/src/audio/AudioEngine.js')
    const {createMasterBus}=await import('/src/audio/masterBus.js')
    const {MUSICAL_PRESETS}=await import('/src/music/presets.js')
    const {BASS_PATTERNS}=await import('/src/music/bassPatterns.js')
    const {calculateTiming}=await import('/src/music/timingCalculator.js')
    const reviewIds=new Set(['maqsum','bulerias','karsilama','pop-clasico','dance-pop','half-time-rock','blues-shuffle','slow-blues','jazz-swing','jazz-waltz','funk-clasico'])
    const cases=[...MUSICAL_PRESETS.map(p=>[`preset-${p.id}`,p.recommendedInstrument??recommendedInstrument(p),p.id]),['maqsum-cajon','cajon','maqsum'],['ayoub-darbuka','darbuka','ayoub'],
      ...Object.keys(INSTRUMENTS).map(id=>[`${id}-stress`,id,null]),
      ['drums-crash-stress','drums',null,'C'], ['cymbals-dense-B','cymbals',null,null,.00234375]]
    const results=[]
    for(const [name,id,presetId,strokeOverride,stepOverride] of cases){
      const preset=MUSICAL_PRESETS.find(p=>p.id===presetId)
      const timing=preset ? calculateTiming({bpm:preset.bpm,numA:preset.num,denA:preset.den,subdivisionA:preset.subdivision??1}) : null
      const step=timing?.stepA ?? stepOverride ?? .0375
      const cycleSeconds=timing?.measureA ?? 3
      const renderSeconds=cycleSeconds+.8
      const ctx=new OfflineAudioContext(2,Math.ceil(48000*renderSeconds),48000)
      const {masterGain,compressor}=createMasterBus(ctx)
      compressor.disconnect()
      const measurementBus=ctx.createChannelMerger(2)
      masterGain.connect(measurementBus,0,0) // pre-compressor reference on channel 0
      compressor.connect(measurementBus,0,1) // actual mastered output on channel 1
      measurementBus.connect(ctx.destination)
      const engine=new AudioEngine()
      engine.ctx=ctx;engine.masterGain=masterGain
      await engine.ensureAcousticSoundBank()
      await engine.prepareInstrument('A',id)
      await engine.prepareInstrument('B',id)
      const bassBank=BASS_PATTERNS[presetId]?await loadPitchedInstrumentBank(ctx,'electricBass'):null
      if(bassBank)engine.pitchedInstrumentBanks.set('electricBass',bassBank)
      let onsets=0,voices=0
      const voiceWindows=[]
      for(let time=.08,index=0;index<(preset?.accents.length??Math.ceil(3/step));time+=step,index++){
        const pos=preset ? index%preset.accents.length : 0
        const accent=preset ? preset.accents[pos] : 2
        for(const track of (preset || stepOverride ? [preset ? 'A' : 'B'] : ['A','B'])){
          const stroke=strokeOverride ?? (preset?.events ? {events:preset.events[pos],referenceAccent:preset.accents[pos]} : preset?.strokes?.[pos])
          if(accent)onsets++
          const played=engine.playTrackHit(track,time,accent,stroke,1)
          voices+=played.length
          played.forEach(voice=>voiceWindows.push(voice))
        }
        const bass=BASS_PATTERNS[presetId]?.events.find(event=>event.position===pos)
        if(bass){
          const voice=engine.playBassNote('A',time,bass,1)
          if(voice){voices++;voiceWindows.push(voice)}
        }
      }
      const sourceOnsets=[...new Set(Array.from(engine.activeVoices,voice=>voice.startTime))].sort((a,b)=>a-b)
      const expectedOnsets=preset?.accents.filter(value=>value!==0).length??null
      const missingOnsets=expectedOnsets===null?null:expectedOnsets-sourceOnsets.length
      if(missingOnsets!==null&&missingOnsets!==0)throw new Error(`${name}: se esperaban ${expectedOnsets} tiempos de ataque únicos y se programaron ${sourceOnsets.length}`)
      const maxVoicesByTrack={}
      for(const track of new Set(voiceWindows.map(voice=>voice.track))){
        const boundaries=voiceWindows.filter(voice=>voice.track===track).flatMap(voice=>[[voice.startTime,1],[voice.endTime,-1]])
          .sort((a,b)=>a[0]-b[0]||a[1]-b[1]) // Half-open intervals: ending voices free capacity before new attacks.
        let active=0,max=0
        for(const [,change] of boundaries){active+=change;max=Math.max(max,active)}
        maxVoicesByTrack[track]=max
      }
      const maxVoices=Math.max(0,...Object.values(maxVoicesByTrack))
      let totalActive=0,maxTotalVoices=0
      for(const [,change] of voiceWindows.flatMap(voice=>[[voice.startTime,1],[voice.endTime,-1]])
        .sort((a,b)=>a[0]-b[0]||a[1]-b[1])){
        totalActive+=change;maxTotalVoices=Math.max(maxTotalVoices,totalActive)
      }
      const rendered=await ctx.startRendering()
      const raw=rendered.getChannelData(0),data=rendered.getChannelData(1)
      let rawPeak=0,rawEnergy=0,rawClippingSamples=0,peak=0,energy=0
      for(let i=0;i<data.length;i++){
        rawPeak=Math.max(rawPeak,Math.abs(raw[i]));rawEnergy+=raw[i]*raw[i]
        if(Math.abs(raw[i])>=.999)rawClippingSamples++
        peak=Math.max(peak,Math.abs(data[i]));energy+=data[i]*data[i]
      }
      // PCM16 is only used for review; inspect float peaks before quantization.
      const pcm=new Int16Array(data.length)
      for(let i=0;i<data.length;i++)pcm[i]=Math.round(Math.max(-1,Math.min(1,data[i]))*32767)
      const bytes=new Uint8Array(pcm.buffer)
      let binary=''
      for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384))
      let tailEnergy=0,tailCount=0,clippingSamples=0
      for(let i=0;i<data.length;i++){
        if(Math.abs(data[i])>=.999)clippingSamples++
        if(i/48000>=cycleSeconds){tailEnergy+=data[i]*data[i];tailCount++}
      }
      const expectedBpm=preset?.bpm??null
      const reviewWav=(preset&&reviewIds.has(preset.id))||['maqsum-cajon','ayoub-darbuka'].includes(name)
      results.push({name,instrument:INSTRUMENTS[id].name,presetId,step,cycleSeconds,onsets,expectedOnsets,scheduledUniqueAttackTimestamps:sourceOnsets.length,missingOnsets,voices,maxVoices,maxVoicesByTrack,maxTotalVoices,rawPeak,rawRms:Math.sqrt(rawEnergy/raw.length),rawClippingSamples,peak,peakLevelChangeDb:rawPeak>0?20*Math.log10(peak/rawPeak):0,rms:Math.sqrt(energy/data.length),tailRms:Math.sqrt(tailEnergy/Math.max(1,tailCount)),clippingSamples,silentGridPositions:preset?.accents.filter(value=>value===0).length??null,reviewWav,bpm:expectedBpm,rate:48000,base64:reviewWav?btoa(binary):null})
    }
    return results
  })
  const measurements=[]
  for(const {base64,...result} of results){
    if(base64){
      const pcm=Buffer.from(base64,'base64'),header=Buffer.alloc(44)
      header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16)
      header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(result.rate,24);header.writeUInt32LE(result.rate*2,28)
      header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40)
      await writeFile(`${out}/${result.name}.wav`,Buffer.concat([header,pcm]))
    }
    measurements.push(result)
  }
  await writeFile(`${out}/measurements.json`,JSON.stringify(measurements,null,2)+'\n')
  console.log(JSON.stringify(measurements,null,2))
  if(measurements.some(r=>r.peak>=.99 || !Number.isFinite(r.peak)))throw new Error('Peak headroom audit failed')
}finally{await browser.close()}
