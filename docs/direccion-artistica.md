# Dirección artística de Ritmia

Especificación previa al rediseño visual. Los valores son una propuesta de
sistema, no tokens implementados. El objetivo es preservar la lectura precisa
del ritmo mientras se construye una identidad orgánica, luminosa y
experimental. No incluye assets finales ni cambios de código.

## 1. Concepto y personalidad

### Concepto: un ecosistema de pulsos

Ritmia se presenta como un espacio oscuro donde los ritmos dejan huellas
visibles: anillos, fibras, agrupaciones y partículas contenidas sugieren
repetición, acento y relación entre ciclos. La metáfora es orgánica y
bioluminiscente, pero la interfaz no debe parecer un instrumento de afinación
ni una herramienta para componer melodías. El centro conceptual es el **ritmo**:
posiciones, silencios, acentos, tempo, agrupaciones y ciclos.

La referencia local `design-references/ritmia-referencia-artistica.jpg` fue
inspeccionada. Tiene un fondo muy oscuro y formas abstractas luminosas,
contornos concéntricos, figuras alargadas, halos y textura de puntos; combina
corales, rosas, azules, verdes y amarillos. Inspira el vocabulario de forma,
profundidad y luz, pero no se reproducirá ni se usará como fondo.

### Personalidad

- **Expresiva, no caótica:** riqueza de formas con jerarquía clara.
- **Musical, no tonal:** el color y la forma identifican pistas, estados y
  agrupaciones; no asignan alturas, notas, escalas ni armonías.
- **Pedagógica, no infantil:** explica sin simplificar falsamente conceptos.
- **Experimental, no impredecible:** el detalle decorativo puede variar bajo
  reglas estables, pero los controles y datos nunca cambian de sitio.
- **Accesible, no dependiente del espectáculo:** información disponible sin
  animación, color o percepción auditiva específica.

## 2. Principios de composición

1. **Primero el patrón:** los controles y las posiciones rítmicas ocupan el
   área de mayor contraste y claridad. El arte crea contexto alrededor, no
   compite con los pulsos.
2. **Centro legible, periferia atmosférica:** reservar las superficies detrás
   de texto, sliders y grillas para fondos relativamente calmos. Concentrar
   textura, filamentos y halos en bordes, fondos amplios y áreas vacías.
3. **Una señal, un significado:** cada forma, color y movimiento tiene una
   función definida. Evitar que el mismo color indique simultáneamente pista,
   acento y estado de validación.
4. **Ritmo visible también en pausa:** una composición estática debe explicar
   el patrón; el movimiento solo añade información temporal.
5. **Diseño adaptable:** el visualizador conserva proporción, se refluye en
   móvil y no depende de un lienzo ancho ni de una imagen de fondo.
6. **Densidad escalonada:** destacar primero A; incorporar agrupaciones y B
   según el nivel musical sin borrar las opciones avanzadas.

## 3. Paleta cromática propuesta

Un tema oscuro único. Los colores saturados se usan como acentos y no como
grandes superficies brillantes. Los valores siguientes son tokens iniciales;
deben comprobarse con mediciones de contraste en sus combinaciones reales.

| Token propuesto | Valor | Función |
|---|---|---|
| `abyss` | `#090B10` | Fondo principal, negro azulado sin ser negro puro. |
| `night` | `#0E121A` | Segundo plano y zonas de transición. |
| `surface` | `#151B25` | Paneles y superficies de lectura. |
| `surface-raised` | `#1D2633` | Controles elevados, selección y popovers. |
| `surface-active` | `#263342` | Estado activo que no dependa únicamente del glow. |
| `line` | `#394555` | Bordes y separadores. |
| `text-primary` | `#F4F2F5` | Texto principal. |
| `text-secondary` | `#C2C5D0` | Descripciones y etiquetas secundarias. |
| `text-muted` | `#9AA4B3` | Información auxiliar; validar su contraste antes de usar en cuerpo pequeño. |
| `track-a` | `#FF806F` | Identidad de A: coral cálido, trazo y controles asociados. |
| `track-a-soft` | `#FFB08A` | Variante más clara para foco o superficie de A. |
| `track-b` | `#69D8F2` | Identidad de B: azul turquesa eléctrico. |
| `track-b-soft` | `#A3EAF5` | Variante clara para foco o superficie de B. |
| `accent-strong` | `#FFC56E` | Señal de acento fuerte y acciones principales; no sustituye al color de pista. |
| `accent-soft` | `#C5A8FF` | Señal auxiliar para acento suave cuando no se confunda con un grupo. |
| `silence` | `#788494` | Estado de silencio con forma y etiqueta; no representarlo solo con baja opacidad. |
| `group-1` | `#FFB86B` | Primer tono del conjunto de grupos. |
| `group-2` | `#E889B5` | Segundo tono del conjunto de grupos. |
| `group-3` | `#B8A0FF` | Tercer tono del conjunto de grupos. |
| `group-4` | `#75D5C5` | Cuarto tono del conjunto de grupos. |
| `group-5` | `#8FB8FF` | Quinto tono del conjunto de grupos. |
| `feedback-success` | `#83D6A9` | Confirmación, acompañada por icono/texto. |
| `feedback-warning` | `#FFD27A` | Aviso, acompañado por icono/texto. |
| `feedback-error` | `#FF929C` | Error, acompañado por icono/texto. |
| `focus` | `#FFF0A8` | Contorno de foco visible sobre superficies oscuras y colores de pista. |

