# Bancos acústicos de Ritmia

## Alcance

Se conservan los cuatro WAV originales de `public/audio/acoustic` sin cambios.
Se conservan los 13 one-shots de percusión agregados anteriormente y se añaden
dos notas afinadas de bajo, locales, sin CDN ni dependencia de audio en runtime.
Los bancos son combinaciones y mapeos de esas muestras; no copias de patrones.
No se certifica la fidelidad interpretativa mediante tests automatizados.

### Fuentes verificadas el 9 de noviembre de 2026

1. **FreePats World Percussion**, versión 2020-09-05, CC0 1.0:
   [página oficial](https://freepats.zenvoid.org/Percussion/world-and-rare-percussion.html),
   [repositorio fijado](https://github.com/freepats/world-percussion/tree/e54eb2912a0d6d4444ab205d52f778e27da0fc96).
   Grabaciones de Xavimart (Javier), Gonzalo y Roberto; palmas grabadas por
   Roberto. El README identifica las articulaciones de darbuka como doom, tak
   y pa. No se ha incluido la fotografía, que tiene otra licencia.
2. **FreePats MuldjordKit**, versión 2020-10-18, CC BY 4.0:
   [página oficial](https://freepats.zenvoid.org/Percussion/acoustic-drum-kit.html),
   [repositorio fijado](https://github.com/freepats/muldjordkit/tree/719fe72bc6693b94f1229674e202881145ab44ed).
   Grabaciones de Lars Muldjord, adaptación FreePats de Roberto.
   Solo se toman dos hi-hats cerrados y un crash; bombo/caja se reutilizan del kit actual.
3. **Versilian Community Sample Library**, CC0 1.0:
   [página oficial](https://versilian-studios.com/vcsl/),
   [repositorio fijado](https://github.com/sgossner/VCSL/tree/c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e).
   `Finger Cymbals/Fing_Cymb.wav`, Versilian Studios LLC. Se identifica como
   crótalos de dedo, distintos de castañuelas. La fuente no acredita una técnica
   regional de sagat, y Ritmia no la atribuye. No son crotales orquestales afinados
   disparados como sustituto de zills.
4. **Kit existente**, CC0 1.0, Virtuosity Drums / Versilian Studios LLC,
   interpretación de Austin McMahon. Se mantienen manifiesto, licencia, revisión
   y archivos existentes en `public/audio/acoustic`.

### Archivos seleccionados

| WAV distribuido | Archivo original | Licencia |
| --- | --- | --- |
| darbuka-dum.wav | World: `samples/Darbuka/doom_01_01.flac` | CC0 |
| darbuka-tak.wav | World: `samples/Darbuka/tak_02_01.flac` | CC0 |
| darbuka-pa.wav | World: `samples/Darbuka/pa_03_01.flac` | CC0 |
| cajon-bass.wav | World: `samples/CajonFlamenco/106.flac` | CC0 |
| cajon-edge.wav | World: `samples/CajonFlamenco/101.flac` | CC0 |
| palmas.wav | World: `samples/HandClap/01_02.flac` | CC0 |
| castanets.wav | World: `samples/Castanets/01.flac` | CC0 |
| hihat-soft.wav | Muldjord: `samples/HihatClosed/1-HihatClosed.flac` | CC BY 4.0 |
| hihat-strong.wav | Muldjord: `samples/HihatClosed/20-HihatClosed.flac` | CC BY 4.0 |
| crash.wav | Muldjord: `samples/CrashL/3-CrashL.flac` | CC BY 4.0 |
| finger-cymbals.wav | VCSL: `Idiophones/Struck Idiophones/Finger Cymbals/Fing_Cymb.wav` | CC0 |

El SFZ distingue los grupos de cajón 1 y 2, sin nombrar grave/agudo.
La asignación se cotejó mediante energía espectral: 106 tiene aproximadamente
95% de energía bajo 350 Hz frente a 45% de 101. Es una comprobación técnica,
no una evaluación auditiva profesional de técnica flamenca.

### Preparación y distribución

`scripts/prepare-instrument-samples.py` descarga únicamente los originales
seleccionados desde revisiones fijadas. Herramientas de desarrollo: Python,
NumPy y SoundFile; no se agregan al cliente ni a package.json. Uso:

```
python3 scripts/prepare-instrument-samples.py --source-dir /tmp/ritmia-sources
```

Transformaciones: promedio mono, eliminación de padding inicial casi silencioso
con 3 ms de margen, conversión a 44,1 kHz con sinc de ventana de 64 coeficientes
cuando corresponde, recorte de silencio final, cola limitada y fade coseno de
30 ms (120 ms para los metales largos), pico 0,48 y WAV PCM16.
Los crótalos también reciben eliminación de DC y filtro pasaaltos de primer orden
a 120 Hz para reducir ruido grave. El crash se limita a 3 s y los crótalos a
2,5 s: se acortan sus resonancias; no se añaden ataques.

El [manifiesto distribuido](../public/audio/instruments/manifest.json) contiene
URL y revisión de origen, SHA-256 del original y del WAV, duración, bytes,
licencia, autor y transformaciones por archivo. Las tres licencias se incluyen
junto al manifiesto. Audio adicional: **1.071.776 bytes**; directorio completo,
incluidas licencias y manifiesto: **1.117.963 bytes**. Los nuevos WAV ocuparían
2.142.408 bytes como PCM float mono a 44,1 kHz; Web Audio puede remuestrearlos
a la frecuencia del dispositivo al decodificarlos.

### Atribución visible

Los selectores muestran, al elegir batería, batería suave, hi-hat o crash:
Lars Muldjord, FreePats, enlace a CC BY 4.0, aviso de mono/recorte/nivel y el
crédito solicitado en el README: **Drum samples provided by DrumGizmo.org.**
La licencia completa se conserva en `LICENSE-Muldjord-CC-BY-4.0.txt`.
Los créditos deben acompañar también una futura función de exportación de audio.

## Recomendaciones

Cada preset tiene `recommendedInstrument`, separado de métrica, BPM,
subdivisión, strokes, acentos y grupos. Se conservan todos los patrones previos.

| Presets actuales | Recomendación |
| --- | --- |
| Diez de la familia Árabe | Darbuka |
| Bulerías y variante, Martinete adaptado, Soleá, Soleá por bulerías, Alegrías, Seguiriyas, Guajiras, Tangos, Tientos, Sevillanas | Palmas |
| Rumba flamenca | Cajón + palmas |
| Farruca | Cajón |
| Tango argentino — Marcato | Kit acústico actual |
| Compás libre A y B | Kit acústico actual |

Son sugerencias de estudio, no afirmaciones de que un palo se acompañe siempre
con ese instrumento. Martinete conserva su adaptación rítmica para baile;
no se convierte el cante libre en una interpretación auténtica con palmas.
Para tango se contrastó, entre otras referencias, la formación publicada por
[Joaquín Amenábar](https://joaquinamenabar.com/joaquin/orquesta/): bandoneones,
violines, piano y contrabajo. Esa referencia no justifica convertir sus ataques
melódicos en golpes genéricos de este secuenciador. Se conserva, como decisión
pedagógica de estudio, el kit actual; no se afirma que reproduzca la sonoridad
de una orquesta típica. No se añaden ataques de bandoneón o contrabajo al tango.
En este checkout no hay presets Rock o Blues: el catálogo prepara recomendaciones
por familia `rock → drums`, `blues → drums-soft` para futuros presets, sin inventarlos.

## Mapeos y límites

La intensidad 0 siempre produce cero voces, aunque exista un stroke D/T/P.
Los strokes desconocidos o ausentes usan el mapeo fuerte/suave del banco.
Una elección instrumental nunca crea una posición ni cambia el reloj.

| Banco | Correspondencia |
| --- | --- |
| Kit actual | A: bombo fuerte/suave; B: caja fuerte/suave, exactamente como antes |
| Darbuka | D → DUM; T → TAK; K → misma muestra TAK a 70% de su ganancia; P → PA. Sin stroke: fuerte → DUM, suave → TAK |
| Cajón | D/fuerte genérico → grave; T/K/P y suave genérico → agudo |
| Palmas | Misma palma, dos intensidades; no distingue sordas/abiertas |
| Castañuelas | Un golpe aislado, dos intensidades; sin carretillas ni redobles automáticos |
| Crótalos | Un golpe de finger cymbals con dos intensidades y cola recortada; no técnica tradicional de danza |
| Cajón + palmas / Darbuka + crótalos | Dos capas en el mismo timestamp de cada ataque, con ganancias reducidas; no se insertan golpes temporales |
| Batería | D → bombo; T/P → caja; K → hi-hat; C → crash. Sin stroke: fuerte → caja, suave → hi-hat |
| Batería suave | D → capa suave de bombo; T/P/fuerte genérico → caja suave; resto → hi-hat suave; ganancia reducida |
| Bombo / Redoblante / Hi-hat / Crash | Instrumento individual con capas o ganancias fuerte/suave |

Los presets árabes actuales no contienen P: disponer de PA no autoriza a
introducirlo. KA no se transforma en PA. El editor libre actual sigue editando
acentos, no nombres de articulación. Al quitar un preset conserva los strokes
existentes para que una elección manual de darbuka siga sonando igual.
El kit de batería es una selección compacta de bombo, caja, hi-hat cerrado y
crash: no genera grooves completos ni contiene todos los toms/platos de un kit real.
La opción suave usa baquetas y capas suaves; no promete escobillas o swing.

Pendientes: riq, escobillas, guitarra percutiva apagada y técnicas/muestras
específicas adicionales de sagat. Se investigaron FreePats, VCSL y resultados
individuales de Freesound; no se incorporaron samples sin una identificación y
proveniencia suficientes para ese uso. Ninguno aparece como opción vacía.

## Automático/manual, A/B y transiciones

- A inicia en Automático y sigue `recommendedInstrument` del preset. Quitar el
  preset en Automático recomienda el kit actual; la música conserva su estructura.
- Manual permanece al cambiar de preset, modo o nivel. Elegir Automático vuelve
  a la recomendación vigente. No hay persistencia tras recargar la página.
- B conserva su configuración libre o Clave. Tiene su propio selector de
  instrumento y Automático usa el kit actual. No se añade un selector de presets
  B, ni se cambian sus métricas, subdivisiones o modos para esta función.
- Cambiar instrumentos no desbloquea A, modifica BPM, acentos, grupos, compases,
  subdivisiones, mezclas de Morph ni fórmulas de duración/reencuentro.
- La carga no crea AudioContext antes del primer gesto de reproducción. Después
  se cargan solo los instrumentos seleccionados y el kit seguro de cuatro
  muestras, requerido también por la marcación. B no carga su banco en Nivel 1.
- Promesas y AudioBuffers se comparten por archivo y AudioContext, también entre
  A/B y combinaciones. Los fallos se eliminan de caché para permitir reintentos;
  las cargas tardías no sustituyen una elección nueva ni reviven un contexto cerrado.
- Durante una carga, continúa el instrumento anterior. Al terminar se cancelan
  únicamente los eventos futuros de esa pista; se conserva el primer timestamp
  pendiente y su contador, y se desvanecen sus colas previas durante 15 ms.
  La otra pista conserva sus voces. Las colas se limitan a 32 voces por pista
  (más fades breves de 5 ms); se acorta la resonancia más antigua sin quitar
  ataques nuevos. Volver a Nivel 1 desvanece las colas de B en 15 ms.
  Se mantiene el scheduler de 25 ms/lookahead
  100 ms y el bus maestro existente.
- Si falla un banco opcional, se usa el kit actual con estado accesible no
  intrusivo y botón de reintento. Si tampoco carga el kit actual, se conserva
  el error de transporte con Reintentar audio; no se simula sonido ni se inicia
  una reproducción silenciosa.

## Escucha manual requerida

1. Maqsum, Baladi y Saidi con darbuka: identificar DUM/TAK y comparar ataques;
   Ayoub: comprobar KA de enlace con el mismo timbre TAK a menor intensidad.
2. Cambiar darbuka → cajón → palmas → crótalos durante playback: escuchar que
   permanezcan los silencios y la fase, sin dobles ataques o clicks de transición.
3. Comparar grave/agudo de cajón, ataque de palmas y golpe aislado de castañuelas
   con referencias reales; valorar si las colas y niveles son cómodos.
4. Probar A/B con instrumentos distintos, incluidos Morph y Clave; combinar
   crótalos o crash con A/B al volumen máximo para revisar picos y fatiga.
5. Escuchar baquetas suaves frente a batería normal sin interpretarlas como
   escobillas. Evaluar el recorte de resonancia en metales con auriculares.
6. En Safari de iPhone y Chrome Android físicos: primer gesto, pausa/reanudación,
   suspensión al bloquear pantalla, cambios rápidos de banco y carga fallida.
   Las pruebas Chromium de escritorio/contexto táctil no sustituyen estos dispositivos.

## Verificación de audio renderizado

`scripts/audit-instrument-audio.mjs` usa el bus maestro y los golpes del motor
con OfflineAudioContext real en Chrome, a 48 kHz. Genera WAVs de revisión y
`measurements.json` fuera del repositorio. Con el servidor Vite activo:

```
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node scripts/audit-instrument-audio.mjs
```

Se verificaron 19 renders: Maqsum con darbuka y cajón, Ayoub con darbuka,
los 14 instrumentos en mezcla A/B densa, crash explícito de batería y B a
0,00234375 s por posición (1.246 ataques). Pico máximo medido: **0,852961**
(aproximadamente −1,38 dBFS). El primer render descubrió sobrepaso de 0 dBFS
en crash denso; se corrigió su ganancia y se repitió la medición con límite de
colas. Esto verifica margen de estos casos de prueba, no toda combinación
posible ni la fidelidad perceptiva/cultural de las interpretaciones.

Los WAVs de revisión quedan por defecto en `/private/tmp/ritmia-instruments/listening`.
No se distribuyen con la aplicación. Comparar especialmente
`maqsum-darbuka.wav` y `maqsum-cajon.wav`: conservan los mismos ataques y tiempos.

## Archivos de esta implementación

- `src/audio/instrumentCatalog.js`, `instrumentBank.js`: catálogo, recomendaciones
  de familia, mapeos y caché por archivo/contexto.
- `src/audio/AudioEngine.js`, `instruments.js`, `soundBank.js`: selección por pista,
  fallback, reemplazo de eventos futuros, fades y límite de colas; API acústica previa conservada.
- `src/context/RitmiaContext.jsx`, `src/music/presets.js`: elecciones A/B,
  recomendaciones y articulaciones separadas del patrón.
- `src/components/controls/InstrumentSelect.jsx`, `src/components/layout/RitmiaLite.jsx`:
  controles compactos y créditos visibles.
- `public/audio/instruments/`: 15 WAV, manifiesto y tres licencias; archivos acústicos
  anteriores sin reemplazos.
- `scripts/prepare-instrument-samples.py`, `scripts/audit-instrument-audio.mjs`:
  preparación reproducible y renders de revisión.
- `tests/audio/instrumentBanks.test.js`, `instrumentAssets.test.js`,
  `tests/context/instrumentSelection.test.jsx`, `e2e/instrument-banks.spec.js`:
  cobertura nueva. `productClosure`, `arabePresets` y E2E árabes actualizan únicamente
  las expectativas de instrumento/descripción que cambian con esta función.
- `docs/audio-sources.md`, `docs/arabic-rhythms.md`: procedencia, mapeos y límites actuales.

Los cambios de estilos y selector de familias que ya estaban pendientes al comenzar
se conservaron. No se reescribió el cálculo de tiempos ni se realizaron commits/push.

## Resultado de validación

- Estado inicial auditado: 221/221 unitarias; 25/31 E2E y seis timeouts de
  30 s, antes de conectar la implementación nueva. Se conservaron logs y respaldo
  del diff/archivos sin seguimiento en `/private/tmp/ritmia-instruments`.
- Estado final: 294/294 unitarias, 20/20 archivos; 35/35 E2E Chromium,
  escritorio y contexto táctil/móvil; 19 renders de audio real sin sobrepaso
  de 0 dBFS en los casos medidos; build aprobado y `git diff --check` limpio.
- Comandos finales: `npm test -- --maxWorkers=1 --minWorkers=1`,
  `npm run test:e2e -- --workers=1 --timeout=60000`, `npm run build`.
  El límite E2E se pasó por CLI por los timeouts previos de la máquina;
  no se quitaron aserciones ni se reescribió la suite existente para esconderlos.
- Los 24 presets se compararon con el respaldo inicial: id, nombre, familia,
  compás, BPM, subdivisión, strokes, acentos, agrupaciones y etiquetas idénticos.
  El diff de `timingCalculator` también es idéntico al estado inicial.
- Escucha comparativa humana y Safari/iPhone/Chrome Android físicos: pendientes.

## Extensión para grooves populares

Se agregan exclusivamente `ride.wav` y `pedal-hat.wav`: **260.278 bytes** de audio. Ambos proceden de Virtuosity Drums, Austin McMahon / Versilian Studios, CC0, revisión `9f04cf9a734527edfbb0a4eee1f674e45bbf71bc` (misma licencia incluida en audio/acoustic).

- [Ride original](https://github.com/sfzinstruments/virtuosity_drums/blob/9f04cf9a734527edfbb0a4eee1f674e45bbf71bc/Samples/mid/ride/mid_ride_ride_vl1_rr1.flac): ataque ride real, cola limitada a 2,5 s con fade de 120 ms.
- [Hi-hat de pedal original](https://github.com/sfzinstruments/virtuosity_drums/blob/9f04cf9a734527edfbb0a4eee1f674e45bbf71bc/Samples/mid/hh/mid_hh_pedal_vl1_rr1.flac): chick de pedal real, cola limitada a 450 ms con fade de 30 ms.

Mono PCM16 44,1 kHz, resampling sinc, pico .48. Se recorta preroll mecánico antes del ataque (umbrales relativos .02 ride / .05 pedal, 1 ms conservado); tiempos exactos y hashes en manifiesto. `--only ride pedal-hat` reproduce la incorporación sin volver a procesar las once muestras anteriores. Kit jazz carga estos archivos bajo demanda y reutiliza caja/bombo/hi-hat existentes. No añade un banco completo. Patrones y límites: [popular-grooves.md](popular-grooves.md).

## Bajo eléctrico de dedos

La primera capa afinada usa solo dos muestras, ambas de la variación finger del instrumento Yamaha RBX de Andrea Biasior, publicadas por FreePats bajo CC0 1.0. Se fijó el repositorio `freepats/electric-bass-YR` en `8dcb7ea9116f417273ef8c030d15e7b3aa654301` y se incluyó la licencia CC0 ya distribuida en `public/audio/instruments/LICENSE-FreePats-CC0.txt`.

- [G.flac (G1, MIDI 31)](https://github.com/freepats/electric-bass-YR/blob/8dcb7ea9116f417273ef8c030d15e7b3aa654301/samples/finger/G.flac) → `bass-g1.wav`.
- [D.flac (D2, MIDI 38)](https://github.com/freepats/electric-bass-YR/blob/8dcb7ea9116f417273ef8c030d15e7b3aa654301/samples/finger/D.flac) → `bass-d2.wav`.

Son muestras exactas para las dos notas usadas; no se transpone ni se simula un rango cromático. Se convierten a mono PCM16 44,1 kHz, se recortan a 750 ms, se aplica fade cosenoidal de 30 ms y pico común .48. Los WAV ocupan **132.388 bytes** juntos; sus dos AudioBuffers mono float32 ocupan aproximadamente **264.600 bytes** (258,4 KiB). Solo se solicitan y decodifican al activar una línea de bajo; el caché de contexto existente deduplica ambos procesos. En fallos, continúa la batería y el estado informa que falta el bajo.

En Funk la línea didáctica usa G1 y D2 (tónica y quinta de G menor) con cinco ataques sincopados en la rejilla de semicorcheas. Blues Shuffle usa los mismos grados en una rejilla ternaria con anticipaciones de tercera parte; Slow Blues, en 12/8, coloca cuatro notas en los pulsos de negra con puntillo. No se infiere una armonía ni se representa una progresión de blues.

`scripts/prepare-instrument-samples.py --only bass-g1 bass-d2` prepara únicamente estas incorporaciones y conserva el resto del manifiesto. Los hashes de origen y salida, duración, pico y tamaño exacto están en `public/audio/instruments/manifest.json`.
