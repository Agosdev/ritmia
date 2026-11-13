export const MAIN_TOUR_STEPS = [
  {
    target: 'preset',
    title: 'Elegí un ritmo',
    description: 'Buscá un ritmo por nombre o estilo. Ritmia configura un patrón para empezar.',
  },
  {
    target: 'sequencer',
    title: 'Probá los golpes',
    description: 'Cada casillero representa un momento del ritmo. Al tocarlo, cambia entre silencio, suave y fuerte.',
  },
  {
    target: 'bpm',
    title: 'Cambiá la velocidad',
    description: 'BPM indica qué tan rápido suena el ritmo. Cuanto más alto el número, más rápido va.',
  },
  {
    target: 'instruments',
    title: 'Elegí los instrumentos',
    description: 'Ritmia sugiere sonidos para cada estilo, pero podés cambiarlos cuando quieras.',
  },
  {
    target: 'transport',
    title: 'Escuchá tu creación',
    description: 'Tocá Reproducir para escuchar. Podés detener el ritmo o reiniciarlo.',
  },
]

export const TWO_TRACK_TOUR_STEPS = [
  {
    target: 'tracks',
    title: 'Combiná dos ritmos',
    description: 'A y B pueden sonar al mismo tiempo. Elegí patrones e instrumentos para cada pista.',
  },
  {
    target: 'modes',
    title: 'Explorá sus relaciones',
    description: 'Probá compartir un ciclo, usar compases independientes, mezclar las pistas o cargar una clave en B.',
  },
]

export const TOUR_STORAGE_KEYS = {
  dismissed: 'ritmia-learning-tour-dismissed-v1',
  completed: 'ritmia-learning-tour-completed-v1',
}
