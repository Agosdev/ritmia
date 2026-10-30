# Arquitectura UX y experiencia pedagógica

Propuesta para evolucionar Ritmia hacia una experiencia comprensible para
principiantes sin quitar las herramientas avanzadas. Describe por separado el
comportamiento existente y las decisiones futuras; no implementa cambios de
interfaz, tour, presets ni DEMO.

## A. Definición del producto

### Propuesta de valor

Ritmia permite construir patrones rítmicos, escucharlos y observar sus ciclos.
Conecta acciones sencillas —cambiar la velocidad, silenciar una posición o
marcarla suave o fuerte— con conceptos musicales como compás, agrupación y
relación entre pistas. No requiere leer partituras para comenzar.

### Personas y situaciones de uso

| Público | Necesidad principal | Situación |
|---|---|---|
| Principal: personas curiosas o principiantes | Entender qué cambia al modificar un patrón y aprender por escucha y exploración. | Aprender |
| Secundario: estudiantes, docentes y músicos | Practicar con tempo constante, comparar acentuaciones y explorar relaciones métricas. | Practicar |
| Secundario: personas que experimentan con ritmos | Construir patrones largos o combinar ciclos y convenciones de clave. | Experimentar |

Durante los primeros minutos, una persona nueva debería poder reproducir y
detener un ritmo, cambiar su velocidad, distinguir una posición sin sonido de
una suave o fuerte, editar un golpe y explicar con sus propias palabras qué
muestra la grilla. No es necesario que domine vocabulario ni que complete una
prueba para explorar.

Los **niveles 1–3** son niveles de contenido musical (un compás, agrupaciones,
dos pistas y modos), no una evaluación del conocimiento previo de la persona.
La interfaz actual los presenta como “Nivel de dificultad pedagógica”; esa
etiqueta puede confundirse con una medida de habilidad. La arquitectura futura
debe conservar los tres niveles, pero distinguirlos claramente del grado de
experiencia del usuario.

## B. Auditoría de comprensión

La columna “alternativa” es una propuesta editorial, no texto implementado.
Las fórmulas, parámetros de síntesis y estadísticas pueden permanecer
disponibles en una sección opcional **Detalles técnicos**, no como explicación
principal.

