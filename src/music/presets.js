import { POPULAR_PRESETS } from './popularPresets'
// Pedagogical reductions, not transcriptions of songs. BPM always means quarter notes/min.
const labels12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
// Internal 12/4 grid: one quarter note per counted position, as in the existing bulerías.
// These are editable practice models; suggested tempos do not define a palo.
function twelveCount(id, name, bpm, grouping, strong, labels = labels12, description = '') {
  return { id, name, family: 'flamenco', recommendedInstrument: 'palmas', num: 12, den: 4, bpm, grouping, labels,
    accents: labels.map(n => strong.includes(n) ? 2 : 1),
    description: `Modelo pedagógico de 12 posiciones iguales, una negra por cuenta. ${description} La rejilla interna 12/4 no es una transcripción convencional del palo.` }
}
const seguiriyaLabels = Array.from({ length: 12 }, (_, i) => i + 1)
const seguiriyaStrong = [1, 3, 5, 8, 11]

// Arabic-family practice reductions. Sources and variant choices: docs/arabic-rhythms.md.
// Meter is independent of the equal subdivisions per written beat.
function arabic(id, name, num, den, bpm, subdivision, pattern, grouping, variant) {
  const strokes = pattern.split(' ')
  return { id, name, family: 'arabe', recommendedInstrument: 'darbuka', num, den, bpm, subdivision, strokes,
    accents: strokes.map(stroke => stroke === 'D' ? 2 : stroke === '-' ? 0 : 1),
    grouping,
    description: `${num}/${den}; ${num * subdivision} posiciones de 1/${den * subdivision}. ${variant} Esqueleto de práctica sin adornos. D = DUM, T = TAK, K = KA; guion = silencio. La articulación audible depende del instrumento elegido.` }
}

