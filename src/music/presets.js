// Pedagogical reductions, not transcriptions of songs. BPM always means quarter notes/min.
const labels12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
export const MUSICAL_PRESETS = [
  { id: 'bulerias', name: 'Bulerías — ciclo de 12', num: 12, den: 4, bpm: 180,
    accents: labels12.map(n => [12, 3, 6, 8, 10].includes(n) ? 2 : 1), labels: labels12,
    grouping: '3+3+2+2+2', description: 'Modelo pedagógico: 12 posiciones iguales, una negra por cuenta. Acentos 12, 3, 6, 8 y 10. El 12/4 es la rejilla interna, no una transcripción convencional de bulerías.' },
  { id: 'bulerias-7', name: 'Bulerías — variante en 7', num: 12, den: 4, bpm: 180,
    accents: labels12.map(n => [12, 3, 7, 8, 10].includes(n) ? 2 : 1), labels: labels12,
    grouping: '3+4+1+2+2', description: 'Variante pedagógica con acento en 7 en lugar de 6; misma duración y conteo desde 12.' },
  { id: 'tangos', name: 'Tangos flamencos — palmas básicas', num: 4, den: 4, bpm: 100,
    accents: [0, 2, 1, 2], grouping: '2+2',
    description: 'Reducción de palmas: primer tiempo vacío, apoyos en 2 y 4 y un golpe suave en 3. No representa todos los acompañamientos de tangos.' },
  { id: 'marcato', name: 'Tango argentino — Marcato en cuatro', num: 4, den: 4, bpm: 112,
    accents: [2, 2, 2, 2], grouping: '2+2',
    description: 'Cuatro negras igualmente marcadas. Reducción rítmica sin anticipaciones, articulación instrumental ni armonía.' },
]
