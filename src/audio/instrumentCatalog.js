// Instrument choice is separate from musical patterns. One hit plan per existing onset.
const acoustic = {
  kickSoft: 'acoustic/kick-soft.wav', kickStrong: 'acoustic/kick-strong.wav',
  snareSoft: 'acoustic/snare-soft.wav', snareStrong: 'acoustic/snare-strong.wav',
}
const darbuka = { dum: 'instruments/darbuka-dum.wav', tak: 'instruments/darbuka-tak.wav', pa: 'instruments/darbuka-pa.wav' }
const cajon = { bass: 'instruments/cajon-bass.wav', edge: 'instruments/cajon-edge.wav' }
const palmas = { clap: 'instruments/palmas.wav' }
const zills = { zill: 'instruments/finger-cymbals.wav' }
const hats = { hatSoft: 'instruments/hihat-soft.wav', hatStrong: 'instruments/hihat-strong.wav' }
const cymbals = { crash: 'instruments/crash.wav' }

export const INSTRUMENTS = {
  acoustic: { name: 'Kit acústico actual', files: acoustic },
  darbuka: { name: 'Darbuka', files: darbuka, note: 'DUM, TAK y PA. KA comparte la muestra TAK a menor intensidad.' },
  cajon: { name: 'Cajón flamenco', files: cajon },
  palmas: { name: 'Palmas', files: palmas, note: 'Un ataque de palma; sin distinguir sordas y abiertas.' },
  castanets: { name: 'Castañuelas', files: { castanet: 'instruments/castanets.wav' }, note: 'Golpes aislados, sin añadir redobles.' },
  'cajon-palmas': { name: 'Cajón + palmas', files: { ...cajon, ...palmas } },
  zills: { name: 'Crótalos (finger cymbals)', files: zills, note: 'Una grabación de crótalos de dedo; no modela técnicas de danza.' },
  'darbuka-zills': { name: 'Darbuka + crótalos', files: { ...darbuka, ...zills } },
  drums: { name: 'Batería acústica', files: { ...acoustic, ...hats, ...cymbals }, attribution: true,
    note: 'Distribuye los ataques existentes entre bombo, caja y hi-hat; no agrega un acompañamiento.' },
  'drums-soft': { name: 'Batería suave', files: { kickSoft: acoustic.kickSoft, snareSoft: acoustic.snareSoft, hatSoft: hats.hatSoft }, attribution: true,
    note: 'Capas suaves con baquetas; no son escobillas.' },
  'drums-jazz': { name: 'Batería jazz (ride y pedal)', attribution: true, files: { ...acoustic, hatSoft: hats.hatSoft, ride: 'instruments/ride.wav', pedalHat: 'instruments/pedal-hat.wav' }, note: 'Ride y hi-hat de pedal reales, con baquetas; sin escobillas.' },
  kick: { name: 'Bombo', files: { kickSoft: acoustic.kickSoft, kickStrong: acoustic.kickStrong } },
  snare: { name: 'Redoblante', files: { snareSoft: acoustic.snareSoft, snareStrong: acoustic.snareStrong } },
  hihat: { name: 'Hi-hat cerrado', files: hats, attribution: true },
  cymbals: { name: 'Platillo crash', files: cymbals, attribution: true },
}

export const isInstrumentChoice = id => id === 'auto' || Object.hasOwn(INSTRUMENTS, id)
export function recommendedInstrument(preset) {
  if (preset?.recommendedInstrument && Object.hasOwn(INSTRUMENTS, preset.recommendedInstrument)) return preset.recommendedInstrument
  return ({ arabe: 'darbuka', flamenco: 'cajon-palmas', pop: 'drums', jazz: 'drums-jazz', funk: 'drums', rock: 'drums', blues: 'drums-soft', tango: 'acoustic' })[preset?.family] ?? 'acoustic'
}

export function resolveInstrumentHits(id, accent, stroke, track = 'A') {
  if (!accent) return [] // A named articulation must never make a silent cell audible.
  if (!Object.hasOwn(INSTRUMENTS, id)) id = 'acoustic'
  if (Array.isArray(stroke?.events) && stroke.events.length) {
    const scale = (accent === 2 ? 1 : .55) / (stroke.referenceAccent === 2 ? 1 : .55)
    return stroke.events.flatMap(({ articulation, velocity }) => {
      const native = ({ kick: id === 'drums-soft' ? 'kickSoft' : 'kickStrong', snare: id === 'drums-soft' ? 'snareSoft' : 'snareStrong', ghostSnare: 'snareSoft', closedHat: 'hatSoft', ride: 'ride', pedalHat: 'pedalHat' })[articulation]
      if (id.startsWith('drums') && native && INSTRUMENTS[id].files[native]) return [{ sample: native, gain: Math.min(1, velocity * scale) }]
      // Projection preserves every onset and its dynamics, but cannot reproduce missing timbres.
      const legacy = ({ kick: 'D', snare: 'T', ghostSnare: 'T', closedHat: 'K', ride: 'K', pedalHat: 'K' })[articulation]
      return resolveInstrumentHits(id, 2, legacy, track).map(hit => ({ ...hit, gain: hit.gain * Math.min(1, velocity * scale) }))
    })
  }
  const dynamic = accent === 2 ? 1 : .55
  const hit = (sample, gain = dynamic) => [{ sample, gain }]
  switch (id) {
    case 'darbuka':
      return hit(stroke === 'P' ? 'pa' : stroke === 'D' ? 'dum' : ['T', 'K'].includes(stroke) ? 'tak' : accent === 2 ? 'dum' : 'tak', dynamic * (stroke === 'K' ? .7 : 1))
    case 'cajon':
      return hit(stroke === 'D' ? 'bass' : ['T', 'K', 'P'].includes(stroke) ? 'edge' : accent === 2 ? 'bass' : 'edge')
    case 'palmas': return hit('clap')
    case 'castanets': return hit('castanet')
    case 'zills': return hit('zill', dynamic * .75)
    case 'cajon-palmas':
      return [...resolveInstrumentHits('cajon', accent, stroke).map(h => ({ ...h, gain: h.gain * .7 })), { sample: 'clap', gain: dynamic * .45 }]
    case 'darbuka-zills':
      return [...resolveInstrumentHits('darbuka', accent, stroke).map(h => ({ ...h, gain: h.gain * .8 })), { sample: 'zill', gain: dynamic * .35 }]
    case 'drums-jazz':
      return hit(stroke === 'D' ? 'kickSoft' : ['T', 'P'].includes(stroke) ? 'snareSoft' : 'ride', dynamic * .7)
    case 'drums':
      return hit(({ D: 'kickStrong', T: 'snareStrong', K: 'hatSoft', P: 'snareStrong', C: 'crash' })[stroke] ?? (accent === 2 ? 'snareStrong' : 'hatSoft'), dynamic * (stroke === 'C' ? .4 : 1))
    case 'drums-soft':
      return hit(stroke === 'D' ? 'kickSoft' : ['T', 'P'].includes(stroke) || accent === 2 ? 'snareSoft' : 'hatSoft', dynamic * .8)
    case 'kick': return hit(accent === 2 ? 'kickStrong' : 'kickSoft', 1)
    case 'snare': return hit(accent === 2 ? 'snareStrong' : 'snareSoft', 1)
    case 'hihat': return hit(accent === 2 ? 'hatStrong' : 'hatSoft')
    case 'cymbals': return hit('crash', dynamic * .4)
    default: return hit(`${track === 'A' ? 'kick' : 'snare'}${accent === 2 ? 'Strong' : 'Soft'}`, 1)
  }
}