export const MUSICAL_PRESETS = [
  { id: 'bulerias', name: 'Bulerías', family: 'flamenco', recommendedInstrument: 'palmas', num: 12, den: 4, bpm: 180,
    accents: labels12.map(n => [12, 3, 6, 8, 10].includes(n) ? 2 : 1), labels: labels12,
    grouping: '3+3+2+2+2', description: 'Modelo pedagógico: 12 posiciones iguales, una negra por cuenta. Acentos 12, 3, 6, 8 y 10. El 12/4 es la rejilla interna, no una transcripción convencional de bulerías.' },
  { id: 'bulerias-7', name: 'Bulerías — variante en 7', family: 'flamenco', recommendedInstrument: 'palmas', num: 12, den: 4, bpm: 180,
    accents: labels12.map(n => [12, 3, 7, 8, 10].includes(n) ? 2 : 1), labels: labels12,
    grouping: '3+4+1+2+2', description: 'Variante pedagógica con acento en 7 en lugar de 6; misma duración y conteo desde 12.' },
  { id: 'tangos', name: 'Tangos flamencos', family: 'flamenco', recommendedInstrument: 'palmas', num: 4, den: 4, bpm: 100,
    accents: [0, 2, 1, 2], grouping: '2+2',
    description: 'Reducción de palmas: primer tiempo vacío, apoyos en 2 y 4 y un golpe suave en 3. No representa todos los acompañamientos de tangos.' },
  { id: 'marcato', name: 'Tango argentino — Marcato en cuatro', family: 'tango', recommendedInstrument: 'acoustic', num: 4, den: 4, bpm: 112,
    accents: [2, 2, 2, 2], grouping: '2+2',
    description: 'Cuatro negras igualmente marcadas. Reducción rítmica sin anticipaciones, articulación instrumental ni armonía.' },
  twelveCount('martinete', 'Martinete', 80, '2+2+3+3+2', seguiriyaStrong, seguiriyaLabels,
    'Adaptación al compás de seguiriya para el baile; no reproduce el cante libre de martinete.'),
  twelveCount('solea', 'Soleá', 90, '3+3+2+2+2', [12, 3, 6, 8, 10]),
  twelveCount('solea-por-bulerias', 'Soleá por bulerías', 140, '3+3+2+2+2', [12, 3, 6, 8, 10]),
  twelveCount('alegrias', 'Alegrías', 130, '3+3+2+2+2', [12, 3, 6, 8, 10]),
  twelveCount('seguiriyas', 'Seguiriyas', 80, '2+2+3+3+2', seguiriyaStrong, seguiriyaLabels,
    'Conteo desde 1; apoyos en los comienzos de los grupos 2+2+3+3+2.'),
  twelveCount('guajiras', 'Guajiras', 110, '3+3+2+2+2', [12, 3, 6, 8, 10], labels12,
    'Los grupos 3+3 y 2+2+2 representan la alternancia de agrupación 6/8 y 3/4 sobre subdivisiones iguales.'),
  { id: 'tientos', name: 'Tientos', family: 'flamenco', recommendedInstrument: 'palmas', num: 4, den: 4, bpm: 65,
    accents: [0, 2, 1, 2], grouping: '2+2',
    description: 'Modelo editable en 4/4, basado en las palmas de tangos a un tempo más pausado. Sin microtiming ni articulación del cante.' },
  { id: 'rumba-flamenca', name: 'Rumba flamenca', family: 'flamenco', recommendedInstrument: 'cajon-palmas', num: 4, den: 4, bpm: 110,
    accents: [1, 2, 1, 2], grouping: '2+2',
    description: 'Base pedagógica en 4/4 con apoyos en 2 y 4. No reproduce el rasgueo ni las síncopas de un acompañamiento de rumba.' },
  { id: 'farruca', name: 'Farruca', family: 'flamenco', recommendedInstrument: 'cajon', num: 4, den: 4, bpm: 100,
    accents: [2, 1, 2, 1], grouping: '2+2',
    description: 'Base pedagógica en 4/4 con apoyos en 1 y 3. Patrón editable, sin representar frases de baile ni acompañamiento completo.' },
  { id: 'sevillanas', name: 'Sevillanas', family: 'flamenco', recommendedInstrument: 'palmas', num: 3, den: 4, bpm: 140,
    accents: [2, 1, 1], grouping: '3',
    description: 'Base pedagógica en 3/4: primer tiempo fuerte y dos suaves. No reproduce la estructura completa de una sevillana.' },

  // Named skeletal variants, without ornamental fills; BPM = quarter notes/min.
  arabic('maqsum', 'Maqsum', 4, 4, 100, 2, 'D T - T D - T -', '1+1+1+1', 'Base de Maqsum.'),
  arabic('baladi', 'Baladi', 4, 4, 92, 2, 'D D - T D - T -', '1+1+1+1', 'Masmoudi Saghir: dos DUM en el primer tiempo.'),
  arabic('saidi', 'Saidi', 4, 4, 90, 2, 'D T - D D - T -', '1+1+1+1', 'Variante con DUM al final del segundo tiempo y al comienzo del tercero.'),
  arabic('malfuf', 'Malfuf', 2, 4, 120, 4, 'D - - T - - T -', '1+1', 'Base de Malfuf; ataques separados por 3+3+2 semicorcheas.'),
  arabic('ayoub', 'Ayoub', 2, 4, 76, 4, 'D - - K D - T -', '1+1', 'Ayoub con KA antes del segundo tiempo, sin tresillos.'),
  arabic('masmoudi-kabir', 'Masmoudi Kabir', 8, 4, 60, 1, 'D D - T D - T -', '4+4', 'Base de dos DUM iniciales, sin rellenos.'),
  arabic('chiftetelli', 'Chiftetelli', 8, 4, 72, 2, 'D - - T - - T - D - D - T - - -', '4+4', 'Variante lenta turca/griega en ocho tiempos, sin rellenos; incluida en esta familia por afinidad de repertorio.'),
  arabic('wahda', 'Wahda', 4, 4, 72, 2, 'D - - T - - T -', '1+1+1+1', 'Wahda Sogayara: un solo DUM inicial (variante de Nesma y Khamis Henkesh).'),
  arabic('fallahi', 'Fallahi', 2, 4, 108, 4, 'D T - T D - T -', '1+1', 'Base comprimida de Maqsum en dos tiempos; TAK representa aquí también la articulación ZAK, no disponible en el audio.'),
  arabic('karsilama', 'Karsilama', 9, 8, 96, 1, 'D - T - D - T T T', '2+2+2+3', 'Variante turca de nueve corcheas, agrupadas 2+2+2+3; incluida por afinidad de repertorio. Sin swing interpretativo.'),
  ...POPULAR_PRESETS,
]
