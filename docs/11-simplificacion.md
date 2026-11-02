# Tarea 11 — dos niveles y pulido neón

## Diagnóstico y respaldo

Trabajo local en `main`, HEAD inicial `bf35f1e902eb2afd66c90bf3f3444c9fc7779aad`, estado inicial limpio. Respaldo anterior a los cambios: `/private/tmp/ritmia-task11-backup/workspace.tar.gz`, 104 archivos versionados o nuevos no ignorados. Cada miembro se contrastó por SHA-256 con el archivo original. Manifest y hash del archivo comprimido acompañan al respaldo. Build original independiente en `/private/tmp/ritmia-task11-before`.

## Producto

Solo nivel 1 (Ritmo, A) y nivel 2 (Dos ritmos, A/B). Se actualizaron validación, contexto, condiciones de audio/Morph, descripciones, navegación, accesibilidad, pruebas y scripts. El secuenciador comparte una única plantilla de encabezado/grilla para A y B, con el mismo BeatGrid y tipografía. Se conservan superficies neumórficas y transporte. Tokens reutilizables `neon.A` (cian), `neon.B` (magenta), `neon.success` (verde), utilizados en pequeñas marcas y selección; etiquetas/formas mantienen información sin color.

Agrupaciones siempre fueron visuales: el motor recibe los acentos, no los grupos. Se movieron al desplegable final del nivel 1. La acción explícita refuerza solo comienzos no silenciosos, conserva otros golpes y permite editar después. Un grupo cuyo comienzo está en silencio no agrega un ataque; se explica en pantalla. B conserva sus marcas visuales en un desplegable avanzado.

Preset = punto de partida editable de A (compás, golpes, grupos) y BPM compartido. No configura B ni el modo. Modo = relación A/B. Polirritmia, Polimetría, Morph y Clave siguen presentes. El denominador B solo es editable cuando afecta su duración (Polimetría). Clave anuncia la carga de un patrón, fija tamaño/denominador y restaura el patrón anterior de B al salir; sus golpes pueden editarse. Las duraciones canónicas/adaptadas están explicadas sin cambiar fórmulas.

## Código y dependencias retiradas

Se eliminaron `OptionalMusicVisualizer.jsx`, los ocho módulos exclusivos de `visualizer/physical/` (renderizadores Bounce/Orbit, canvas, bucle y adaptación musical), imports dinámicos, selector y activación. También pruebas exclusivas físicas, suite de visualizadores opcionales, script de medición y documentación de esos efectos. Se retiró `three@0.187.0` de package.json, lockfile y node_modules, junto a su licencia local; no tenía dependencias transitivas propias. Se conservaron BeatGrid, visualizador clásico, realtime context, reloj AudioContext, eventos programados y pruebas musicales.

## Validación y evidencia

Node 22.16.0. Las pruebas cubren precisión temporal, silencios, acentos, volúmenes, reproducción/pausa/reinicio, muestras acústicas, claves y relaciones musicales. Se añadieron aplicación explícita de grupos, presets en cada modo, restauración de B y rechazo del nivel 3. No se modificó timingCalculator ni patrones/presets musicales ni muestras.

Cuatro capturas exclusivamente en `/private/tmp/ritmia-11-evidence/`: niveles 1/2 a 1280 y 375 px. `index.html` permite revisarlas; `screenshots.json` registra errores de consola y respuestas. Responsive/teclado también se prueban a 320 y 768 px. Los logs y el detalle de tamaños se conservan en `/private/tmp/ritmia11-*.log` y `bundle.json` en la carpeta de evidencia.

Pendiente: revisión visual de la usuaria y escucha humana final. Las pruebas automatizadas no sustituyen esa escucha. Sin commit, push ni publicación.

## Resultados finales

- `npm test`: 175 pruebas, 16 archivos, todos aprobados.
- `npm run build`: correcto, 74 módulos transformados.
- `npm run test:e2e -- --workers=2`: 26 pruebas aprobadas con Chrome local (1,9 min).
- `git diff --check`: sin errores.
- Capturas: exactamente cuatro; sin errores de consola ni respuestas HTTP fallidas.

Medición de archivos JavaScript emitidos (bytes reales del filesystem; gzip Python nivel 9 aplicado idénticamente a ambos builds):

| Métrica | Antes | Después |
| --- | ---: | ---: |
| Entrada inicial JS | 265.023 | 262.079 |
| Entrada inicial gzip | 82.939 | 82.075 |
| Total JS, incluidos chunks opcionales | 1.028.706 | 262.079 |
| Total gzip | 278.337 | 82.075 |

Reducción total JS: 74,52%; gzip total: 70,51%. La entrada inicial baja 1,11% sin comprimir y 1,04% gzip: los chunks opcionales anteriores no formaban parte de la descarga inicial. HTML, CSS y audio quedan fuera de esta comparación. Las cifras gzip de Vite pueden variar por el método de compresión; `bundle.json` conserva el método uniforme de comparación.

Estado final: `main`, mismo HEAD inicial, modificaciones y eliminaciones locales más este informe nuevo. Sin staging, commit, push ni despliegue. No se detectaron fallos pendientes en las suites; quedan revisión visual y escucha humana.