| Elemento actual | Riesgo de comprensión o redundancia | Alternativa sencilla propuesta |
|---|---|---|
| Header: “Precisión Total — 1 a 32 pulsos sin drift” | Promesa absoluta no demostrada por las pruebas; “drift” es jerga. | “Explorá ritmos de 1 a 32 posiciones.” |
| Badges `lookahead 100ms`, `schedule 25ms`, `AudioContext.master` | Detalles de implementación que compiten con la orientación inicial. | Mover a Detalles técnicos; en la vista principal no hace falta reemplazo. |
| “Visualización locked a AudioContext.currentTime”, `rAF + window 50ms` | “Locked” y siglas no explican qué representa la visualización. | “El ritmo, en pantalla”. |
| “glow no flash” | Describe una decisión técnica, no qué debe observar la persona. | Mover a Detalles técnicos; explicar la posición activa junto al visualizador. |
| “Grilla A — scroll horizontal activo / width proporcional” | Mensaje técnico y variable según cantidad; el desplazamiento no explica la música. | “Pulsos de A” y una indicación breve de desplazamiento cuando sea necesario. |
| “Constructor n/n preciso”, `NUM`, `DEN`, “Inputs num 1–32…” | Abreviaturas y especificaciones antes de explicar numerador y denominador. | “Compás A”; campos “Cantidad de pulsos” y “Valor de cada pulso”, con una ayuda breve. |
| “Texto libre”, “Aplicar numerador” | No indica que el campo cambia la cantidad de posiciones, ni el límite sin ayuda. | “Cantidad de pulsos” y botón “Aplicar”; ayuda “Escribí un número de 1 a 32”. |
| “Agrupación A — 3+2+2” y “Sugerencias auto” | “Agrupación” puede parecer una instrucción sonora; “auto” es ambiguo. | “Dividí los 7 pulsos en grupos”; “Ideas para agrupar”. |
| Feedback de agrupación y leyenda “0 silencio, 1 suave…” | Notación numérica y nombres de sintetizadores requieren conocimiento previo. | “Suma de grupos: 7. Los colores separan grupos; no añaden golpes.” y “Sin sonido / suave / fuerte”. |
| “Nivel 3 — Polirritmia”, “Compás B — polirritmia / polimetría” | El nivel incluye también morph y clave; los términos no explican la diferencia. | “Dos pistas y sus relaciones”; ofrecer una frase llana para cada modo. |
| “Polirritmia — B se estira/comprime”, “Polimetría — corchea=corchea” | La primera frase oculta la relación de duración y la segunda es demasiado abreviada. | “Polirritmia: B completa su ciclo en el mismo tiempo que A.” / “Polimetría: cada unidad conserva su duración; los ciclos pueden terminar en momentos distintos.” |
| “Morph — crossfade de ganancia” y `volA * (1 - morph) + volB * morph` | Fórmula no explica qué se oye; no cambia el patrón, solo la mezcla relativa. | “Mezcla el volumen de A y B sin cambiar sus ritmos.” |
| Stats de `pulseRatio`, `eventRatio`, `durationRatio`, MCM, fusas y segundos | Hay varias razones con significados distintos; mostrarlas juntas sin unidades induce confusión. | Resumen principal: “A hace X pasos mientras B hace Y” y “sus ciclos duran…”; conservar cálculos completos en Detalles técnicos. |
| “¿Qué escuchas?” junto a la cadena del compresor y fórmulas de paso | El título promete una descripción para escuchar, pero comparte espacio con ingeniería del audio. | Mantener una frase dinámica y sencilla arriba; trasladar cadena, ecuaciones y `osc.start(atTime)` a Detalles técnicos. |
| “Test de nivel”, “Comprueba tu lectura del compás actual” | Puede entenderse como diagnóstico de habilidad o escucha, aunque solo es una pregunta de opción múltiple. | “Repasar este ritmo”; aclarar que no evalúa la escucha ni asigna puntaje. |
| `Modo seguro`, `Reducir movimiento`, `Metrónomo 1` | “Seguro” no comunica que solo limita cierto énfasis visual; “1” no explica el woodblock en inicio de A. | “Reducir destellos visuales” (si coincide con el alcance definido) y “Reducir movimiento”. Renombrar el metrónomo actual “Marcar inicio de A”; describir el sonido. |
| WelcomeModal: “precisión absoluta”, “cero jitter”, “cero drift” | Afirmaciones más amplias que lo demostrado y texto técnico en la primera pantalla. | “Ritmia programa los sonidos usando el reloj de audio del navegador.” Añadir detalle técnico opcional y no prometer exactitud perceptiva. |
| WelcomeModal: scroll para “más de 16 pulsos” | No coincide con BeatGrid: el scroll se activa desde 16 posiciones inclusive. | “Con 16 posiciones o más, podés desplazarte por la grilla.” |

### Correspondencia entre sonido e imagen

- El punto de cada botón codifica el estado configurado: silencio, suave o
  fuerte. La pista A usa bajo suave y bombo fuerte; B usa hi-hat suave y caja
  fuerte. Sonidos sintetizados, no grabaciones de instrumentos.
- El woodblock de “Metrónomo 1” es un sonido adicional en la primera posición
  de A, incluso si esa posición está en silencio. El volumen A no lo regula.
  La etiqueta actual no deja clara esta independencia.
- Los colores de agrupación señalan segmentos, no golpes audibles. En nivel 1
  pueden verse colores de una agrupación válida aunque el control para editarla
  aparezca desde nivel 2.
- El visualizador resalta posiciones durante su ventana de actualización,
  incluidas posiciones configuradas como silencio. Por encima de 130 BPM,
  “Modo seguro” puede suprimir el resaltado de pulsos que no sean fuertes; el
  audio no cambia. Debe explicitarse que el indicador señala posición/avance y
  que el punto muestra si hay un golpe configurado.
- La timeline muestra el avance del ciclo, no la intensidad ni el número de
  golpes audibles. Una alternativa textual es necesaria para no depender de
  animación o color.

### Jerarquía de visibilidad propuesta

