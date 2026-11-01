# Lenguaje de movimiento de Ritmia

Gramática propuesta para comunicar eventos rítmicos mediante movimiento. Es una
especificación de diseño, no una implementación. No modifica la lógica musical,
el scheduler ni el reloj de audio.

## 1. Reglas generales

### Fuente temporal

El tiempo musical debe seguir siendo el del `AudioContext` existente:

- `AudioEngine.schedule()` programa posiciones con `AudioContext.currentTime`,
  consulta una ventana de 100 ms y se ejecuta mediante un intervalo de 25 ms.
- `RitmiaContext` consulta el estado de audio con `requestAnimationFrame`,
  deriva la posición y el progreso de las notas programadas y actualiza
  `currentBeatA/B` y `progressA/B`.
- El resaltado actual de posición usa una ventana inferior a 50 ms desde el
  evento. Si “Modo seguro” está activo y BPM supera 130, no ilumina pulsos
  distintos de acento fuerte. El audio sigue sin cambios.

La implementación visual puede interpolar entre muestras para mostrar
progreso; no puede usar el tiempo de una transición CSS o un temporizador de
pantalla como autoridad musical. Un callback visual tardío no debe reprogramar
audio ni alterar la fase.

### Convenciones

- **Evento musical** es una posición programada de A o B. La posición existe
  aun cuando su estado de acento sea silencio.
- **Estado configurado** (silencio/suave/fuerte) es información estable del
  patrón; **posición activa** es información temporal. No fusionarlos.
- Una señal visual de posición no debe prometer que hubo sonido. En particular,
  el metrónomo puede generar woodblock al inicio de A aunque el acento de esa
  posición sea silencio.
- Intensidad visual no equivale directamente a volumen acústico ni a
  percepción universal. El Morph cambia ganancias relativas, no el patrón.
- Un grupo es una delimitación calculada desde la agrupación válida; hoy no
  existe un evento de audio disparado por sus límites.
- Nunca representar una subida de pitch: Ritmia se ocupa de ritmo, no de
  melodía ni de alturas tonales.

## 2. Tabla de gramática por evento

Los valores de duración son objetivos iniciales para prototipos, subordinados
al evento y al tiempo disponible hasta la siguiente posición. No son promesas
de tiempo real ni nuevas reglas del motor. El diseño debe evitar que una
respuesta visual se prolongue hasta invadir el pulso siguiente.

