# Grooves populares: contrato y referencias

Nueve modelos didácticos, no transcripciones de canciones ni definiciones exhaustivas de géneros. Se mantienen intactos los 24 presets anteriores. BPM siempre significa negras/min, incluso en 12/8. No se modifica el scheduler, reloj ni fórmulas de duración.

Cada celda opcional `events` contiene articulaciones simultáneas con `velocity` independiente. `accents` resume la actividad para la rejilla existente, sin convertir el hi-hat en fuerte por compartir posición con un bombo. Contexto conserva la referencia del acento; una edición manual escala proporcionalmente la celda y cero silencia todos sus eventos. Los presets antiguos siguen usando `strokes` y acentos como antes. El selector de instrumentos cambia únicamente el mapeo acústico.

Posiciones siguientes contadas desde cero:

| Preset | Rejilla | Articulaciones | Kit automático |
|---|---|---|---|
| Pop clásico | 8 corcheas, 4/4 | K 0,4; S 2,6; H todas | Batería |
| Dance Pop | 8 corcheas, 4/4 | K 0,2,4,6; S 2,6; H todas | Batería |
| Rock clásico | 8 corcheas, 4/4 | K 0,1,4,5; S 2,6; H todas | Batería |
| Half-time Rock | 8 corcheas, 4/4 | K 0; S 4; H todas | Batería |
| Blues Shuffle | 12 partes de tresillo, 4/4 | K 0,6; S 3,9; H 0,2,3,5,6,8,9,11 | Batería suave |
| Slow Blues | 12 corcheas, 12/8 | K 0,6; S 3,9; H todas | Batería |
| Jazz Swing | 12 partes de tresillo, 4/4 | Ride 0,3,5,6,9,11; pedal 3,9 | Batería jazz |
| Jazz Waltz | 9 partes de tresillo, 3/4 | Ride 0,3,5,6; pedal 3,6; K 0 | Batería jazz |
| Funk clásico | 16 semicorcheas, 4/4 | K 0,7,8; S 4,12; ghost S 7,9; H todas | Batería |

K=bombo, S=redoblante, H=hi-hat cerrado. Son varias voces reales en el mismo instante, no alternancia entre instrumentos.

## Líneas de bajo afinadas

El patrón de percusión y la línea afinada son datos separados; la capa comparte cada timestamp calculado por la pista y puede desactivarse sin alterar el compás, BPM, subdivisión ni ataques de batería. Las muestras disponibles son G1 (MIDI 31) y D2 (MIDI 38), tocadas sin transposición: tónica y quinta de G menor. Esta paleta de dos notas evita sugerir una tonalidad distinta y no representa progresiones armónicas.

| Preset | Posición (desde cero) | Nota | Función |
|---|---|---|---|
| Funk clásico, 4/4 en semicorcheas | 0, 7, 14 | G1 | Tónica; uno de los ataques coincide con el bombo, los otros son propios del bajo |
|  | 3, 10 | D2 | Quinta sincopada |
| Blues Shuffle, 4/4 en tresillo | 0, 3, 6, 9 | G1 | Tónica en pulsos principales |
|  | 2, 5, 8, 11 | D2 | Quinta en la tercera parte del tresillo, conservando el shuffle 2:1 |
| Slow Blues, 12/8 | 0, 6 | G1 | Tónica en pulsos de negra con puntillo |
|  | 3, 9 | D2 | Quinta en pulsos alternos |

Funk clásico recomienda Automático = batería + bajo. Blues mantiene la recomendación actual de batería suave y ofrece batería + bajo como elección manual. El groove lento tampoco inventa los cambios I–IV–V.

## Fuentes y simplificaciones