Mantener a mano: reproducir/detener, tempo, compás activo, patrón editable,
significado de sus estados, control de volumen de la pista y estado de
reproducción. En nivel 3, identificar claramente A y B, el modo y sus
volúmenes. Agrupaciones, combinaciones y test se hacen visibles al entrar al
nivel musical correspondiente, sin borrar datos ni capacidades.

En **Detalles técnicos** opcionales: fórmulas, diferencias entre razones,
timings del scheduler, nombres de síntesis, cadena de masterización, fusas y
estadísticas de reencuentro. Evitar tres modalidades completas de explicación:
la experiencia base debe usar lenguaje accesible y ofrecer únicamente una
ampliación técnica opcional.

## C. Arquitectura de información

Propuesta de recorrido desde lo más inmediato a lo más explicativo:

1. **Escuchar:** Play/Stop y un patrón inicial comprensible.
2. **Controlar:** tempo BPM y volumen de la pista activa.
3. **Elegir un compás:** presets, cantidad de pulsos y valor de cada unidad.
4. **Editar:** grilla con silencio, suave y fuerte; estado entendible por texto,
   color y foco.
5. **Observar:** anillo/ciclo y avance, con texto alternativo y una leyenda de
   qué representa cada marca.
6. **Entender:** explicación breve “Qué vas a escuchar” que responde al estado
   actual; no duplicar la misma fórmula en varios paneles.
7. **Explorar:** agrupaciones en nivel 2; pista B y modos en nivel 3.
8. **Consultar:** ayuda contextual opcional, Test como repaso no evaluativo y
   Detalles técnicos opcionales.

La progresión debe revelar controles cuando aportan al objetivo actual y
mantenerlos disponibles mediante navegación clara. No debe ocultar funciones,
alterar automáticamente el patrón por una elección pedagógica ni bloquear el
uso libre.

## D. Experiencia inicial para principiantes

### Recorrido propuesto

1. **Reproducir:** ofrecer una indicación corta y un botón Play visible. Al
   iniciar, explicar que cada casilla es una posición del patrón.
2. **Cambiar la velocidad:** mover el slider BPM y comparar rápido/lento. BPM
   significa negras por minuto; el valor de referencia sigue siendo la negra
   aunque el compás tenga otro denominador.
3. **Reconocer los estados:** activar una posición para recorrer silencio,
   suave y fuerte. Mostrar qué estado está seleccionado antes de pedir que lo
   escuche.
4. **Editar:** cambiar una posición y observar cómo varía el punto y el sonido
   correspondiente. Invitar a volver al estado anterior sin penalización.
5. **Aprender el compás:** explicar que el numerador indica cuántas posiciones
   contiene el patrón y el denominador qué valor tiene cada una; contrastar
   dos ejemplos cortos.
6. **Explorar un ejemplo nuevo:** cargar un ejemplo curado, por ejemplo 7/8
   agrupado visualmente como 3+2+2, y preguntar qué se ve antes de introducir
   términos nuevos.

El recorrido no debe exigir una percepción auditiva concreta para poder
avanzar. Puede ofrecer “escuchar otra vez”, detener, omitir o salir en todo
momento.

### ¿Empezar con 4/4?

**Propuesta para revisar, no cambio aplicado:** usar 4/4 como ejemplo inicial
para una persona principiante y reservar el 7/8 para el paso de agrupaciones.
Cuatro posiciones permiten explicar cantidad, acento y repetición con menor
carga inicial; el 7/8 resulta valioso para mostrar por qué se agrupa un mismo
compás de distintas maneras.

Actualmente el contexto inicia en 7/8 y 92 BPM, con patrón A
`[fuerte, silencio, suave, silencio, suave, silencio, silencio]` y agrupación
`3+2+2`. B inicia en 5/8, pero solo aparece en el nivel 3. La propuesta no
decide si 4/4 debería cambiar los valores persistentes/globales o solo el
ejemplo de bienvenida; esa decisión requiere probar ambos comienzos con
personas principiantes y docentes.

## E. Metrónomo y percepción musical

### Comportamiento existente

