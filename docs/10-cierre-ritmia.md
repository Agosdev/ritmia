# Tarea 10 — Cierre de Ritmia

Base Git: `main`, `8e7c25d5da5437fb7dd9b94395ef29f3267663ec`. La base de trabajo incluye los cambios aprobados de 09A que aún no tenían commit. Este informe distingue esos cambios previos de la consolidación actual. No se hicieron commits, push, reescrituras ni cambios de visibilidad.

## Producto y organización

Una sola entrada en `App.jsx`, sin selección por URL ni presentaciones alternativas, incluso en desarrollo. Nombre público **Ritmia**, subtítulo **Laboratorio rítmico interactivo**. Se retiraron versión, selector de presentación y referencias públicas a prototipos. Los nombres internos `Lite` se conservan donde evitan cambios de imports sin beneficio funcional.

Se retiraron Art, su visualizador biomórfico, efectos, tema propio, prototipos y laboratorio duplicado. El inventario de dependencias confirmó que sus componentes exclusivos no eran necesarios para la pantalla actual. Se conservan compases, agrupaciones, los cuatro modos A/B, las claves y los tres niveles. También se conservan los visualizadores clásico, Rebote 2D y Órbita 3D; el clásico sigue siendo inicial y Three.js sigue cargándose únicamente al activar 3D.

Se eliminaron el selector sonoro, preferencias manuales de movimiento y modo seguro, cuestionario de lectura y panel explicativo de relaciones/tiempos. Permanecen las validaciones de dominio, cálculos de relaciones, master gain/compresor y cancelación de voces. El movimiento reducido se toma del sistema y se actualiza si cambia durante la sesión.

Se suavizaron sombras de elevación/hover y los bordes de controles comunes. Se conservaron estados hundidos, contraste del texto y foco de 3 px. No se reconstruyó la interfaz. No se añadieron publicidad, monetización, PWA ni service workers.

## Transporte y audio

El botón principal muestra Reproducir/Detener según el estado. Detener utiliza la pausa existente: suspende AudioContext y cancela voces anticipadas conservando cursores y fase. Reproducir reanuda esa fase. Reiniciar utiliza la cancelación existente y vuelve al origen: continúa solamente si se estaba reproduciendo, con el margen de preparación de 80 ms ya existente; en reposo o pausa queda detenido al origen. Las solicitudes pendientes siguen protegidas por generación.

Los cambios de `AudioEngine.js` cubren el kit único, su error/reintento y cierre, el marcador solicitado y una corrección aislada de alcance de Morph. No se cambiaron el lookahead, intervalo del scheduler, fórmulas, avances de cursores, política de invalidación de eventos, pausa ni sincronización entre pistas. `timingCalculator.js`, patrones de clave y `masterBus.js` permanecen intactos.

Solo se usan los cuatro WAV acústicos originales. La carga comparte una promesa y buffers por AudioContext; detener, reanudar o reiniciar no vuelve a descargarlos. Un error impide arrancar y muestra un mensaje con reintento visible junto al transporte, también en móvil. Se corrigieron dos carreras reproducidas con tests: un decode tardío no repuebla la caché después de desmontar; y todos los inicios que comparten una carga fallida rechazan el error, incluso si un reinicio hizo que el primer consumidor ya limpiara la promesa. Así se evita arrancar sin buffers ni aviso. Se eliminó el fallback sintético y todas sus voces/ruido/osciladores.

**Marcar inicio de compás** está junto al transporte/BPM y apagado al abrir. No se modifica al aplicar presets, cambiar de nivel o visualizador. Su función es marcar el índice cero del ciclo de A, incluso cuando ese paso es silencio, únicamente si el usuario la activa. Se reutiliza `snare-soft.wav`, al 25 % de ganancia, limitado a 80 ms, con fade final de 15 ms. Comparte el timestamp exacto del primer paso, sin generar otro evento de patrón. Su intención es ser un sonido de referencia discreto; la decisión tímbrica necesita escucha humana.

## Presets y equivalencia musical

Seleccionar no aplica: hay que pulsar **Aplicar**. Solo cambia A, sus acentos/agrupación y el BPM sugerido. Conserva nivel, B, modo, volúmenes y marcador. El estado muestra el último preset aplicado y avisa si fue editado. No hay bloqueo de funciones ni samples de canciones.

