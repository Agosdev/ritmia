import { expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { INSTRUMENTS } from '../../src/audio/instrumentCatalog'
const root=resolve(process.cwd(),'public/audio')
const manifest=JSON.parse(readFileSync(resolve(root,'instruments/manifest.json')))
it('cada instrumento disponible tiene todos sus archivos locales, sin recursos remotos',()=>{
  for(const kit of Object.values(INSTRUMENTS)) for(const file of Object.values(kit.files)){
    expect(file).not.toMatch(/https?:/)
    expect(existsSync(resolve(root,file))).toBe(true)
  }
})
it.each(manifest.samples)('$file es PCM16 mono, sin clipping, con procedencia y checksum verificables',sample=>{
  const bytes=readFileSync(resolve(root,`instruments/${sample.file}`))
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(sample.sha256)
  expect(bytes.length).toBe(sample.bytes)
  expect(bytes.toString('ascii',0,4)).toBe('RIFF')
  expect(bytes.readUInt16LE(20)).toBe(1)
  expect(bytes.readUInt16LE(22)).toBe(1)
  expect(bytes.readUInt32LE(24)).toBe(44100)
  expect(bytes.readUInt16LE(34)).toBe(16)
  let offset=12,pcm
  while(offset+8<=bytes.length){const size=bytes.readUInt32LE(offset+4);if(bytes.toString('ascii',offset,offset+4)==='data'){pcm=bytes.subarray(offset+8,offset+8+size);break}offset+=8+size+(size%2)}
  expect(pcm).toBeDefined()
  let peak=0
  for(let i=0;i<pcm.length;i+=2)peak=Math.max(peak,Math.abs(pcm.readInt16LE(i))/32768)
  expect(peak).toBeGreaterThan(.45)
  expect(peak).toBeLessThan(.49)
  expect(Math.abs(pcm.readInt16LE(pcm.length-2))).toBeLessThan(3)
  expect(sample.revision).toMatch(/^[a-f0-9]{40}$/)
  expect(sample.sourceSha256).toMatch(/^[a-f0-9]{64}$/)
  expect(['CC0-1.0','CC-BY-4.0']).toContain(sample.license)
})
