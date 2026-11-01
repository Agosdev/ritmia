> Registro histórico de 09A. La organización vigente y las funciones retiradas se documentan en `10-cierre-ritmia.md`.

# 09A — Visualizadores musicales opcionales

Base: `8e7c25d`. La Tarea 10 está suspendida. No se eliminan Art, el laboratorio, sus rutas de desarrollo, sonidos, preferencias ni ejercicios. No se cambia la identidad ni el diseño aprobado de la interfaz.

## Integración

`OptionalMusicVisualizer` sustituye únicamente el punto de montaje del visualizador dentro de la pantalla principal. El clásico original no se modifica y se muestra en cada apertura. El selector contiene Clásico, Rebote 2D y Órbita 3D; el botón permite desactivar el modo especial y volver a activar el último modo elegido. La preferencia no se guarda entre visitas.

Los modos especiales usan `React.lazy`. Three.js solo se importa en `createOrbitRenderer`, después de que el usuario active 3D. No hay React Three Fiber, controles orbitales adicionales, postprocesado, texturas externas ni nuevas bibliotecas de animación. Three.js 0.187.0 es la única dependencia añadida; el lockfile conserva su formato y las entradas anteriores. Se incluye su licencia MIT en `public/licenses`.

## Sincronización y límites musicales

`musicFrame.js` lee `AudioEngine.getCurrentAudioTime()`, `scheduledNotes`, parámetros actuales y cursores de programación. No escribe en el motor, no ejecuta sonidos ni cambia cálculos de duración. La interpolación representa la fase entre eventos conocidos; no es un nuevo cálculo de la métrica musical.

Los impactos solo se producen para eventos A/B que ya alcanzaron su timestamp y tienen acento suave/fuerte y ganancia configurada mayor que cero. Los silencios, futuros, reset y pistas silenciadas por Morph no generan impactos. B solo se muestra en el nivel 3. Los suaves tienen menor amplitud; la respuesta se escala con volumen y Morph. La ganancia usada es la configurada, no una medición del volumen acústico ni de la envolvente de cada WAV.

En 2D cada golpe real inicia un rebote de altura parabólica y una deformación transitoria. El regreso al apoyo no dispara una segunda onda: no se inventa un golpe al aterrizar. La duración del gesto se acota entre 35 y 800 ms, normalmente al 90% del paso de la pista; en subdivisiones muy rápidas se limita su amplitud visible. En 3D la esfera sigue la fase de su anillo; el impacto y la deformación expresan el evento audible. La fase puede avanzar sobre un silencio sin que aparezca un impacto. La preferencia existente de modo seguro mantiene su regla: por encima de 130 BPM, los acentos suaves no disparan luces de impacto; su fase y su movimiento siguen representando el ritmo.

La pausa usa el mismo reloj congelado del AudioContext. Reset vacía los eventos en el motor existente y devuelve la representación al origen. Al volver de una pestaña oculta se dibuja el instante actual del audio; no se reproduce una cola visual atrasada.

## Renderizado y accesibilidad

Canvas 2D usa gradientes locales, sombras de contacto y dos pelotas como máximo. Órbita usa dos anillos, esferas, marcadores instanciados y ondas de impacto reutilizadas. No hay asignación de geometrías por golpe ni mapas de sombras o blur de pantalla completa.

El dibujo de los modos especiales se limita a 30 Hz y se realiza imperativamente, sin enviar un estado React por frame. El estado de configuración/transporte existente se conserva. El DPR se limita a 1,5/2 en Canvas y 1,25/1,5 en WebGL según el ancho. Los shaders y los datos de instancias se reutilizan.

`prefers-reduced-motion` se aplica aunque la opción manual previa no esté marcada. En ese modo no hay parábolas, squash, impactos luminosos ni rotación decorativa; la escena es estable y sus datos se actualizan a baja frecuencia. Se conservan etiquetas, estado textual, controles nativos, foco y navegación por teclado. Las pistas se identifican por A/B y por anillo interior/exterior, además del color.

Se desconectan ResizeObserver y listeners de visibilidad y pérdida de contexto. Se cancelan RAF y timers. Al desmontar se liberan geometrías, materiales, buffers de instancias, listas de render y renderer; se pierde intencionalmente el contexto WebGL. Si el import termina después de desmontar, una señal de cancelación impide crear la escena. El código del módulo importado puede permanecer en la caché JS del navegador; eso no equivale a conservar recursos GPU.

## Reproducción de mediciones

Con Node 22, Chrome local y los servidores de preview correspondientes:

```sh
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node scripts/visualizer-performance.mjs
```

`VISUAL_BASELINE_URL`, `VISUAL_CURRENT_URL` y `VISUAL_EVIDENCE_DIR` permiten indicar servidores y carpeta. El script compara secuencialmente el build base y los tres modos a 375/1280 px, con patrones de 7/5 y 32/32 posiciones a 92/200 BPM. No fuerza todos los pasos a fuertes: conserva los acentos/silencios del patrón al cambiar el numerador. Registra carga, FCP, heap, trabajo JS/main thread, cadencia y recursos GPU. Produce capturas y videos WebM de cuatro segundos por modo especial, sin audio.