| Caso | Evento que inicia | Qué comunica | Forma y dirección propuesta | Intensidad / regla temporal | Color y textura | BPM alto | Movimiento reducido | Riesgos de accesibilidad |
|---|---|---|---|---|---|---|---|---|
| Pulso / posición | Cada nota programada de A o B, también si su acento es 0 | Qué posición del ciclo está activa, no necesariamente que suena un golpe | Un nodo recorre la trayectoria o un segmento se delimita; dirección siempre coherente y fija dentro del ciclo | Marca breve de hasta ~50 ms, alineada al estado actual, sin persistencia CSS independiente | Color de pista A/B y borde sólido; textura estable | No multiplicar flashes. Reducir a posición resaltada estable si las posiciones son muy cercanas | Ningún desplazamiento; indicar posición activa por contorno/índice | Confundir posición con sonido; animación demasiado breve para baja visión |
| Acento fuerte | Posición A/B con `accent === 2` | El patrón tiene un acento fuerte configurado en esa casilla | Expansión radial pequeña o aumento de grosor hacia fuera, luego retorno simple | Un único impulso discreto, sin rebote; dentro de la ventana del evento, tope visual inicial ~100 ms | Color de pista más `accent-strong`; halo limitado | A 200 BPM no crear pulsos sucesivos de zoom; preferir borde persistente durante la ventana activa | Cambiar solo el peso/borde estático; mantener etiqueta “fuerte” | Flash/escala repetida puede molestar; brillo no es medida del nivel sonoro |
| Acento suave | Posición con `accent === 1` | Hay un sonido suave configurado; A usa bajo y B hi-hat | Ondulación pequeña o contorno interno que aparece y se disuelve, sin expansión grande | Menor amplitud visual que fuerte; máximo ~80 ms como objetivo inicial | Color de pista con trama/punto secundario; no codificar por baja opacidad sola | Aplicar la regla actual: sobre 130 BPM, Modo seguro omite el resalte no fuerte; con independencia del modo, simplificar animación rápida | Mantener icono/patrón de “suave” y estado activo sin movimiento | No depender de diferencias sutiles de brillo/color; sonido y animación pueden no percibirse igual |
| Silencio | Posición con `accent === 0` | La posición existe, pero no dispara sonido de acento de pista | Mantener nodo vacío/contorno discontinuo; marcar posición activa con un pequeño contorno, no con una explosión | Sin respuesta de impacto ni halo que sugiera ataque sonoro; señal temporal igual de localizable que otras posiciones | Color neutro más identidad A/B por trazo/etiqueta | Evitar destacar todos los silencios uno tras otro; en alto BPM usar marcador de fase estable | Sin animación; forma vacía y texto accesible “silencio” | Una casilla invisible se puede perder; un pulso visual fuerte sugeriría sonido inexistente |
| Inicio de ciclo A | Posición 0 de A al iniciar/repetir ciclo | Comienza un nuevo ciclo de A | Marca de origen más definida en el anillo (muesca/índice “1”), sin barrido luminoso | Señal puntual vinculada al paso A 0; no inventar inicio equivalente de B si no corresponde al ciclo activo | `track-a`, marca de inicio y etiqueta “A · 1” | Una forma estática de origen evita parpadeo rápido | Índice/contorno estático; anunciar solo si hay una necesidad de estado, no cada ciclo en lector de pantalla | Si el metrónomo está activo puede sonar woodblock incluso con silencio A; no asociar la señal exclusivamente al acento |
| Agrupación aditiva | Cambio de configuración válida o lectura del límite de grupo durante el avance | Qué posiciones integran cada grupo | Arcos/segmentos con divisores visibles; la posición actual atraviesa el grupo sin “saltar” al siguiente | La estructura permanece estática; el seguimiento del nodo sigue el reloj de audio. No animar cada grupo como un acento | Paleta de grupos con patrón o grosor complementario y numeración opcional | No alternar color por cada límite a alta velocidad | Límites y etiquetas permanecen visibles; sin barrido | El color puede confundirse con sonido/acento; los grupos son visuales y no alteran acentos actuales |
| Polirritmia | Posiciones A/B según sus tiempos programados en modo `polirritmia` | B adapta su ciclo para compartir la duración del ciclo de A; pasos pueden ocurrir en distinta cantidad | Dos trayectorias o marcadores recorren fases derivadas de cada pista; no sincronizar artificialmente cada paso | Cada pista sigue `stepA/stepB` y sus ciclos; el modo no crea acentos | A/B por color y trazo diferente; formas de pulso según estado real | Evitar animación decorativa adicional; conservar estados estáticos distinguibles | Mostrar ciclo y posiciones sin movimiento continuo | Simplificar a una pista puede ocultar la relación; razón debe leerse en texto |
| Polimetría | Posiciones con duraciones de unidad propias en modo `polimetria` | Cada unidad mantiene su duración métrica; ciclos A/B pueden durar distinto | Dos marcadores recorren barras/anillos independientes que pueden quedar desfasados | Fases/progreso se derivan de `currentBeat`/`progress` y timing, no de una tween que presuponga duración igual | Identidades A/B constantes | Cuando los pasos se acercan, evitar “latido” rápido; mantener progreso legible y mostrar números | Barras estáticas con posición actual o porcentaje accesible; sin movimiento de fase | El desfase visual puede parecer error; texto debe aclarar que ciclos independientes son intencionales |
| Reencuentro de ciclos | Primer encuentro positivo de inicios de ciclo desde un inicio conjunto, según `timing.reunionA/B` | Momento calculado en que vuelven a coincidir los inicios de compás/ciclo | Marcar la coincidencia con una unión breve de contornos o un indicador textual, sin destello | Evento derivado de duraciones/ciclos; permitirlo solo si la fase actual permite confirmar el origen común. No usar el t=0 inicial como “reencuentro” | A y B convergen visualmente sin mezclar su identidad | Si hay reencuentros frecuentes, indicador sobrio sin repetición luminosa | Mostrar “Reencuentro calculado” y razón; sin convergencia animada | Tras cambiar ajustes en reproducción, la fase heredada puede no coincidir con una configuración recién calculada; evitar afirmación falsa |
| Morph | Cambio del valor `morphAmount` por acción del usuario | Balance de ganancia entre A/B; no cambio de tempo, acentos ni fase | Variar una barra de balance o área relativa de dos formas; no mover pistas de izquierda a derecha como si hubiera paneo | Respuesta ligada al cambio del control, con transición corta y no repetitiva; no se dispara por cada nota | Balance visual A/B con color y etiquetas, nunca mezclar semánticas | Mantener indicador estático; no hacer oscilación automática | Mostrar porcentaje y balance sin transición | El término puede parecer transformación del ritmo; explicar que mezcla ganancia. Valores de volumen individuales también influyen en la salida |
| Patrones de clave | Ataques reales del array seleccionado en modo `clave` | Ubicación de posiciones fuertes/suaves de ese patrón concreto | Resaltar las posiciones reales de la grilla de B; conservar silencios como nodos vacíos; lectura lineal además del anillo | Derivar solo de `CLAVE_PATTERNS`; no inventar un trazo que agregue ataques | B más marcas de acento fuerte/suave; nombres Son/Rumba/Bossa/Shiko en texto | Evitar brillo por cada ataque próximo; conservar estructura estática y marcador activo | Mostrar patrón completo y nombre, sin pulsación animada | Son/Rumba tienen ciclos canónicos de 16 posiciones en ocho negras; Bossa/Shiko usan otra adaptación. No generalizar ni codificar convenciones culturales como decoración |
| Reproducción | Inicio confirmado del transporte; el primer audio comienza tras el offset programado existente | El sistema está reproduciendo | El centro deja estado detenido y el indicador de fase comienza con el reloj de audio | Transición discreta de estado; no iniciar antes de que exista reproducción efectiva | Color de estado y etiqueta Play/Stop | No variar continuamente el centro | Estado “Reproduciendo” persistente y barra/fase estática o accesible | No confiar en color/punto solamente; cambio accesible anunciado una vez |
| Detención | `stopPlayback()` y reset visual actual | La reproducción está detenida y los indicadores de beat/progreso vuelven a reposo | Detener marcador, volver al estado de inicio y dejar el patrón visible | Sin animación de rebobinado que sugiera que el audio sigue; la implementación actual es Stop, no pausa reanudable | Estado neutral, sin halo activo | Sin actividad visual residual | Reposo inmediato o reducción de transición | Llamar “pausa” puede prometer reanudación; no mover foco ni cambiar el patrón |