“Metrónomo 1” añade un woodblock en la primera posición de A de cada ciclo.
Funciona aunque el acento de esa posición sea silencio, y es independiente del
volumen A. No marca cada pulso ni todas las negras; es una referencia del
inicio del ciclo A. El patrón A/B sigue siendo editable y tiene sus propios
sonidos.

### Evolución propuesta

- Renombrar la función existente a **Marcar inicio de A**, con ayuda que diga
  que se oye un woodblock al comenzar A, incluso si el golpe está silenciado.
- Incorporar más adelante un **metrónomo convencional** separado del patrón:
  una marca regular a la frecuencia de negras indicada por BPM, con una
  diferenciación opcional del primer tiempo. Como BPM siempre se expresa en
  negras/minuto, ese clic no debe confundirse con cada casilla de la grilla
  cuando el denominador sea distinto.
- Dejar explícitos el sonido, el control que lo activa y el volumen del
  metrónomo; A y B conservan controles separados.
- Mantener ambos marcadores independientes y explicar su propósito antes de
  activarlos juntos. No convertir silencios del patrón en acentos ni imponer
  acentos de grupo por defecto.

**Importante:** hoy las agrupaciones cambian la organización visual de las
posiciones y sus colores. No generan ni desplazan acentos audibles. Un inicio
de grupo puede coincidir con una posición silenciosa. Si se propone una opción
futura de “acentuar inicios de grupo”, debe ser explícita, reversible y no
confundirse con la agrupación actual.

## F. Estructura futura del tour

`WelcomeModal.jsx` ya ofrece cuatro pantallas introductorias con Atrás,
Siguiente y cierre. Se puede cerrar con Escape, el botón de cerrar o clic en
el fondo; se utiliza `useModalAccessibility`. No se abre automáticamente y no
destaca controles ni espera acciones dentro de la interfaz. Además, el índice
de pantalla se conserva al cerrar y reabrir: la ayuda actual no es plenamente
reiniciable desde la primera pantalla.

Para evitar mantener dos fuentes editoriales, el tour futuro puede reutilizar
los IDs existentes de `docs/guia-de-uso.md`. Los textos y las condiciones de
esta tabla son una propuesta de producto, no funciones disponibles.

| ID estable | Objetivo y texto breve | Componente / objetivo | Acción del usuario | Condición de avance sugerida |
|---|---|---|---|---|
| `welcome-purpose` | Entender el propósito: “Construí un ritmo y compará lo que programás con lo que escuchás.” | `WelcomeModal`; resumen del laboratorio | Continuar u omitir | Continuar explícitamente; no exigir Play |
| `transport-tempo` | Controlar ritmo y velocidad: “Iniciá el ritmo y probá un tempo más rápido o más lento.” | `Header`; Play/Stop y BPM | Iniciar/detener y cambiar BPM | Detectar BPM distinto o permitir “Entendido” |
| `visual-map` | Leer representación: “Cada posición avanza con el ciclo; el anillo indica la pista.” | `CircularVisualizer`, `ProgressTimeline` | Observar o leer una descripción | Acción explícita; nunca esperar a que la persona vea una animación |
| `beat-accent-cycle` | Distinguir estados: “Cada toque pasa por sin sonido, suave y fuerte.” | `BeatGrid`; un pulso A | Activar con botón o teclado | Estado accesible cambia; ofrecer omitir la escucha |
| `meter-numerator` | Comprender cantidad: “El número de arriba indica cuántas posiciones hay.” | `TimeSignatureBuilder`; preset o campo de cantidad | Elegir un preset | La configuración cambia o avanzar sin editar |
| `meter-denominator` | Comprender valor: “El número de abajo indica el valor de cada posición; BPM sigue en negras.” | `TimeSignatureBuilder`, resumen de sonido | Comparar dos denominadores | Resumen actualizado o confirmar comprensión |
| `volume-metronome` | Separar patrón y referencia: “El marcador señala el inicio de A; el volumen cambia su pista.” | `LevelTabs`, `TimeSignatureBuilder` | Alternar marcador y volumen | Cambio observable; no exigir identificar el timbre |
| `grouping-valid` | Comprender agrupación: “En 7/8, 3+2+2 distribuye siete posiciones en tres grupos.” | `GroupingInput`, `BeatGrid` | Elegir sugerencia o escribir suma válida | Suma válida y explicación que no promete acentos |
| `grouping-draft` | Distinguir texto en edición: “Un grupo incompleto no se aplica como agrupación válida.” | `GroupingInput`; feedback de estado | Probar `3+` y luego corregirlo | Ver feedback y recuperar estado válido; no bloquear |
| `track-b` | Entender dos pistas: “B tiene su propio patrón, acentos y volumen.” | `PolyrhythmControls`, `BeatGrid` | Cambiar una posición o volumen de B | Cambio visible y textual; avance aunque no se oiga |
| `relation-modes` | Diferenciar relaciones: “En polirritmia los ciclos duran lo mismo; en polimetría cada unidad mantiene su duración.” | `PolyrhythmControls`, `AudioInfoBadge` | Alternar modos | Mostrar una explicación con unidades, no solo una razón |
| `morph-control` | Entender mezcla: “Mezclá el volumen de A y B sin cambiar el patrón.” | `PolyrhythmControls`; slider Morph | Probar los extremos y el centro | Valor accesible actualizado |
| `clave-patterns` | Explorar patrones: “Son y rumba organizan su ciclo canónico en dos compases de 4/4.” | `PolyrhythmControls`, `CircularVisualizer` | Elegir un patrón | Nombre y ciclo descritos; no generalizar a Bossa/Shiko |
| `test-level` | Repasar: “Respondé una pregunta sobre esta configuración; no es una nota.” | `MainLayout`, `TestModal` | Abrir, responder o cerrar | Feedback anunciado; error no penaliza ni bloquea |