Las mediciones son de Chrome headless en este Mac, sin simular la CPU ni GPU de un teléfono. No certifican calidad auditiva, sincronización perceptual, latencia de salida ni rendimiento sostenido de un móvil físico. En ritmos con más eventos que cuadros disponibles, la imagen puede omitir golpes entre cuadros; el scheduler de audio es independiente.

Referencias técnicas: [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) y el código/licencia de Three.js instalado. WebGL 2 es necesario para esta versión; se ofrece fallback 2D.

## Validación final — 1 de noviembre de 2026

- Unitarios: 199 pruebas aprobadas en 19 archivos.
- E2E completos: 51 aprobados, incluidos los 13 nuevos de visualizadores. Estos 13 se repitieron satisfactoriamente después de los últimos ajustes de controles y modo seguro.
- Build local y build Pages (`npm run build -- --mode pages`): aprobados. `git diff --check`: sin errores.
- Preview `/ritmia/`: niveles 1/2/3, transporte y cuatro WAV decodificados a 375 y 1280 px; sin errores de consola, respuestas fallidas ni 404. Los parámetros de Art/laboratorio siguen sin abrir esas interfaces en producción.
- E2E nuevos: carga diferida, activación/desactivación, pausa/reanudación/reset, silencios/Morph, movimiento reducido, pestaña oculta, liberación de contexto, fallback WebGL y teclado/responsive a 320/375/768/1280 px.

No se modificaron AudioEngine, scheduler, contexto musical, fórmulas, Art, laboratorio, temas ni el visualizador clásico. Las pruebas verifican representación temporal y reproducción existente; no sustituyen una escucha humana ni demuestran calidad acústica por sí solas.

### Bundle y rendimiento

Tamaños medidos en bytes, compresión gzip calculada sobre los archivos finales:

| Módulo | Base | Actual | gzip actual |
| --- | ---: | ---: | ---: |
| Entrada principal | 296.563 | 300.190 | 90.814 |
| Rebote y runtime físico compartido | — | 6.432 | 3.115 |
| Entrada Órbita | — | 3.864 | 1.905 |
| Three.js, únicamente al activar 3D | — | 753.471 | 192.662 |

La entrada anterior comprimida ocupaba 89.748 bytes: incremento inicial de 1.066 bytes, aproximadamente 1,2 %. Ningún caso descargó Three.js al abrir la pantalla. Vite advierte del tamaño del chunk opcional de Three.js; no forma parte de la descarga inicial.

Se midieron 16 casos secuenciales. El p95 del RAF de pantalla fue 16,7–16,8 ms; el p95 del intervalo de dibujo especial fue 33,4 ms, consistente con el límite de 30 Hz. Este intervalo no mide latencia de audio. El heap observado de los modos especiales osciló aproximadamente entre 6,6 y 12 MiB, sin forzar recolección. Órbita usó siete geometrías, una textura interna y ocho/nueve draw calls.

No se afirma una reducción universal de CPU: en el patrón denso, el trabajo JS del clásico aumentó 24 ms aproximadamente durante una muestra de 1,5 segundos respecto de la base (12–15 %), sin empeorar el p95 de pantalla. Son muestras breves con variabilidad; la optimización profunda del estado global corresponde a la Tarea 10. La carga registrada incluye la espera de red inactiva y no equivale a TTI. Hace falta probar rendimiento sostenido, consumo y sincronización perceptual en un teléfono físico.

### Evidencia y archivos

Evidencia local final: `/private/tmp/ritmia-09A-evidence/`. `index.html` reúne las capturas antes/después, clásico y especiales a 375/1280 px. `performance.json` conserva las 16 mediciones. `bounce-motion.webm` y `orbit-motion.webm` muestran cuatro segundos de movimiento, sin audio; ambos fueron decodificados y se comprobó que contienen cambios de imagen. `video-verification.json` conserva ese resultado.

Archivos existentes modificados: `README.md`, `package.json`, `package-lock.json` y `src/components/layout/RitmiaLite.jsx`.

Archivos nuevos: este informe, `e2e/optional-visualizers.spec.js`, `scripts/visualizer-performance.mjs`, `public/licenses/three-MIT.txt`, `OptionalMusicVisualizer.jsx`, los ocho módulos de `src/components/visualizer/physical/` y las dos pruebas de `tests/visualizers/`. No se eliminaron archivos.

El respaldo externo `~/.local/share/ritmia-backups/2026-11-01_12-36-03-0300` conserva la base anterior a esta implementación: restauración verificada de 6.158 archivos/enlaces y nueva comprobación SHA-256 satisfactoria de todos sus contenedores y manifiestos. No se crearon commits ni se hizo push. Implementación detenida para revisión visual; la Tarea 10 sigue suspendida.