### Reglas semánticas

- A y B conservan identidades distinguibles también sin color: A puede usar
  trazo continuo/circular y B trazo doble o discontinuo, además de sus
  etiquetas “A” y “B”. No asumir percepción del color.
- El color de acento fuerte/suave comunica intensidad del patrón configurado,
  no volumen medido ni una garantía de percepción sonora. El valor numérico o
  etiqueta accesible sigue presente.
- Los colores de grupo rotan dentro de una paleta accesible, pero no identifican
  permanentemente grupos universales ni equivalen a acentos. Complementar con
  límites, índices, variación de trazo o marcas divisorias.
- Los colores de feedback no se reutilizan para pistas o grupos en el mismo
  contexto.
- No resolver contraste aumentando el glow: usar luminancia del texto,
  superficie y borde. Objetivos mínimos: 4.5:1 para texto normal, 3:1 para
  texto grande y componentes/gráficos esenciales, sujeto a verificación.

## 4. Fondo, textura y luz

### Fondo

Usar capas sobrias de gradientes radiales de muy baja opacidad para crear
profundidad. Las masas luminosas pueden sugerir organismos o campos rítmicos,
pero deben ser estáticas o cambiar lentamente y quedar fuera de las áreas de
lectura. No utilizar la obra de referencia ni una imagen que simule el
visualizador funcional.

### Grano

El grano debe ser fino, uniforme y apenas perceptible: opacidad objetivo del
orden de 2–4% sobre el fondo, sin parpadeo ni desplazamiento continuo. Preferir
una textura pequeña reutilizable o una capa CSS ligera antes de renderizar
partículas. Si se usa ruido generado, su semilla debe ser fija por sesión o
componente y no volver a sortearse en cada frame.

### Glow y blur

- El glow sirve como halo contextual de una pista o pulso activo; un solo halo
  difuso y corto es preferible a varias capas brillantes.
- Mantener bordes, texto y puntos funcionales nítidos. Blur decorativo no debe
  reducir contraste, ocultar límites de controles ni filtrarse sobre texto.
- No animar continuamente el brillo o la opacidad. No usar destellos, inversión
  rápida, bloom pulsante ni flashes blancos.
- Aplicar `backdrop-filter` solo cuando el beneficio sea visible y el fallback
  opaco conserve contraste y rendimiento.

## 5. Tipografía y jerarquía

Conservar una sans serif legible como tipografía de interfaz y reservar la
monoespaciada para números, conteos y valores temporales. Una serif editorial
puede aparecer en títulos breves, no en grillas, sliders ni explicaciones
largas. No usar fuentes display que confundan `1`, `I`, `0` u otros valores.

Jerarquía sugerida:

1. Título de sección y control primario: 20–28 px, según viewport.
2. Texto de lectura y explicación: 16–18 px en escritorio y móvil; evitar que
   el cuerpo funcional dependa de la escala diminuta usada hoy en algunos
   paneles.
3. Etiquetas y metadatos esenciales: 13–14 px como base; no reducir para
   acomodar una estética técnica.
4. Conteos de pulsos: tamaño suficiente para distinguir números en grillas
   densas; en patrones largos, ofrecer foco/zoom/desplazamiento, no texto
   ilegible.

Las escalas son objetivos de diseño, no tamaños implementados. El zoom del
navegador y el reflow móvil no deben romper jerarquía ni controles.

## 6. Superficies y componentes

- **Paneles:** superficies opacas o casi opacas (`surface`), borde fino y
  radios moderados. Evitar tarjetas idénticas anidadas sin jerarquía.
- **Controles:** fondo distinguible de la superficie contenedora, estado
  seleccionado explícito, hit area cómoda y foco independiente del hover.
- **Grilla:** celdas consistentes y límites claros; estados de silencio, suave y
  fuerte difieren en símbolo/contorno además de color. En grillas largas,
  scroll interno con foco y desplazamiento predecible.