### Reglas de interacción y accesibilidad

- El tour es optativo, se puede saltar, cerrar en cualquier momento y reiniciar
  desde una acción visible que siempre empiece por el primer paso.
- El recorrido no toma control de audio ni modifica configuración sin
  confirmación. Si una demostración necesita cambiarla, debe ofrecer restaurar
  la configuración previa al salir.
- Teclado: foco visible, orden predecible, Escape para salir y ningún paso que
  requiera hover o precisión de puntero. Los cambios de paso se anuncian sin
  emitir mensajes continuamente.
- Lector de pantalla: diálogo etiquetado, paso actual/cantidad, objetivo,
  instrucciones de acción y botones “Atrás”, “Siguiente”, “Omitir” y “Cerrar”.
  No trasladar el foco fuera del diálogo sin intención.
- Móvil: foco y controles no quedan cubiertos por el globo; permitir
  desplazamiento hasta el objetivo, botones táctiles cómodos y diseño que no
  dependa de anclajes rígidos.
- Respetar `prefers-reduced-motion` y la preferencia de movimiento de la
  aplicación; no usar destellos, desplazamientos automáticos abruptos ni
  exigir seguir una animación.

## G. Accesibilidad

La accesibilidad debe ser propiedad de la interfaz base, no una función que
dependa de un preset. Los presets futuros describen preferencias de
presentación, no niveles de conformidad ni garantías médicas.

| Preset futuro | Intención propuesta |
|---|---|
| Estándar | Presentación predeterminada con controles y contenido equivalentes. |
| Movimiento reducido | Evitar transiciones, transformaciones y desplazamientos no esenciales; ya existe el toggle “Reducir movimiento”. |
| Alta claridad | Reforzar contraste validado, texto y estados visibles; color nunca como único canal. |
| Bajo destello | Evitar destellos y cambios visuales repetitivos; la interfaz base ya debe evitarlos. |
| Modo guiado | Ayuda paso a paso opcional; no reducir capacidades ni impedir salir. |

Por ahora no implementar selección múltiple ni guardar una combinación de
presets. Diseñar una selección única con descripción de qué cambia; decidir
después si el sistema operativo tiene precedencia o si se permite personalizar
un preset. “Modo seguro” hoy limita un resaltado visual sobre 130 BPM; no es
un filtro de sonido ni una garantía de seguridad para una condición médica.
“Reducir movimiento” afecta principalmente la animación visual; no cambia el
audio.