## 3. Detalle por concepto

### Pulso, acentos y silencios

La grilla actual conserva posiciones en todos los estados. Al reproducir, el
contexto resalta una posición reciente incluso cuando su acento es silencio;
ese resalte significa “posición actual”, no “sonido”. El patrón configurado
permanece legible antes y después de reproducir.

En A, acento suave dispara bajo y fuerte bombo. En B, suave dispara hi-hat y
fuerte caja. La animación puede diferenciar esos estados semánticos, pero no
debe simular amplitudes acústicas que no mide. El volumen de pista y Morph
afectan la mezcla real; la apariencia no debe prometer audibilidad en todos
los dispositivos.

### Agrupación

Una agrupación válida distribuye posiciones en grupos cuya suma coincide con
el numerador. Sus límites son información geométrica/editorial. Hoy no generan
automáticamente nuevos acentos audibles. En futuras animaciones, el límite de
grupo puede funcionar como separador fijo o etiqueta, pero no como “golpe”
animado salvo que se añada una función musical explícita en otra tarea.

### Polirritmia, polimetría y reencuentro

- En polirritmia, B se adapta para compartir la duración del ciclo A.
- En polimetría, las unidades conservan el valor temporal métrico propio y los
  ciclos pueden tener distinta duración.
- Los marcadores de A y B deben usar sus propios pasos y progresos calculados.
  No se debe interpolar B con el tempo de A si el modo mantiene tiempos
  independientes.
- `timing.reunionA`, `timing.reunionB` y `timing.reunionSec` describen un
  reencuentro calculado desde inicios conjuntos. Si parámetros cambian durante
  la reproducción, no asumir que la fase en curso se reanuda desde ese origen.
  Hasta que el estado de fase confirme el evento, es más correcto mostrar la
  relación calculada sin animar una coincidencia audible.

### Morph y clave

Morph modifica la ganancia de A por `(1 - morph)` y de B por `morph`; el patrón
y el tempo no cambian. Una visualización de balance debe ser explícita y no
sugerir paneo o desplazamiento espacial.

