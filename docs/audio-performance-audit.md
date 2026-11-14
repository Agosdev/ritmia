# Auditoría musical y de rendimiento de Ritmia

Fecha: 2026-11-13. No se hizo commit ni push.

## Estado y línea base

- Commit auditado al inicio: `793f311a8f8f06eb8f5e1d85d08338a99a553d9b` (`main`). `origin/main` apuntaba al mismo SHA y el árbol local estaba limpio.
- GitHub Pages publicaba ese mismo commit. El HTML de producción apuntaba a `assets/index-QvPV2WSb.js`, igual que el build local inicial.
- [Ejecución de Tests and E2E](https://github.com/Agosdev/ritmia/actions/runs/43444914126): unit tests y build aprobados; Playwright no pudo crear `/private/tmp/ritmia-search-layout` en CI Linux.
- [Ejecución de Pages](https://github.com/Agosdev/ritmia/actions/runs/43444914113): desplegó el SHA aunque el workflow E2E estaba rojo. Esto se corrigió para que Pages consuma el artefacto del workflow de verificación solamente después de que termine correctamente.

## Hallazgos y cambios

### Severidad

| Severidad | Hallazgo verificado | Acción/estado |
|---|---|---|
| Crítico | No se reprodujo un defecto determinista de patrón, sincronización, silencio o clipping de salida en los casos auditados. | Sin cambios al scheduler ni a los datos musicales. La prueba humana sigue pendiente. |
| Alto | La captura densa inicial a 30 Hz cayó a 16.4 FPS y mostró 9 long tasks; una repetición estable no lo reprodujo. La captura móvil emulada a 24 Hz redujo tareas de script en la comparación aislada, sin cambiar el transporte. | Se limita presentación React a 24 Hz en viewport móvil. Medición indicativa, no prueba de dispositivo físico. |
| Medio | Una pausa de hilo que supera el lookahead deja ataques vencidos; el motor los omite para no reproducirlos tarde. | Se documentó y agregó regresión que confirma recuperación sobre la rejilla; un bloqueo suficientemente largo aún puede omitir golpes. |
| Medio | Caso sintético muy denso supera 1.0 antes del compresor, pero el render a la salida del master queda por debajo de 1.0. | No se normalizan muestras ni se altera dinámica; los peaks quedan en JSON por kit. |
| Bajo / pendiente | No hay ejecución disponible en Safari nativo ni teléfonos Android/iOS. | Se limita la conclusión a Chrome de escritorio con viewport táctil simulado. |

### Corregidos

- Los tests guardaban capturas en rutas absolutas `/private/tmp/...`. Ahora Playwright usa `testInfo.outputPath`; scripts de captura y auditoría usan `node:os.tmpdir()` y no requieren rutas de macOS.
- La invitación de primera visita del tour interceptaba controles que quedaban debajo de la tarjeta. Ahora solo sus botones reciben eventos de puntero; el resto de Ritmia sigue operable. Se agregó una prueba móvil y desktop.
- Un test buscaba el heading `Ritmia` por coincidencia parcial, que también coincidía con «¿Primera vez en Ritmia?». El locator ahora exige el nombre exacto.
- El workflow de Pages ya no instala dependencias ni recompila y despliega por separado. `Tests and E2E` construye en modo Pages, ejecuta tests unitarios y E2E y guarda el artefacto; Pages solo despliega ese artefacto si esa ejecución de `push` a `main` concluye correctamente.
- El workflow modificado se activó en GitHub: los commits `1955144` y `d0967de` pasaron el workflow de pruebas y el de Pages. La API de GitHub confirmó que cada deployment publicó el SHA correspondiente.
- En pantallas de hasta 600 px la presentación se actualiza hasta 24 veces/s (30 veces/s en pantallas mayores). Es una reducción de trabajo visual, no del scheduler: transporte, timestamps y golpes siguen usando `AudioContext.currentTime`. Si `matchMedia` no existe, se conserva el intervalo de 30 Hz.

### Scheduler y sincronización

- Contrato inspeccionado: BPM son negras/minuto; `stepA = (60/BPM) × (4/denA) ÷ subdivisionA`; el compás dura `stepA × numA × subdivisionA`. No se modificaron fórmulas, BPM, compases, presets ni el reloj.
- El scheduler sigue consultando cada 25 ms y programa con 100 ms de lookahead sobre `AudioContext.currentTime`. Las pistas A y B se programan en el mismo contexto/reloj.
- Si el hilo principal queda detenido más que el lookahead, `advancePastNotes` salta los ataques vencidos en vez de dispararlos tarde. La fase vuelve a la rejilla y no acumula deriva, pero durante ese bloqueo pueden faltar ataques. Un test de regresión ahora fija ese comportamiento. No es una prueba de un teléfono ni demuestra que 100 ms alcance bajo toda carga real.
- El instrumento seleccionado se prepara antes de iniciar el transporte. Las solicitudes y decodificaciones se deduplican por archivo y `AudioContext`; los fallos conservan el fallback acústico. Un cambio manual en playback puede cargar un kit nuevo mientras el transporte continúa y usa fallback hasta que el kit queda listo.
- Cada muestra termina/desconecta sus nodos al finalizar. El límite del motor gestiona hasta 32 voces sostenidas por pista y recorta colas antiguas sin cancelar el ataque entrante. El fade de 5 ms puede hacer que coexistan brevemente nodos ya recortados con el ataque nuevo; el estrés imposible de 2,34 ms produjo más solapamiento. La configuración expuesta por la UI no llega a ese intervalo.

## Matriz de los 33 presets y Compás libre

La matriz se genera desde `MUSICAL_PRESETS`, `INSTRUMENTS` y `BASS_PATTERNS`; no mantiene una segunda lista de nombres. Calcula la duración de forma independiente, enumera posiciones, silencios, intensidades, articulaciones y bajo, y recorre los 15 kits para verificar que sus muestras estén declaradas y que no vuelvan audible una celda silenciosa.

**Compás libre** no es un preset fijo: compás, BPM, subdivisión, golpes, intensidades y silencios son editables. La tabla incluye los 33 presets definidos. Sus reducciones pedagógicas no constituyen transcripciones exhaustivas de estilos tradicionales.

Consulta la [matriz completa con ataques, métrica, subdivisión, duración y recomendación](evidence/audio-matrix/musical-matrix.md) y el [JSON, incluidos los 495 pares preset/kit](evidence/audio-matrix/musical-matrix.json).

## Renders offline, samples y master

El render offline usa Web Audio real, una medida completa por preset recomendado, más 0,8 s de cola. Compara el número de timestamps únicos programados con los ataques definidos. No mide latencia en tiempo real ni prueba audición perceptiva en móvil. También se hizo una prueba online de 60 s con AudioContext real y dos pistas simultáneas: 121 ataques por pista, paso observado de 0.5 s, deriva máxima 8.9e-16 s, antelación mínima 69 ms; pause congeló la fase, stop dejó el contexto `suspended` y cero voces vivas. Ver [registro completo de audio real](evidence/live-audio/real-audio.json). Es Chrome de escritorio, no un dispositivo móvil.

Resultados del render final (52 casos: 33 presets recomendados, 2 combinaciones acústicas expresas y 17 casos de estrés de kits):

| Comprobación | Resultado |
|---|---|
| Presets con render recomendado | 33/33; ningún ataque omitido en los renders |
| Proyecciones preset × kit | 495/495 apuntan a samples declarados; cero silencios se vuelven audibles |
| WAVs de revisión auditiva | 13, 48 kHz, PCM16, mono; ≈4.1 MiB conservados localmente y excluidos del commit por tamaño |
| Peak/RMS pre y post master | Peak de salida entre 0.287 y 0.853; 0 muestras de salida ≥0.999. El caso de estrés más denso llegó a 1.025 antes del compresor (104 muestras ≥0.999 en el pre-master de los casos de estrés) |
| Stress de batería/crash | La señal antes del compresor superó 1.0 en el caso artificial más denso; la salida comprimida permaneció por debajo de 1.0 |

Se generaron trece WAV de revisión para escucha local (Maqsum con darbuka y cajón, Ayoub, Bulerías, Karsilama, Pop, Dance Pop, Half-time Rock, Blues Shuffle, Slow Blues, Jazz Swing, Jazz Waltz y Funk). No se publican por su tamaño; el reporte verificable con peaks, RMS, silencios, timestamps, solapamiento y formato está en [measurements.json](evidence/rendered-audio/measurements.json).

Los archivos fuente siguen siendo los existentes. El inventario de referencias suma 1.310.180 bytes de WAV; la estimación PCM basada en esos archivos es 2.618.688 bytes a su frecuencia de origen. La carga efectiva no es global: al arrancar el navegador sin reproducir se midieron 0 bytes de audio.

## Rendimiento emulado y compatibilidad

Las mediciones se hacen con Chrome headless 150 en macOS x64, viewport 375×812 y contexto táctil simulado. No hay teléfono físico ni dispositivo remoto disponible. Las ejecuciones simultáneas iniciales se preservaron, pero se excluyen como comparación antes/después; la repetición aislada de 30 Hz está en [30 Hz repetido](evidence/performance-mobile-emulated-repeat-30hz/performance.json), y la captura aislada de 24 Hz en [24 Hz](evidence/performance-mobile-emulated-after/performance.json). Los directorios `*-concurrent-*` son solo referencia bajo carga concurrente.

El modo sencillo reproduce Maqsum 4/4 con subdivisión de corchea. El caso denso reproduce Funk a 200 BPM más una pista B de 32 pasos; se registran rAF, tareas largas, CPU del hilo principal, heap, WAV transferidos, buffers decodificados y fuentes creadas/finalizadas. Las cifras de esos casos no sustituyen pruebas con hardware móvil real.

| Navegador/dispositivo | Estado de verificación |
|---|---|
| Chrome desktop (headless) | E2E y mediciones Playwright ejecutadas localmente |
| Chrome Android | Sin teléfono físico ni infraestructura remota; pendiente |
| Safari macOS | No ejecutado en Safari |
| Safari iOS | Sin iPhone/iPad; pendiente |

### Medición emulada de carga

| Escenario | Hz visual | FPS rAF | p95 | >50 ms | Long tasks | TaskDuration / 5 s | ScriptDuration / 5 s | Heap final |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Reposo | — | 59.8–60.1 | 16.7–16.8 ms | 0 | 0 | 80.8–87.0 ms | 11.0–17.8 ms | 10.2–11.1 MB |
| Maqsum sencillo | 30 | 59.8 | 16.8 ms | 0 | 0 | 744.3 ms | 362.2 ms | 11.1 MB |
| Maqsum sencillo | 24 | 58.7 | 16.8 ms | 1 | 0 | 707.7 ms | 306.4 ms | 12.2 MB |
| Funk denso A + B, B de 32 pasos (repetición) | 30 | 55.7 | 33.3 ms | 1 | 0 | 2,256.7 ms | 1,030.9 ms | 24.0 MB |
| Funk denso A + B, B de 32 pasos | 24 | 55.6 | 33.3 ms | 3 | 0 | 1,895.6 ms | 780.4 ms | 21.9 MB |

En ese par de carga densa, la ejecución de 24 Hz redujo `TaskDuration` ≈16% y `ScriptDuration` ≈24%, con FPS y p95 prácticamente iguales. Una muestra por variante no constituye benchmark repetible en hardware móvil. Una captura inicial de 30 Hz bajo carga alta registró 16.4 FPS, p95 183 ms, 9 long tasks y dos inicios de fuente 8 ms tarde; una repetición estable a 30 Hz no reprodujo esos valores. No atribuyo esa primera degradación a un defecto reproducible del scheduler.

En reposo no se solicitaron ni decodificaron samples: 0 bytes de audio y 0 buffers. Maqsum transfirió 233,076 bytes en 7 solicitudes WAV y decodificó 673,016 bytes PCM (AudioBuffers mono a 44.1 kHz). El escenario denso mostró 720,592 bytes transferidos acumulados (487,516 bytes adicionales tras Maqsum), 12 WAV y 1,644,608 bytes PCM decodificados en total. Al límite de captura quedaron unas 21 voces con cola; la instrumentación conserva registros de cada fuente, así que el número de registros no es una medida directa del heap de nodos nativos. No se pudo medir memoria durante 1–2 minutos en un teléfono.

Los archivos locales referenciados suman 1,310,180 bytes; PCM estimado para todo el catálogo: 2,618,688 bytes, pero no se descargaron ni decodificaron todos al inicio. El reporte de rendimiento también conserva las fuentes creadas/finalizadas y muestras decodificadas.

## Tests y artefactos

Resultados finales de la última ejecución:

- Unit tests: **359 aprobados**, 25 archivos.
- E2E: **50 aprobados en 4.3 min**; Chromium 150 local con el Chrome instalado porque Playwright no tiene Chromium compatible con el macOS de esta máquina. [Reporte Playwright](evidence/playwright-report-final/index.html); capturas del job en `test-results/` (directorio ignorado por git).
- Build Pages: aprobado; JavaScript inicial `316.71 kB` (gzip `99.10 kB`), CSS `0.00 kB`, HTML `0.66 kB`. Línea base del mismo commit: JS `316.63 kB` (gzip `99.09 kB`); diferencia ≈+0.08 kB JS / +0.01 kB gzip, sin dependencias ni recursos de audio nuevos.
- `git diff --check`: aprobado. Búsqueda de rutas absolutas `/private/tmp`, `/Users/`, `/Applications/` en `e2e/` y `scripts/`: sin coincidencias.

Playwright guarda capturas, trazas y reportes HTML en `test-results/` y `playwright-report/`. El HTML final se copió a `docs/evidence/` para conservar un enlace accesible; scripts, WAVs y salidas JSON también quedan en `docs/evidence/`.

## Límites y escucha manual necesaria

- No se probó la salida por altavoz ni auriculares reales en un teléfono. Los WAV offline no validan que el scheduler sobreviva a interrupciones del sistema, pantalla bloqueada o restricciones de Safari iOS/Chrome Android.
- Bloqueos del hilo principal superiores al lookahead pueden omitir ataques. No se amplió el lookahead sin pruebas en hardware: aumentarlo demora la respuesta a cambios de parámetros y no protege frente a pausas arbitrariamente largas.
- El límite de polifonía inspecciona y ordena las voces activas por pista al programar un golpe. Los escenarios ejecutados no mostraron acumulación sostenida de nodos, aunque no se perfiló una sesión física de 1–2 min ni el heap nativo del motor de audio. El caso sintético de 2.34 ms no es alcanzable desde la UI.
- Los modelos flamencos, árabes y otros son esqueletos documentados. Los kits manuales conservan ataques/dinámica, pero pueden proyectar articulaciones a timbres aproximados; por ejemplo `drums-soft` usa baquetas suaves, no escobillas. La línea de bajo solo usa G1/D2 en patrones definidos; no infiere armonía ni progresión.
- Para aprobar publicación manualmente: escuchar los WAV enlazados; probar Maqsum/Baladi/Saidi, Malfuf/Ayoub, Karsilama, Bulerías, Blues Shuffle/Slow Blues, Swing/Waltz y Funk con cada kit recomendado; reproducir 1–2 min y cambiar instrumento, nivel, pantalla/orientación, bloquear/desbloquear y volver desde segundo plano en Safari iOS y Chrome Android.

## Actualización de estabilidad y rendimiento (14 nov 2026)

### Publicaciones y validación

| Versión | Commit | Validación local | GitHub Actions / Pages |
|---|---|---|---|
| Auditoría y estabilidad base | [`1955144`](https://github.com/Agosdev/ritmia/commit/1955144eefcfda192e2c48540cf144e32ce8b815) | 359 unit tests, 50 E2E, build Pages, `git diff --check` | Tests `43550074427` y Pages `43550333925` exitosos; deployment SHA exacto `1955144eefcfda192e2c48540cf144e32ce8b815` |
| BPM y recuperación de audio | [`d0967de`](https://github.com/Agosdev/ritmia/commit/d0967defe11aa96e3e3340b2bd6ed44dad926cde) | 364 unit tests, 55 E2E, build Pages, `git diff --check` | Tests `43555009640` y Pages `43555255388` exitosos; deployment SHA exacto `d0967defe11aa96e3e3340b2bd6ed44dad926cde` |

El build Pages de la versión BPM mide `320.47 kB` JavaScript (`100.22 kB` gzip), `0.66 kB` HTML y `0.00 kB` CSS; no se agregaron dependencias. La fase de medición no cambió el código de producción.

El BPM manual ahora sobrevive a cambios de preset y nivel. Cada preset conserva su BPM sugerido, mostrado junto al control; **Usar BPM sugerido** solo aparece si los valores difieren y puede pulsarse durante playback. El cambio de BPM actualiza los pasos por el timing existente, sin reiniciar el contexto ni cambiar patrón, compás, acentos o subdivisión. No se guarda entre sesiones.

Los errores de carga ofrecen fallback acústico y reintento manual. Una suspensión externa del `AudioContext` detiene la programación vencida y ofrece **Reanudar sonido** sobre el mismo contexto/timeline; la pausa solicitada por la persona no genera alerta. El aviso de volumen cero aparece únicamente cuando el slider llega exactamente a cero. La ayuda de recuperación recomienda revisar volúmenes, reanudar, reintentar y recargar como último recurso; advierte que se perderían cambios no guardados.

### Medición adicional en Chrome headless

La línea base y repetición usan el build Pages local exacto de `d0967de`, Chrome headless 150.0.7871.125 en macOS x64, viewport 375×812 con emulación táctil. Cada escenario de carga duró 5 s y la reproducción densa A/B duró 120 s. Incluye instrumentación de `requestAnimationFrame`, `PerformanceObserver`, métricas CDP del hilo principal, heap V8 cuando Chrome lo expone, mutaciones del SVG, carga WAV y `AudioBufferSourceNode`. La instrumentación añade trabajo; no equivale a una traza de Android real. `docs/android-chrome-audio-test.md` contiene el procedimiento USB para repetirlo en el teléfono.

| Escenario | FPS base → repetición (Δ) | p95 / p99 ms base → repetición | >50 ms base → repetición | `TaskDuration` ms (Δ) | `ScriptDuration` ms (Δ) | Long tasks; tardíos / voces pico |
|---|---:|---:|---:|---:|---:|---|
| Reposo, 5 s | 60.0 → 60.0 (0.0%) | 16.8/16.8 → 16.7/16.8 | 0 → 0 | 68.6 → 64.7 (-5.7%) | 10.3 → 9.4 (-9.5%) | 0/0 ms; 0 / 0 |
| Compás libre, 5 s | 59.4 → 58.8 (-1.0%) | 16.8/16.8 → 16.8/16.8 | 0 → 1 | 448.6 → 423.5 (-5.6%) | 113.4 → 112.8 (-0.5%) | 0/0 ms; 0 / 1 |
| Funk batería + bajo, 5 s | 59.7 → 59.7 (0.0%) | 16.8/16.8 → 16.7/16.8 | 0 → 0 | 519.5 → 564.0 (+8.6%) | 144.5 → 147.6 (+2.1%) | 0/0 ms; 0 / 8 |
| Dos pistas, B por defecto, 5 s | 59.9 → 58.5 (-2.3%) | 16.8/16.8 → 16.8/33.3 | 0 → 1 | 946.9 → 1,090.1 (+15.1%) | 201.4 → 216.2 (+7.4%) | 0/0 ms; 0 / 16 |
| Funk + B 32/16 denso, 5 s | 58.5 → 54.4 (-7.0%) | 16.8/33.3 → 33.3/33.4 | 0 → 0 | 1,426.6 → 1,504.7 (+5.5%) | 301.6 → 327.1 (+8.4%) | 0/0 ms; 0 / 21 |
| Cambios de preset/BPM automatizados, 5 s | 47.8 → 37.7 (-21.1%) | 50.0/116.7 → 66.7/166.7 | 7 → 13 | 1,620.0 → 1,513.9 (-6.5%) | 381.1 → 380.8 (-0.1%) | 1/52 → 0/0 ms; 0 / 19 |
| Funk + B denso, 120 s | 58.3 → 58.8 (+0.9%) | 16.8/33.3 → 16.8/33.3 | 18 → 6 | 28,024.3 → 28,878.9 (+3.0%) | 6,090.8 → 6,228.5 (+2.3%) | 1/75 → 0/0 ms; 0 / 13 |

Las dos ejecuciones con el mismo código ya muestran variación apreciable: en reproducción densa sostenida el FPS cambió 0.9%, `TaskDuration` 3.0%, y el heap final pasó de 11.9 a 17.6 MB. No interpreto el heap final como fuga: la lectura de `performance.memory` es no estándar, no fuerza GC y las capturas retienen registros instrumentados de miles de fuentes. En el escenario de cambios automatizados, los cuadros lentos y una tarea de 52 ms (primera captura) / 0 tareas largas (repetición) dependen en parte de que el harness ejecuta cuatro cambios casi seguidos; no equivalen a una interacción humana pausada.

El scheduler mantuvo cero inicios atrasados en ambas corridas, con mínimo de adelanto de 11–53 ms en la prueba larga, un `AudioContext` y pico de 13 voces. En la segunda corrida se programaron 2,667 fuentes en 120 s. La memoria de buffers/muestras se carga bajo demanda: reposo 0 bytes; compás libre transfirió 107,216 bytes en 4 WAV; Funk con batería/bajo llegó a 594,732 bytes y 9 WAV; el catálogo activado por la secuencia de presets llegó a 720,592 bytes y 12 WAV. La medición de decodificación en una pasada breve separada observó 4 buffers / 460,792 bytes PCM / 16.0 ms tras compás libre; 9 / 1,518,304 bytes / 65.7 ms al seleccionar Funk; y 12 / 1,790,032 bytes / 73.7 ms tras añadir otros bancos. Son mediciones Chrome desktop instrumentado, no latencia de red o decodificación Android.

Una captura adicional con muestreo de heap cada segundo duró 120.1 s: 122 muestras, 12.38 MB iniciales, 14.25 MB finales, mínimo 6.90 MB y máximo 30.14 MB; en ese mismo ensayo hubo 156 intervalos de frame mayores de 50 ms y 2 tareas largas (227 ms total; máximo 136 ms), pero cero inicios de audio tardíos. Esta ejecución tuvo más variación que las dos anteriores y el muestreador/recordatorio de fuentes añade overhead. No se usa como evidencia de fuga ni de rendimiento móvil; conserva la evolución observada y requiere traza física para investigar la aparente presión visual del host.

El [resumen JSON con escenarios, corridas repetidas, decodificación, heap y el candidato visual descartado](evidence/performance-phase3/summary.json) conserva los valores completos sin los miles de registros por voz. Los reportes brutos instrumentados permanecen fuera del repositorio en `/private/tmp/ritmia-phase2-perf-baseline-complete`, `/private/tmp/ritmia-phase3-perf-repeat`, `/private/tmp/ritmia-phase3-decode-measure`, `/private/tmp/ritmia-phase3-final` y `/private/tmp/ritmia-phase3-final-memory`.

Se probó una alternativa visual con un halo SVG reutilizado por pista. Quitó las mutaciones `childList` (por ejemplo, 4,550 → 0 en 120 s), pero elevó las mutaciones de atributos (25,718 → 35,997) y no produjo una mejora repetible de cuadros o CPU; una corrida candidata dio 51.3 FPS, p95 33.3 ms, cinco long tasks y un inicio tardío frente a dos corridas del mismo código con 58.3/58.8 FPS, p95 16.8 ms y una/ninguna long task. La alternativa se descartó y no forma parte de este cambio. No hay una optimización de playback que la evidencia emulada justifique publicar todavía.

El harness registra mutaciones del SVG como indicador de cambios DOM, no cuenta commits React directamente. La inspección del contexto confirma que la presentación móvil publica progreso a un máximo de 24 Hz y el audio permanece independiente; no se añadió un React Profiler al build de producción para evitar que la propia instrumentación sesgue la medición. Las muestras WAV se descargan de forma diferida; el resultado reporta bytes y duración acumulada de decodificación. Sincronización, scheduler, patrones y AudioEngine no se modificaron durante esta fase.

### Estado de Android y traza manual

No dispongo de un teléfono Android conectado ni de una sesión DevTools remota. **Chrome Android queda pendiente de verificación física**; no se marca como resuelto por estas cifras. Usá [la guía de depuración remota USB](android-chrome-audio-test.md) con la versión publicada y registrá modelo, Android/Chrome, consola y traza para estos casos: compás libre, Maqsum/darbuka, Funk/bajo, A+B, máxima densidad, cambios de BPM/preset y dos minutos continuos. La guía cubre además pantalla apagada/segundo plano y revisión de requests y memoria.