Requisitos de base: operación completa por teclado, roles y nombres accesibles,
foco claramente visible, contraste comprobado, tamaño/espaciado adecuados,
estados de acento y feedback expresados con texto además de color, alternativas
textuales para visualizadores, cambios de diálogo anunciados, zoom/reflow
móvil, respeto de `prefers-reduced-motion` y ausencia de destellos. Probar con
tecnologías de asistencia; los tests automáticos no sustituyen esa validación.

## H. DEMO / ejemplos musicales

**Propuesta conceptual; no existe un control DEMO en la implementación actual.**

### Ejemplos pedagógicos curados

Cada ejemplo debe explicar en una frase qué escuchar/observar, exponer sus
parámetros y poder editarse. Candidatos:

| Nivel musical | Ejemplo | Idea a descubrir |
|---|---|---|
| 1 | 4/4 con un golpe fuerte, algunos suaves y silencios | Cantidad de posiciones y ciclo básico |
| 1 | Mismo numerador con denominador distinto | Valor de unidad y duración calculada con BPM en negras |
| 2 | 7/8 con agrupación visual 3+2+2 | Tres grupos de tamaños distintos, sin acentos automáticos |
| 2 | Misma cantidad de pulsos con otra agrupación válida | La organización visual puede variar sin cambiar la secuencia sonora |
| 3 | Polirritmia A=3/4 y B=2/8, comparada con polimetría | Ciclo adaptado frente a duración independiente de las unidades |
| 3 | Son 3-2 o Rumba 2-3 | Ataques y ciclo canónico de dos compases de 4/4 |

La selección debe respetar denominadores/numeradores admitidos, sumas válidas
de agrupación, patrones de clave codificados, límites de tempo y restricciones
del modo. No describir los seis patrones como ciclos de dos compases: esa
convención canónica aplica a Son y Rumba; Bossa y Shiko conservan otra
adaptación.

### Comportamientos de DEMO a diseñar

- **DEMO por nivel:** elegir de un conjunto curado apto para el nivel musical
  activo; no modificar la selección del usuario sin consentimiento.
- **DEMO de cualquier nivel:** elegir entre ejemplos compatibles, mostrar qué
  nivel/caso fue elegido y permitir repetir o elegir otro.
- **Randomización reproducible:** elegir con una semilla explícita o registrar
  los parámetros elegidos; la misma semilla y catálogo producen el mismo caso.
  Excluir configuraciones inválidas, no “arreglarlas” silenciosamente.
- **Descripción y edición:** antes de reproducir, anunciar brevemente qué
  relación se va a explorar. Después de cargar, todos los controles siguen
  editables; distinguir “ejemplo cargado” del patrón original y permitir
  volver/restaurar.
- DEMO no debe avanzar automáticamente con cambios de audio, ni depender de
  que una persona distinga timbres o complete una respuesta correcta.

## I. Criterios de aceptación UX

### Tareas observables con personas

Realizar sesiones moderadas y no asumir que acertar una pregunta equivale a
comprender. Invitar a verbalizar dudas, admitir no saber y permitir abandonar
sin penalización.

| Tarea | Evidencia de comprensión |
|---|---|
| Iniciar y detener el patrón; encontrar un tempo más lento | La persona encuentra Play/Stop y ajusta BPM sin confundirlo con volumen. |
| Silenciar una posición y luego marcarla suave/fuerte | Puede identificar el estado seleccionado y explicar si espera un sonido de A. |
| Cambiar la cantidad y el denominador | Distingue cantidad de posiciones y valor de unidad; entiende que BPM permanece referido a negras. |
| Leer 7/8 y 3+2+2 | Cuenta siete posiciones y tres grupos; no atribuye golpes audibles nuevos al color. |
| Activar B, cambiar modo y reconocer mezcla Morph | Puede describir qué cambia en el patrón/ciclo y qué control cambia solo la mezcla. |
| Explorar Son/Rumba frente a Bossa/Shiko | No generaliza a todos el ciclo canónico de ocho negras. |
| Usar grilla larga en móvil y teclado | Encuentra posiciones fuera del área visible, mantiene foco y edita pulsos sin desbordamiento de página. |
| Completar o salir del tour y un modal | Puede cerrar/reabrir, seguir el foco y orientarse sin depender de color, movimiento o ratón. |