Los patrones de clave usan sus arrays de acentos reales. Son y Rumba tienen
ciclo canónico de 16 posiciones / ocho negras (equivalente a dos compases de
4/4); Bossa y Shiko tienen patrones de ocho posiciones y conservan la
adaptación prevista por la aplicación. La gramática visual se deriva de las
posiciones y acentos; no asigna significado adicional ni uniforma todos los
ciclos.

## 4. Intensidad y control por tempo

El BPM permitido es 40–200. La duración real entre pasos depende del compás y
del modo, no solo del BPM; no diseñar un umbral visual universal basado
únicamente en una cifra.

- A tempo bajo, el estado debe permanecer disponible en forma estática entre
  eventos; no hacer que un halo lento se confunda con una fase en curso.
- A tempo medio, cada evento puede tener una respuesta breve y única.
- A tempo alto, simplificar: quitar partículas reactivas, rebotes, expansiones
  repetidas y cambios de color; dejar un marcador de posición estable o una
  lectura de progreso.
- El toggle actual “Modo seguro” suprime visualmente acentos que no sean
  fuertes cuando BPM > 130. Conservar su alcance real mientras exista; no
  reinterpretarlo como filtro de audio ni como garantía médica.
- Nunca acumular eventos atrasados para reproducir muchos flashes cuando la
  pestaña vuelve del fondo. La vista recupera el estado actual desde el reloj,
  sin animación retrospectiva.

## 5. Movimiento reducido y bajo destello

El sistema ya tiene un toggle “Reducir movimiento” y respeta
`prefers-reduced-motion`. En ese estado:

- No escalar, girar, desplazar ni hacer pulso repetitivo.
- Mantener anillos, progreso, límites de grupo, estado de acento y pista activa
  mediante contornos, etiquetas, iconos o valores.
- El cambio de posición puede actualizarse sin transición; una forma estática
  equivalente no debe perder información.
- Evitar que la preferencia del sistema quede anulada por una configuración
  interna. Si ambas difieren, diseñar una regla de precedencia antes de
  implementar presets.

Bajo destello es un requisito de base, no solo un modo optativo. No usar
alternancia rápida de luminancia, flashes blancos, parpadeo repetitivo ni
campos de color que se enciendan y apaguen a cada subdivisión. El ajuste futuro
“Bajo destello” puede reducir aún más elementos animados, pero no debe ser la
única protección.

### Lista de revisión de accesibilidad

- Toda señal animada tiene equivalente estático y textual.
- La información nunca se codifica solo por color, tamaño, glow o movimiento.
- El movimiento no obliga a perseguir un marcador para entender la fase.
- No anunciar cada pulso repetidamente a un lector de pantalla; anunciar
  cambios de reproducción/configuración y proporcionar una descripción
  estática consultable.
- La densidad visual y el tamaño de controles siguen siendo utilizables con
  zoom y en 320 px.
- El foco de teclado es visible y no queda oculto por scroll, glow o clipping.
- La actividad no cambia layout ni produce zoom automático.

## 6. Arquitectura de implementación (sin implementar)

1. Mantener `AudioEngine` y la política temporal intactos.
2. Consumir el estado realtime ya publicado por `RitmiaContext` para las
   posiciones y el progreso.
3. Derivar grupos y estados de acento de los datos existentes. Nunca calcular
   ataques a partir de colores o de una animación previa.
4. Usar SVG para ciclos y señales geométricas funcionales; CSS/Styled
   Components para superficie, estado y transiciones discretas.
5. Probar Canvas 2D solo para decoración de partículas si un perfil demuestra
   que aporta más que CSS/SVG. Canvas debe quedar fuera de la fuente de verdad
   y tener alternativa DOM/textual.
6. Usar una semilla determinista para variaciones decorativas; el render no
   altera patrón, posiciones, agrupación ni distribución de controles.
7. Eliminar o reducir ornamento automáticamente bajo movimiento reducido, alta
   densidad de pulsos o limitación de rendimiento, preservando la información.

No se recomienda WebGL/Three.js por defecto: la tarea es visualizar ciclos y
posiciones bidimensionales; complejidad, peso, fallback y accesibilidad no se
justifican sin evidencia de una necesidad adicional.

## 7. Validación de movimiento