- **Visualizador:** espacio propio, proporción constante y leyenda textual.
  Los anillos describen A/B y las posiciones, no alturas musicales.
- **Badges:** solo información corta útil en contexto; especificaciones
  internas no compiten con la lectura pedagógica.
- **Feedback:** icono o palabra (“válido”, “incompleto”, “error”) junto al
  color; estados dinámicos anunciables por tecnologías de asistencia.

## 7. Lenguaje de formas y agrupaciones

La gramática visual se inspira en anillos, arcos, fibras y puntos luminosos:

- **Ciclo:** anillo o trayectoria cerrada.
- **Posición:** nodo o segmento en una posición concreta del ciclo.
- **Acento:** tamaño, contorno o peso de trazo distinto; no altura/nota tonal.
- **Silencio:** posición presente con centro vacío o contorno discontinuo; no
  borrar el espacio que ocupa.
- **Agrupación:** segmentos delimitados por separadores, arcos con inicio
  identificable o patrones de línea. El color es redundante, nunca el único
  canal.
- **Dos pistas:** geometrías comparables pero distinguibles mediante etiqueta,
  trazo y color. No sugerir que una pista está “encima” de la otra por
  importancia.

No asociar color fijo a número de grupo ni traducir un patrón de clave a una
forma culturalmente codificada sin revisión musical. La aplicación muestra
patrones concretos; su visualización debe derivarse de sus posiciones y
acentos, no de una abstracción que invente golpes.

## 8. Arte decorativo y señal musical

Separar de manera reconocible dos capas:

1. **Capa informativa:** patrón editable, posición activa, acento, grupo,
   progreso y controles. Es estable, contrastada, etiquetada y verificable.
2. **Capa atmosférica:** grano, filamentos, halos periféricos y variaciones
   orgánicas. No codifica valores que el usuario necesite leer y puede
   desactivarse/reducirse sin pérdida funcional.

No permitir que una partícula decorativa parezca un ataque, que un halo
continuo parezca un ciclo o que el color de grupo prometa un acento audible.
La visualización funcional actual actualiza la posición activa y el avance con
base en el reloj de audio; las nuevas formas deben conservar esa separación
entre contenido musical y ornamento.

## 9. Arquitectura técnica recomendada

Evaluación de tecnologías sin implementación:

| Tecnología | Uso recomendado | Consideraciones |
|---|---|---|
| SVG | Anillos, arcos, nodos y trayectorias con pocos/miles de elementos controlados. El visualizador actual ya utiliza SVG. | Mantener viewBox responsivo; evitar filtros `feGaussianBlur` costosos por cada nodo y atributos accesibles insuficientes. |
| CSS / Styled Components | Tokens, superficies, foco, estados, gradientes discretos y transiciones sencillas. | No usar `transition` como reloj musical ni crear animaciones infinitas para simular pulsos. Respetar preferencias de movimiento. |
| Canvas 2D | Solo si un prototipo demuestra valor de partículas/grano dinámico que SVG/CSS no resuelven con rendimiento aceptable. | Canvas requiere alternativa textual, escalado HiDPI, limpieza eficiente y control de coste; no dibujar contenido musical inaccesible sin equivalente DOM. |
| WebGL / Three.js | No recomendados por defecto. | Incorporarlos solo con necesidad tridimensional medida, presupuesto de rendimiento y fallback accesible; la experiencia no requiere 3D. |

### Sincronización

`AudioEngine` programa eventos con `AudioContext.currentTime`, una ventana
lookahead de 100 ms y un scheduler que consulta cada 25 ms. `RitmiaContext`
alimenta el estado visual mediante `requestAnimationFrame`, leyendo tiempo de
audio y eventos programados. Este modelo existente es la fuente de verdad para
el tiempo musical.

Las animaciones futuras deben derivarse del tiempo/posiciones calculados desde
ese reloj, nunca de `setInterval`, `Date.now`, un CSS animation independiente o
un contador de frames. CSS puede interpolar una respuesta decorativa breve
después de que la aplicación recibe el estado, pero no determinar el instante
del pulso ni calcular la fase. Evitar alterar audio, scheduler o sincronización
para conseguir un efecto visual.

### Aleatoriedad visual controlada

La variación puede elegir entre formas decorativas de un catálogo fijo con
semilla estable y límites definidos. Mantener la semilla durante la sesión o
usar un valor determinista ligado al ejemplo seleccionado. No randomizar
layout, textos, color semántico, posición de controles ni patrones musicales.
La variación no debe recalcularse en cada render/frame y debe poder apagarse
sin cambiar datos.