| Preset | Posiciones y acentos | Agrupación | BPM sugerido y duración |
| --- | --- | --- | --- |
| Bulerías | 12,1,2,3,4,5,6,7,8,9,10,11; fuertes 12/3/6/8/10, resto suaves | 3+3+2+2+2 | 180 cuentas/min; 1/3 s por cuenta, 4 s por ciclo |
| Bulerías variante | Mismo conteo; fuertes 12/3/7/8/10 | 3+4+1+2+2 | Igual duración |
| Tangos flamencos, palmas básicas | Silencio/fuerte/suave/fuerte en 1/2/3/4 | 2+2 | Negra=100; 0,6 s por cuenta, 2,4 s por compás |
| Tango argentino, marcato en cuatro | Cuatro negras fuertes iguales | 2+2 | Negra=112; ≈0,536 s por cuenta, ≈2,143 s por compás |

El motor expresa BPM en negras/minuto. Para bulerías se utiliza una rejilla interna `12/4`, con una negra por cuenta: **no se presenta como transcripción convencional del palo**. No se equipara automáticamente un ciclo de doce cuentas a 12/8 ni a cuatro negras con puntillo. Se muestra una advertencia pedagógica en el preset. El índice cero se etiqueta 12; los índices fuertes son `[0,3,6,8,10]` (variante `[0,3,7,8,10]`). Grupos indican distancias desde esos apoyos. El primer grupo comienza en 12.

Son reducciones editables, sin swing, microtiming, anticipaciones, articulación instrumental ni acompañamiento armónico. Las palmas de tangos no tienen una única acentuación universal; se eligió una reducción con primer tiempo vacío y apoyos en 2/4. Marcato no se identifica con 3-3-2. Los BPM son sugerencias de práctica del producto, no una norma histórica.

Fuentes consultadas:

- [Studio Flamenco: Bulerías](https://www.studioflamenco.com/about2-c1l30): ciclo desde 12 y alternativa de acento en 6 o 7.
- [Lola Fernández Marín, Flamenco al piano: Bulerías](https://www.flamencolive.com/libreria/ejemplo_fap3bul.pdf): organización 3+3+2+2+2; el punto de inicio de la agrupación debe interpretarse junto al conteo.
- [Sandra Bonal: compás de tangos](https://flamencoconsandrabonal.com/compas-de-tangos-flamencos/): cuatro negras y primer tiempo no marcado por las palmas.
- [Estudio académico, Instituto Politécnico de Lisboa](https://repositorio.ipl.pt/server/api/core/bitstreams/7d18de35-7a41-423b-b07c-a2de0bf53972/content): referencia a apoyos en segundo y cuarto tiempo; el buscador permitió contrastar ese fragmento, el PDF se descargó fuera del repositorio; no se extrajo ni revisó su texto completo en esta sesión.
- [Ignacio Varchausky: marcato en cuatro](https://www.ignaciovarchausky.com/blog?tag=marcato+en+4): variantes estilísticas, incluida la marcación igual de los cuatro tiempos.
- [Rhythm Dictionary: Tango Marcato](https://www.rhythmdictionary.com/p/tango-marcato): consulta complementaria; sus anticipaciones no se incorporan a esta reducción.

## Seguridad, licencias e historial

Respaldo posterior a 09A: `~/.local/share/ritmia-backups/2026-11-01_13-38-35-0300`. Incluye archivos sin seguimiento, dependencias, JPEG ignorado, bundle, diffs y manifiesto. Restauración de prueba en `/private/tmp/ritmia-restore-verification-wto8pwan/project`: **7.458 archivos/enlaces**, hashes, permisos, estado Git y diffs coincidentes. El proyecto original no se restauró ni se descartaron cambios.

El JPEG se retiró del árbol activo después de verificar esa copia; sigue excluido por Git. `git log --all --` para su ruta y los nombres de objetos de las referencias locales no encontraron el archivo ni otras imágenes JPEG/PNG históricas. Esto no inspecciona copias externas o referencias remotas eliminadas.

El historial sí conserva Art: entre otros, `40837f7`, `f5e0500`, `6fe8e32` y `6502dd6`. Borrar archivos actuales no oculta esos commits, sus mensajes ni sus documentos históricos. No se reescribió el historial. El repositorio ya fue informado como público por la usuaria; esta tarea no publicó cambios. No se encontró la referencia gráfica de derechos inciertos en el historial local revisado. La licencia general del código continúa sin declararse: requiere decisión de la titular antes de ofrecer condiciones de reutilización.

Los WAV permanecen idénticos. El manifiesto identifica las fuentes y transformaciones de Virtuosity Drums, revisión `9f04cf9a734527edfbb0a4eee1f674e45bbf71bc`. Se contrastó [la página del productor](https://versilian-studios.com/virtuosity-drums/) y [su licencia fijada](https://raw.githubusercontent.com/sfzinstruments/virtuosity_drums/9f04cf9a734527edfbb0a4eee1f674e45bbf71bc/LICENSE), que declara CC0. Se preservan licencia, manifiesto y atribución a Austin McMahon/Versilian Studios/Karoryfer. Los archivos locales son mono, PCM16, 22.050 Hz; picos ≈0,24/0,58 y duración ≈0,55/0,65 s, coherentes con el manifiesto. No se repitió la conversión desde los FLAC originales. `wav-audit.json` registra hashes y mediciones. Three.js mantiene su licencia MIT.

## Validación y límites

Pruebas unitarias: **181 aprobadas en 18 archivos**. El descenso respecto de las 199 de 09A corresponde al retiro de pruebas exclusivas de Art, síntesis, cuestionario, preferencias manuales y paneles retirados; se conservan regresiones de transporte, timing y accesibilidad y se incorporan seis casos de cierre (cuatro presets, reset y marcador), una regresión del límite de renders y dos regresiones de carga/cierre de audio y dos de ganancia al cambiar de nivel.

Los tests con AudioContext controlado verifican timestamps, cancelación de lookahead, voces activas, fase A/B, cambios de BPM/modo, agrupaciones, volúmenes y ciclos de clave. Las pruebas matemáticas recorren compases y BPM admitidos, divisiones, reencuentros y ratios. No se halló un error que justificara cambiar las fórmulas ni la programación temporal. Sí se reprodujo y corrigió un error de ganancia: Morph seguía atenuando A en los niveles 1/2 aunque ese control solo está disponible en el nivel 3. El cruce de ganancias se aplica ahora únicamente en Dos pistas; sus valores quedan guardados al salir y volver. Las regresiones verifican ganancia real programada del motor (con mocks), correspondencia visual y persistencia del ajuste, sin cambiar la fórmula del cruce.

La suite E2E completa aprobó **38 casos**, incluidos los 13 de 09A adaptados al transporte. Cubre carga diferida, fallback, liberación de WebGL, silencio/Morph, visibilidad, movimiento reducido, tres niveles, presets editables, acústico/error/reintento y rutas heredadas inertes. Una medición antigua comparaba cuadros con 350 ms de espera más demoras de comunicación; se reemplazó por un intervalo medido dentro de Chrome. No se modificó el renderer para hacer pasar esa prueba.

Build local y Pages aprobados con Node 22. `git diff --check` limpio. El aviso de Vite sobre el tamaño opcional de Three.js sigue visible: no se lo oculta ni se agrega esa biblioteca a la entrada inicial.

La aprobación final debe incluir escucha con auriculares/altavoces y pruebas sostenidas en un teléfono físico; headless no certifica calidad acústica, consumo ni latencia de salida.

## Inventario respecto del respaldo aprobado de 09A

El archivo externo `files-changed.json` contiene el inventario verificable. Se excluyen dependencias instaladas, builds y reportes temporales. Las modificaciones de `package.json`/lockfile visibles contra HEAD pertenecen a 09A: la Tarea 10 no agregó, actualizó ni reinstaló dependencias. React, React DOM, Styled Components y Three.js siguen en uso; no había una biblioteca exclusiva de Art que retirar. Se eliminó la carga de Google Fonts y el SVG inicial de Vite sin uso.

### Nuevos (7)

```text
docs/10-cierre-ritmia.md
scripts/audit-real-audio.mjs
scripts/capture-product.mjs
src/components/controls/MusicalPresets.jsx
src/components/layout/TransportActions.jsx
src/music/presets.js
tests/context/productClosure.test.jsx
```

### Modificados (38)

```text
README.md
docs/09A-visualizadores.md
docs/guia-de-uso.md
e2e/README.md
e2e/accessibility-responsive.spec.js
e2e/audio-kits.spec.js
e2e/optional-visualizers.spec.js
e2e/ritmia-lite.spec.js
e2e/ritmia.spec.js
index.html
scripts/verify-pages.mjs
scripts/visualizer-performance.mjs
src/App.jsx
src/audio/AudioEngine.js
src/audio/instruments.js
src/components/controls/GroupingInput.jsx
src/components/controls/PolyrhythmControls.jsx
src/components/layout/Header.jsx
src/components/layout/LiteTransportDock.jsx
src/components/layout/RitmiaLite.jsx
src/components/modals/WelcomeModal.jsx
src/components/ui/Toggle.jsx
src/components/visualizer/BeatGrid.jsx
src/components/visualizer/physical/musicFrame.js
src/components/visualizer/physical/usePhysicalRenderer.js
src/context/RitmiaContext.jsx
src/styles/liteSurfaces.js
src/styles/theme.js
tests/audio/AudioEngine.test.js
tests/audio/acousticKit.test.js
tests/audio/voiceLifecycle.test.js
tests/components/Accessibility.test.jsx
tests/components/MusicalControls.test.jsx
tests/context/RitmiaContext.test.jsx
tests/context/musicalValidation.test.jsx
tests/helpers/controlledAudioContext.js
tests/setup.js
tests/visualizers/musicFrame.test.js
```

### Retirados (21)

```text
design-references/ritmia-referencia-artistica.jpg
docs/direccion-artistica.md
docs/lenguaje-de-movimiento.md
docs/ux-pedagogica.md
e2e/experimental-prototype.spec.js
e2e/ritmia-art.spec.js
public/vite.svg
src/components/controls/LevelTabs.jsx
src/components/layout/Footer.jsx
src/components/layout/MainLayout.jsx
src/components/layout/RitmiaArt.jsx
src/components/modals/TestModal.jsx
src/components/visualizer/AudioInfoBadge.jsx
src/components/visualizer/CircularVisualizer.jsx
src/components/visualizer/ExperimentalRhythmPrototype.jsx
src/components/visualizer/ExperimentalRhythmVisualizer.jsx
src/components/visualizer/ProgressTimeline.jsx
src/components/visualizer/RitmiaArtVisualizer.jsx
src/components/visualizer/musicalEffects.js
tests/audio/instruments.test.js
tests/components/musicalEffects.test.js
```

Las piezas de 09A que no aparecen como modificadas se preservaron. En sus módulos compartidos se retiró la opción visual de modo seguro y se alineó la ganancia visual con el alcance corregido de Morph. La documentación de 09A queda rotulada como registro histórico; el README y la guía principal describen únicamente el producto vigente. Todos los archivos retirados, incluido el JPEG ignorado, siguen disponibles en el respaldo externo.

## Optimización del estado visual

El perfil previo mostró trabajo React frecuente mientras el clásico seguía el reloj de pantalla. Se limitó la publicación de progreso/pulsos a una cadencia objetivo de 30 Hz, calculando cada posición desde AudioContext. La regresión verifica que dos cuadros separados por 10 ms no generan otra actualización, que el siguiente tick refleja la hora real y que no se modifican los eventos programados. El resto de la aplicación no se suscribe a ese estado de alta frecuencia. No se añadió memoización especulativa.

La actualización inmediata al pausar/reiniciar se conserva. En una pestaña oculta no se publican actualizaciones React decorativas; el RAF nativo se suspende por política del navegador. Los Canvas conservan su loop imperativo con cancelación explícita y sus límites de DPR originales. No hay cambios en el reloj ni en el scheduler de audio. La cadencia visual puede omitir eventos muy densos entre cuadros; no equivale a perder notas en el audio.

## Resultados finales de audio, Pages y rendimiento

AudioContext nativo en Chrome: cuatro WAV decodificados una sola vez; cero osciladores. A/B a 120 BPM programaron 16 ataques por pista en la ventana de unos ocho segundos, con intervalos de 0,5 s. La desviación máxima del timestamp frente a esa rejilla fue 2.2e-16 s; es un cálculo sobre eventos programados, **no una medición de drift acústico ni de latencia del dispositivo**. El reloj permaneció congelado durante la pausa. Tras detener: cero voces iniciadas activas y cero fuentes futuras sin cancelar en la traza. Morph programó ganancia cero en A en el nivel 3 y ganancia uno al volver al nivel 1. La instrumentación registra AudioParams/timestamps; no captura ni escucha la salida física.

El preview Pages final pasó a 375/1280 px: niveles, acentos, BPM, transporte, cuatro WAV bajo `/ritmia/audio/acoustic/` y parámetros heredados inertes, sin errores de consola, 404 ni solicitudes fallidas. Desarrollo se verificó con los 38 E2E a 320/375/768/1280 px. Se corrigió un solapamiento de unos 6 px con el dock y se agregó su regresión de foco. El error/reintento se comprobó visible en viewport móvil y desktop.

| JavaScript | Bytes antes (09A) | Bytes finales | gzip final |
| --- | ---: | ---: | ---: |
| Entrada inicial | 300190 | 265037 | 83174 |
| Rebote/runtime compartido | 6432 | 6348 | 3064 |
| Entrada Órbita | 3864 | 3864 | 1905 |
| Three.js opcional | 753471 | 753471 | 192662 |
| Módulo biomórfico retirado | 19451 | 0 | 0 |

La entrada inicial comprimida bajó de 90814 a 83174 bytes: **8.4 % menos**. Los WAV siguen sumando 106.016 bytes. Cero descargas iniciales de Three.js en los 16 casos; solo se solicitó al activar Órbita. No se instalaron ni cambiaron dependencias durante la Tarea 10.

Patrón inicial 7/5 a 92 BPM, una muestra por caso. Trabajo JS normalizado por la duración real de la ventana CDP (ms de JS por segundo de medición), heap sin GC forzado y p95 del RAF de pantalla:

| Ancho | Modo | JS ms/s | Heap MiB | RAF p95 ms |
| --- | --- | ---: | ---: | ---: |
| 375 | 09A clásico | 148.6 | 5.70 | 16.7 |
| 375 | Final clásico | 41.2 | 5.41 | 16.8 |
| 375 | Final Rebote | 39.9 | 7.12 | 16.8 |
| 375 | Final Órbita | 70.0 | 8.82 | 16.7 |
| 1280 | 09A clásico | 65.5 | 6.16 | 16.7 |
| 1280 | Final clásico | 29.4 | 5.77 | 16.7 |
| 1280 | Final Rebote | 30.6 | 6.17 | 16.8 |
| 1280 | Final Órbita | 39.6 | 7.17 | 16.8 |

Los casos de 32/32 posiciones a 200 BPM también constan en `performance.json`; conservan los acentos/silencios al ampliar el patrón, **no son 32 golpes fuertes consecutivos**. El p95 de dibujo físico fue 33,4 ms (cadencia objetivo 30 Hz); el RAF de pantalla estuvo alrededor de 60 Hz. Órbita mantuvo siete geometrías, una textura interna y ocho/nueve draw calls. El heap no incluye una medida exhaustiva de VRAM o memoria nativa de audio.

Son mediciones secuenciales, sin builds/tests concurrentes ni CPU/GPU throttling. El orden es fijo y hay una sola muestra por caso: cachés, JIT, temperatura y carga externa pueden variar. La base conserva su marcador inicial antiguo; el final lo apaga por requisito, por lo que es una comparación del producto completo, no un experimento causal de un único cambio. `readyMs` incluye la espera de red inactiva y no es TTI; FCP y carga crudos se conservan en el JSON, sin prometer mejoras universales. La muestra previa a limitar React se conserva como `performance-before-throttle.json`. No equivalen a pruebas en un teléfono físico.

Reproducción: servir el build de 09A en 4176 y el final en 4173; ejecutar `scripts/visualizer-performance.mjs` con `VISUAL_BASELINE_URL=http://127.0.0.1:4176/ritmia/`, `VISUAL_BASELINE_ASSETS=/private/tmp/ritmia-10-baseline-dist/assets`, `VISUAL_EVIDENCE_DIR=/private/tmp/ritmia-10-evidence/performance` y `CHROME_PATH` al Chrome local. `scripts/audit-real-audio.mjs`, `scripts/verify-pages.mjs` y `scripts/capture-product.mjs` reproducen las otras verificaciones.

## Evidencia y revisión pendiente

Evidencia local temporal: `/private/tmp/ritmia-10-evidence/`. `index.html` reúne los niveles 1/2/3, los tres presets principales y foco a 375/1280 px; `performance/index.html` compara 09A y final e incluye Rebote/Órbita y videos WebM de cuatro segundos sin audio. `real-audio.json`, `wav-audit.json`, `files-changed.json`, `validation.json` y `performance/performance.json` conservan los resultados. El informe de Pages se copia como `pages.json`. Conviene conservar esta carpeta antes de una limpieza del sistema.

El respaldo inicial se volvió a comprobar mediante SHA-256 y continúa íntegro. HEAD sigue en `8e7c25d`, rama `main`, sin archivos staged ni commits/push de esta tarea. Los resultados locales no implican que GitHub Pages haya recibido estos cambios.

Quedan para aprobación humana la escucha de timbres/mezcla y del marcador, los presets como reducciones pedagógicas, la fluidez/consumo sostenidos en móvil físico, políticas de suspensión/autoplay/background y latencia de salida. Los tests no certifican ausencia de clipping audible en toda combinación extrema ni reemplazan una escucha con auriculares/altavoces. La licencia general del código sigue siendo decisión de la titular. No se detectaron fallos pendientes en las verificaciones automatizadas descritas. Implementación detenida antes de publicar.