- [Berklee: Basic Funk for Drums](https://online.berklee.edu/takenote/basic-funk-for-drums/): figuras Basic Rock, Basic Funk y Shuffle contrastadas visualmente. Rock conserva sus cuatro bombos; funk conserva bombos 1, 2a, 3 y hi-hat de semicorcheas con dinámica menor. Shuffle usa primera y tercera parte del tresillo, no corcheas rectas acentuadas.
- [Drumeo: Four on the Floor](https://www.drumeo.com/beat/how-to-play-4-on-the-floor/): bombo en cada negra, backbeat y hi-hat regular. Pop clásico implementa explícitamente el esqueleto solicitado 1/3 y 2/4.
- [Nate Brown: Here Comes the Half-Time](https://cdn.onlinedrummer.com/2015/06/Here-Comes-The-Half-Time.pdf): ejemplo básico con bombo en 1 y backbeat desplazado a 3. Aquí el hi-hat se subdivide en corcheas; no se transcribe el ejemplo de canción.
- [Vic Firth: Swingin' Easy](https://ae.vicfirth.com/wp-content/uploads/FADrumset-swingin-easy.pdf), lección 25, p.60: primer acompañamiento de ride y pedal. Sin feathering ni comping añadido.
- [Vic Firth: Fresh Approach sampler](https://ae.vicfirth.com/wp-content/uploads/Fresh-Approach-to-Drumset-SAMPLER.pdf), lección 29, p.72: Jazz Waltz combina variación de ride 2, pedal C y bombo D. Es una combinación de ejercicios de tres tiempos, no un 4/4 truncado. Lección 25 también contrasta shuffle ternario y otras variantes.
- Slow Blues: adaptación compuesta del esqueleto shuffle con las tres partes de cada pulso audibles; no se atribuye una transcripción literal a las fuentes. 12/8 agrupado 3+3+3+3; BPM72 negras equivale a 48 negras con puntillo/min.
- [Percussive Arts Society: Ghost Note Funk, Eric C. Hughes](https://pas.org/pas-blog/groove-of-the-month-ghost-note-funk/): ornamentos suaves en 2a y 3e del ejercicio B, combinados aquí con la base Berklee. Esta combinación se declara adaptación. Muestra real de caja suave a .2 frente a .95 del backbeat; no golpes adicionales generados por el kit.

Corcheas rectas dividen en 1:1. Shuffle repite pares 2:1 en cada negra. Swing emplea el patrón de ride con pares ternarios solamente en puntos específicos. Esta aproximación fija 2:1 no modela el swing variable con tempo, fraseo humano, improvisación o microtiming. Jazz Waltz mantiene tres negras por compás. Slow Blues tiene cuatro pulsos compuestos; sus doce corcheas no son doce pulsos principales.

## Mapeos y límites

Batería interpreta kick/snare/ghostSnare/closedHat con muestras reales separadas. Jazz añade ride y pedal reales, sin sustituirlos por crash. Todos los kits pueden elegirse manualmente y conservan cantidad, posición y velocidad de eventos; los kits sin la articulación la proyectan sobre sus timbres disponibles (kick→D, snare/ghost→T, hat/ride/pedal→K). Una darbuka no se convierte así en batería jazz: conserva el ritmo, con pérdida explícita de diferenciación tímbrica. Kits combinados pueden producir dos muestras por evento. No hay escobillas, hi-hat abierto ni choke físico entre articulaciones. Los tails se gestionan con el límite de polifonía ya existente.

A/B conservan selecciones manuales independientes; A automático sigue el preset, B automático conserva su kit libre actual. No se agrega selector de presets B ni mezclador. Las pruebas automáticas comprueban posiciones, muestras y dinámica, no certifican interpretación acústica mediante escucha humana.

## Archivos de esta ampliación

- `src/music/popularPresets.js`, `presets.js`, `timingCalculator.js`: nuevos datos y admisión de tresillos, sin cambiar fórmulas.
- `src/context/RitmiaContext.jsx`: transporte de eventos y etiquetas ternarias/compuestas.
- `src/audio/instrumentCatalog.js`: expansión de voces, dinámicas, proyecciones y kit jazz. `AudioEngine.js` no requiere cambios en esta ampliación.
- `src/components/controls/MusicalPresets.jsx`: tres colores de familia y corrección de hover que interfería con teclado al desplazarse la lista; `TimeSignatureBuilder.jsx`: opción de subdivisión 3.
- `public/audio/instruments/ride.wav`, `pedal-hat.wav`, `manifest.json`: dos muestras CC0 y trazabilidad.
- `scripts/prepare-instrument-samples.py`, `audit-instrument-audio.mjs`: preparación selectiva y renders de grooves simultáneos.
- `docs/audio-sources.md` y este documento.
- `tests/music/popularPresets.test.js`, `tests/context/popularPlayback.test.jsx`: regresiones nuevas. `productClosure.test.jsx` cuenta voces simultáneas; `arabePresets.test.js` deja de tratar la subdivisión 3 como inválida.
- `e2e/popular-presets.spec.js`; `e2e/arabic-presets.spec.js` actualiza el último elemento esperado de la biblioteca ampliada.

## Escucha manual pendiente

1. Comparar Pop clásico, Dance Pop, Rock clásico y Half-time Rock a igual BPM: distinguir los bombos, el backbeat 2/4 y el apoyo único en 3.
2. Contar cuatro negras en Shuffle y Swing: el hi-hat shuffle repite cada par 2:1; el ride swing no toca todos esos pares. En Slow Blues contar cuatro negras con puntillo (48/min con el BPM sugerido), y en Jazz Waltz tres negras.
3. Escuchar funk con auriculares: ghost notes claramente menores que la caja principal, hi-hat ajustado, síncopa en 2a. Comparar con cajón conservando todos los ataques, entendiendo la proyección tímbrica.
4. Cambiar kits durante playback y combinar A/B. Comprobar volumen cómodo, ausencia de clicks percibidos y legibilidad de voces en altavoces de teléfono.
5. Repetir en Safari iOS y Chrome Android físicos: activación por gesto, primera carga, pausa/reanudación y cambios de kit. La emulación Chromium de escritorio no certifica esos dispositivos.

Medición acústica automática: 29 renders reales de Web Audio (nueve grooves y veinte regresiones/estrés), pico global máximo 0,852961, sin clipping en esos casos. No equivale a una evaluación auditiva humana ni garantiza cualquier combinación arbitraria de parámetros.

## Validación de cierre

- `npm test -- --maxWorkers=1 --minWorkers=1 --testTimeout=30000`: **339/339**, **22/22 archivos**, 360,68 s.
- `npm run test:e2e -- --workers=1` con Chrome local: **37/37**, 5,5 min; escritorio y emulación móvil/táctil, contraste, foco y regresión de teclado. Capturas 320/1280 px revisadas visualmente.
- `npm run build`: correcto, 19,85 s; bundle JS 294,60 kB, gzip 92,78 kB.
- `git diff --check`: sin errores.
- Comparación profunda contra respaldo previo: 24 presets anteriores idénticos. Once WAV anteriores idénticos byte por byte.

Incidencias transparentes: el baseline anterior a la edición tuvo 293/294 por timeout de 5 s en una prueba de teclado heredada; una corrida posterior volvió a exceder ese límite bajo carga. El cierre usa 30 s vía CLI, sin eliminar aserciones ni modificar el timeout del proyecto. La primera corrida E2E dio 36/37 e identificó el problema real de hover contra End; tras corregirlo y agregar la regresión, la suite completa dio 37/37. No se hicieron commit ni push.