**Criterios de salida sugeridos:** la persona completa las acciones sin ayuda
crítica, puede explicar con sus palabras el efecto de al menos una edición y
no confunde los indicadores visuales con golpes audibles. Antes de fijar tasas
o muestras, definirlas con investigación y criterios de producto; no declarar
comprensión universal a partir de una sesión pequeña.

### Validación automatizada frente a humana

- Automatizable: límites de BPM/métrica, estados accesibles, navegación por
  teclado, foco de modales, condiciones del tour, texto de status, reflow en
  viewports, conservación de controles y carga/restauración de ejemplos
  válidos. Tests unitarios/E2E prueban comportamiento observable.
- Requiere personas y escucha: claridad de timbres, audibilidad en auriculares
  y parlantes, entendimiento de “suave/fuerte”, inteligibilidad de las
  explicaciones, percepción de diferencias entre modos, lectura del color,
  comodidad visual y comprensión real. Las pruebas actuales no certifican
  estas experiencias.

## J. Backlog priorizado

Estimación de archivos orientativa; las dependencias indican orden de producto,
no autorización para implementarlas en esta tarea.

| Prioridad / tarea | Motivo | Archivos probablemente afectados | Dependencias | Criterio de aceptación |
|---|---|---|---|---|
| **Imprescindible — Moderar y verificar vocabulario, metrónomo y arranque** | Validar 4/4 frente a 7/8, significado de “pulso”, “suave/fuerte”, y separar marca de inicio de metrónomo regular. | `docs/ux-pedagogica.md`, eventualmente `src/context/RitmiaContext.jsx`, `Header.jsx`, `LevelTabs.jsx`, `AudioEngine.js` | Revisión pedagógica y pruebas con principiantes/docentes | Decisiones registradas con ejemplos y sin cambiar silenciosamente el comportamiento. |
| **Imprescindible — Corregir promesas editoriales** | “Cero drift/precisión absoluta” supera lo probado; una guía fiable no debe garantizar precisión perceptiva. | `Header.jsx`, `WelcomeModal.jsx`, `AudioInfoBadge.jsx`, `README.md` (otra tarea) | Revisión de producto/documentación | Toda afirmación técnica tiene evidencia acotada; README queda fuera de esta tarea. |
| **Imprescindible — Acordar lectura y auditoría accesible de estados** | El color, el movimiento o una señal breve no bastan como alternativa a la información sonora/visual. | `BeatGrid.jsx`, `CircularVisualizer.jsx`, `ProgressTimeline.jsx`, `AudioInfoBadge.jsx`, tests de accesibilidad | Criterios WCAG y pruebas manuales con lector de pantalla | Estado de cada golpe, pista y avance comprensible por teclado y lector, sin usar color como único indicador. |
| **Primera implementación — Jerarquía principal y textos** | Reducir jerga sin eliminar funciones avanzadas. | `MainLayout.jsx`, `Header.jsx`, `LevelTabs.jsx`, `TimeSignatureBuilder.jsx`, `GroupingInput.jsx`, `PolyrhythmControls.jsx`, `AudioInfoBadge.jsx` | Tareas imprescindibles y revisión de microcopy | Principiante completa el recorrido inicial; detalles técnicos siguen disponibles en una sección opcional. |
| **Primera implementación — Tour contextual optativo** | La bienvenida actual explica, pero no guía acciones reales ni se reinicia desde el inicio. | `WelcomeModal.jsx`, nuevo componente de tour, `RitmiaContext.jsx`, `useModalAccessibility`, tests y E2E | Arquitectura y tabla de IDs; accesibilidad validada | Puede omitirse/cerrarse/reiniciarse, identifica foco y paso, funciona con teclado/móvil y respeta movimiento reducido. |
| **Primera implementación — DEMO y catálogo curado** | Ejemplos repetibles reducen la carga de inventar una configuración; DEMO aún no existe. | `src/music/` (catálogo/validador), `RitmiaContext.jsx`, controles, tests | Decidir ejemplos, semilla, límites y restauración | Carga casos válidos, explica el objetivo, permite edición/repetición y restaura la configuración cuando se solicita. |
| **Primera implementación — Descripción de lo que suena** | Relacionar pista/estado/modo con texto sin confundir agrupación y acento. | `RitmiaContext.jsx`, `AudioInfoBadge.jsx`, `BeatGrid.jsx`, `PolyrhythmControls.jsx` | Microcopy y términos musicales acordados | Resumen refleja estado actual, evita fórmulas como única explicación y no afirma que color agrupe sonidos automáticamente. |
| **Mejora posterior — Presets de experiencia** | Facilitar ajustes reconocibles sin relegar requisitos de accesibilidad a un modo. | `LevelTabs.jsx` o ajustes, `RitmiaContext.jsx`, `GlobalStyles.js`, `theme.js` | Definir precedencia sistema/usuario y validar contraste/movimiento | Un preset a la vez, efecto explicado y reversible; base accesible sin importar selección. |
| **Mejora posterior — Metrónomo convencional** | Dar una referencia regular por negras separada del patrón y del actual inicio de A. | `AudioEngine.js`, `instruments.js`, controles, contexto y tests | Acordar sonido, tempo/unidad, volumen y convivencia con “Marcar inicio de A” | Activación independiente, descripción legible, BPM consistente y patrón editable intacto. |
| **Mejora posterior — Detalles técnicos y métricas didácticas** | Conservar el valor técnico sin sobrecargar la primera experiencia. | `AudioInfoBadge.jsx`, `PolyrhythmControls.jsx`, posiblemente nuevo componente | Vocabulario y visualizaciones revisados por especialista | Razones, unidades y reencuentros explicados con casos comprobables; sección opcional y accesible. |

