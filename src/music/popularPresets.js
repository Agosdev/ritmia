// Simultaneous musical events, independent of kit. Sources: docs/popular-grooves.md.
const all = n => Array.from({ length: n }, (_, i) => i)
function groove(id, name, family, num, den, bpm, subdivision, lanes, description, recommendedInstrument = 'drums') {
  const events = Array.from({ length: num * subdivision }, () => [])
  for (const [articulation, positions, velocity] of lanes) for (const position of positions) {
    if (!events[position] || !(velocity > 0 && velocity <= 1)) throw new RangeError('Evento musical inválido')
    events[position].push({ articulation, velocity })
  }
  return { id, name, family, num, den, bpm, subdivision, events, recommendedInstrument,
    accents: events.map(cell => cell.length ? cell.some(e => ['kick', 'snare'].includes(e.articulation)) ? 2 : 1 : 0),
    grouping: den === 8 ? '3+3+3+3' : Array(num).fill(1).join('+'),
    ...(den === 8 ? { labels: all(12).map(i => `${Math.floor(i / 3) + 1}${['', '-ta', '-la'][i % 3]}`) } : {}),
    description: `${description} Modelo didáctico con golpes simultáneos y dinámica por instrumento. BPM = negras/min. La rejilla resume actividad y acentos globales; cambiar de kit conserva cada ataque.` }
}
export const POPULAR_PRESETS = [
  groove('pop-clasico', 'Pop clásico', 'pop', 4, 4, 100, 2,
    [['kick', [0,4], .9], ['snare', [2,6], .85], ['closedHat', all(8), .4]],
    'Corcheas rectas; bombo en 1 y 3, redoblante en 2 y 4.'),
  groove('dance-pop', 'Dance Pop', 'pop', 4, 4, 120, 2,
    [['kick', [0,2,4,6], 1], ['snare', [2,6], .8], ['closedHat', all(8), .4]],
    'Four-on-the-floor: bombo en los cuatro tiempos, backbeat en 2 y 4 y hi-hat en corcheas.'),
  groove('rock-clasico', 'Rock clásico', 'rock', 4, 4, 110, 2,
    [['kick', [0,1,4,5], .9], ['snare', [2,6], 1], ['closedHat', all(8), .45]],
    'Base rock de Berklee: bombos en 1, 1&, 3 y 3&; backbeat 2 y 4; corcheas rectas.'),
  groove('half-time-rock', 'Half-time Rock', 'rock', 4, 4, 90, 2,
    [['kick', [0], .95], ['snare', [4], 1], ['closedHat', all(8), .4]],
    'Medio tiempo: redoblante principal en 3, bombo en 1; se mantienen el 4/4 y las corcheas, sin dividir el BPM.'),
  groove('blues-shuffle', 'Blues Shuffle', 'blues', 4, 4, 96, 3,
    [['kick', [0,6], .7], ['snare', [3,9], .7], ['closedHat', [0,2,3,5,6,8,9,11], .35]],
    'Shuffle ternario 2:1: primera y tercera parte de cada tresillo; backbeat en 2 y 4.', 'drums-soft'),
  groove('slow-blues', 'Slow Blues', 'blues', 12, 8, 72, 1,
    [['kick', [0,6], .65], ['snare', [3,9], .7], ['closedHat', all(12), .3]],
    '12/8 agrupado 3+3+3+3: cuatro pulsos de negra con puntillo y las doce corcheas audibles. 72 negras/min equivalen a 48 pulsos con puntillo/min.'),
  groove('jazz-swing', 'Jazz Swing', 'jazz', 4, 4, 132, 3,
    [['ride', [0,3,5,6,9,11], .45], ['pedalHat', [3,9], .55]],
    'Ride de swing y hi-hat de pedal en 2 y 4; aproximación ternaria fija 2:1, sin comping ni bajo añadido.', 'drums-jazz'),
  groove('jazz-waltz', 'Jazz Waltz', 'jazz', 3, 4, 120, 3,
    [['ride', [0,3,5,6], .4], ['pedalHat', [3,6], .45], ['kick', [0], .3]],
    'Vals jazz en tres tiempos: ride con anticipación ternaria después de 2, pedal en 2 y 3 y bombo ligero en 1 (variantes de Vic Firth).', 'drums-jazz'),
  groove('funk-clasico', 'Funk clásico', 'funk', 4, 4, 100, 4,
    [['kick', [0,7,8], .9], ['snare', [4,12], .95], ['ghostSnare', [7,9], .2], ['closedHat', all(16), .28]],
    'Semicorcheas ajustadas: base funk de Berklee, bombo sincopado en 2a y ghost notes suaves en 2a y 3e basadas en PAS. Adaptación didáctica, sin fills.'),
]