### Sincronización y claridad

- Probar la posición visual contra `AudioContext.currentTime`/eventos
  programados, no solo contra grabación de pantalla. Medir desfase sostenido y
  jitter en varias ejecuciones y dispositivos.
- Probar pulsos con acento fuerte, suave y silencio; verificar que el marcador
  puede señalar una posición silenciosa sin presentarla como sonido.
- Cambiar tempo y modo durante reproducción; confirmar que la animación sigue
  el estado vigente sin rebobinar ni inventar reencuentros.
- Validar por escucha humana que las señales no afirman que agrupación añada
  acentos y que Morph se entiende como mezcla de ganancia.

### Rendimiento, extremos y dispositivos

- Medir 40 y 200 BPM, ciclos cortos/largos, 32 posiciones y dos pistas a la
  vez. Medir frame time, uso de CPU/memoria y coste de filtros.
- Probar al menos 320, 375, 768 y 1280 px, zoom y rotación. La página no debe
  desplazarse horizontalmente; una grilla larga sí puede hacerlo internamente.
- Probar vuelta desde pestaña inactiva y reducción de frames: mostrar estado
  actual, nunca una secuencia acumulada de pulsos.
- Revisar contraste de estados detenidos/activos y de colores de grupo en
  pantallas distintas.

### Accesibilidad y seguridad visual

- Comprobar `prefers-reduced-motion` del sistema y toggle interno, incluidos
  los modos de dos pistas.
- Revisar video/capturas con análisis de flashes y cambios de luminancia; la
  experiencia por defecto no debe contener flashes ni parpadeo rápido.
- Validar teclado, lector de pantalla, foco, etiquetas de estados y alternativas
  textuales.
- Probar con personas usuarias con distintas sensibilidades visuales. Los
  análisis automatizados no sustituyen una evaluación humana ni certifican
  seguridad médica.

### Regresión

La dirección visual no justifica borrar ni flexibilizar pruebas existentes:
unitarias, build, lista y ejecución E2E cuando haya navegador compatible,
responsive, keyboard reachability, scroll interno de grillas, modales y
recorrido de nivel. Nuevas pruebas deben cubrir correspondencia de estado,
preferencias de movimiento y estructura responsiva que introduzca el rediseño.

## 8. Implementación Art 08D.2

La capa dinámica consume `AudioContext.currentTime` y la cola ya existente de
`AudioEngine.scheduledNotes`, expuestas por el contexto realtime. No añade
eventos ni modifica el motor. Un impacto solo se representa cuando la nota ya
alcanzó su timestamp, su acento es suave/fuerte y la ganancia de pista (incluido
Morph) es mayor que cero. Las posiciones silenciosas conservan el marcador de
fase, pero no producen onda ni rebote.

La implementación contiene:

- Fluidez ambiental de tres filamentos, con desplazamientos máximos de 1.7 y
  1.25 unidades SVG y giro de hasta 0.16°. Se deriva del reloj de audio; pausa
  lo congela, reset lo devuelve al origen y movimiento reducido lo desactiva.
- Rebote local y una onda de contorno sin blur: duración máxima de 160 ms en
  acento fuerte y 110 ms en suave, siempre limitada al 72% del paso real de esa
  pista. La intensidad suave es menor; Morph y el volumen reducen o eliminan
  la respuesta visual junto con la ganancia configurada.
- Un máximo de cuatro impactos recientes. Se omiten tanto el ambiente animado
  como los impactos desde 160 BPM, con pasos menores a 180 ms o cuando el
  patrón visible suma 48 posiciones o más. El marcador de fase permanece, por
  lo que la estructura no se pierde cuando se reduce el ornamento. La capa
  decorativa muestrea el reloj a 30 Hz (hasta 33 ms de cuantización visual);
  fase y transporte conservan la actualización realtime existente.

No se incorporó explosión de partículas: no es necesaria para expresar el
evento y añadiría mutaciones/densidad sin una ventaja medida. La geometría
musical estática se conserva memoizada. En pantallas de hasta 520 px el marco
del arte se vuelve más alto y usa recorte centrado; el trazado funcional queda
dentro del área visible.

La duración y los umbrales son límites conservadores de presentación, no
garantías de sincronización perceptual ni medidas de volumen. Los perfiles
automáticos no sustituyen la evaluación auditiva y artística humana.