### Decisiones UX principales

1. Diseñar primero para aprender mediante escucha y exploración, pero conservar
   controles avanzados y dar acceso progresivo, no eliminarlos.
2. Mantener los tres niveles como alcance musical, no como diagnóstico de
   conocimientos o capacidad personal.
3. Proponer 4/4 como entrada inicial y 7/8 como ejemplo posterior; validar
   antes de cambiar los valores iniciales reales.
4. Separar el actual marcador de inicio de A del futuro metrónomo de negras; la
   agrupación visual no crea acentos audibles.
5. Mantener una sola explicación base clara y una ampliación técnica opcional;
   los presets y el tour no sustituyen la accesibilidad de la interfaz base.

### Revisión humana pendiente

- Docentes/personas expertas: confirmar cómo explicar “pulso”, numerador,
  denominador, acento y polirritmia para distintas tradiciones musicales; en
  compases compuestos no equiparar automáticamente cada subdivisión con el
  pulso percibido.
- Producto: decidir si el 4/4 es solo ejemplo de onboarding o nuevo estado
  inicial, cuándo presentar el nivel 3 y si “Test” conserva su nombre.
- Especialista en accesibilidad y personas usuarias: revisar foco, contraste,
  lector de pantalla, presets, movimiento, bajo destello y uso real en móvil.
- Validación musical: escuchar timbres, mezcla, referencia de negras y
  patrones de clave en varios dispositivos; no inferir claridad auditiva a
  partir del código.
- Editorial: revisar la documentación del README y las afirmaciones antiguas
  del modal de bienvenida en una tarea separada.

## Base de verificación

Las capacidades descritas se contrastaron con `README.md`,
`docs/guia-de-uso.md`, `docs/musical-domain.md`, `src/context/RitmiaContext.jsx`,
`src/components/layout/`, `src/components/controls/`,
`src/components/visualizer/`, `src/components/modals/`, `src/audio/`,
`src/music/` y `src/styles/`.

La implementación confirma BPM de 40–200, numerador de 1–32, denominadores
1/2/4/8/16, inicio actual en 7/8 a 92 BPM, tres niveles musicales y cuatro
modos de nivel 3. Son y Rumba usan ciclos canónicos de dos compases de 4/4;
Bossa y Shiko no comparten esa regla. La documentación y los textos existentes
también contienen afirmaciones históricas que requieren revisión; este
documento las señala, pero no modifica el README ni la interfaz.