## 10. Implementación incremental propuesta

| Etapa | Alcance pequeño | Archivos/componentes probables | Criterio de aceptación |
|---|---|---|---|
| 1. Fondo y tokens | Definir tokens, superficies, contraste, fondo y grano estático sutil. | `src/styles/theme.js`, `GlobalStyles.js`, layout | El tema sigue siendo único y oscuro; texto/controles cumplen contraste medido; el grano no reduce lectura ni desplaza layout. |
| 2. Visualizador rítmico experimental | Prototipar un ciclo SVG funcional de A con nodos de posición y estado estático más indicador activo. | `CircularVisualizer.jsx` o componente nuevo | Cada posición corresponde al patrón real, se conserva proporción móvil y existe una descripción textual equivalente. |
| 3. Estados de pulsos y acentos | Diferenciar silencio/suave/fuerte y estado activo por forma, borde y etiqueta, no solo color. | `BeatGrid.jsx`, visualizador, tests | Los tres estados son identificables en pausa y reproducción; el resaltado activo no implica sonido en una casilla silenciosa. |
| 4. Agrupaciones | Añadir límites y marcadores de grupo derivados de una agrupación válida. | visualizador, `GroupingInput.jsx`, helper de dominio | Los límites coinciden con la suma/configuración actual; una agrupación visual no crea audio/acento. |
| 5. Dos pistas | Añadir ciclo/representación B con identidad redundante y comparación clara. | visualizador, `ProgressTimeline.jsx` | A y B se distinguen con color, etiqueta y trazo; las fases/duraciones reflejan el modo activo. |
| 6. Animaciones secundarias y atmósfera | Incorporar respuesta puntual y detalles decorativos de baja frecuencia. | SVG/CSS; Canvas solo si se justifica | Decoración no compite con interacción ni cambia el timing; el rendimiento móvil permanece estable. |
| 7. Refinamiento y accesibilidad | Revisar contraste, movimiento, bajo destello, teclado, lector de pantalla y tamaños. | estilos/componentes/tests | Sin movimiento se conserva toda la información; ninguna señal depende solo de color/animación; sin flashes en configuración predeterminada. |

## 11. Validación artística y funcional

- **Sincronización con audio:** comparar visualmente eventos de bajo/alto nivel
  con los tiempos de `scheduledNotes` y `AudioContext.currentTime` en pruebas
  controladas; medir desfase y su variación en distintos dispositivos. No
  aceptar una demostración que se sienta alineada solo en un video.
- **Claridad musical:** pedir a principiantes que expliquen qué representa un
  nodo, qué es silencio y qué indican los grupos. Confirmar con escucha humana
  que la vista no afirma que la agrupación añada acentos.
- **Rendimiento:** perfilar en móvil de gama media con 32 pulsos por pista,
  filtros activos y grano; revisar frecuencia de frames, carga y memoria.
  Desactivar ornamento costoso antes de degradar controles o sincronización.
- **Tempo bajo/alto:** probar BPM mínimo y máximo (40 y 200), transiciones de
  tempo durante reproducción y nivel 3. A alta velocidad no multiplicar
  destellos; sustituir pulsos sucesivos por una señal estable/resumida cuando
  sea necesario.
- **Móvil:** inspeccionar 320, 375, 768 y 1280 px, zoom, orientación y áreas
  seguras; grillas largas deben desplazarse internamente y seguir accesibles.
- **Movimiento reducido:** validar tanto `prefers-reduced-motion` como el
  control de la aplicación; detener transformaciones y desplazamientos
  decorativos sin ocultar el estado rítmico.
- **Destellos:** analizar cambios de luminancia/área/frecuencia; por defecto no
  usar flashes ni alternancia rápida de colores. El brillo funcional debe ser
  breve, moderado y no estroboscópico.
- **Regresión:** preservar pruebas unitarias, E2E responsive, grillas largas,
  teclado y modales. Añadir solo pruebas de estados visuales o de preferencias
  realmente nuevos; no relajar expectativas existentes.

## Decisiones para revisión humana

- Confirmar la paleta final y su contraste en la interfaz real, incluidos
  daltonismo y brillo de pantallas móviles.
- Revisar con especialistas en ritmo que formas y marcas comuniquen ciclos,
  posiciones y agrupaciones sin insinuar alturas tonales o acentos inexistentes.
- Probar si el lenguaje orgánico mejora la orientación o compite con el patrón
  para personas principiantes.
- Acordar límites de movimiento, grano y glow con personas que prefieren bajo
  movimiento o sensibilidad a destellos; los presets futuros no sustituyen una
  experiencia base accesible.
