# Guía de uso de Ritmia

Manual interno, referencia pedagógica y base de validación manual. Describe el
comportamiento comprobado en el código actual; las ideas para un tour futuro se
marcan como propuestas y no como funciones disponibles.

## 1. Presentación

Ritmia es un laboratorio interactivo para construir ritmos y escuchar cómo
cambian cuando se modifican el tempo, la cantidad y el valor de las unidades
rítmicas, los acentos o la relación entre dos pistas. Busca ayudar a:

- reconocer pulsos y subdivisiones;
- explorar compases regulares e irregulares;
- escuchar agrupaciones aditivas distintas dentro de la misma cantidad de
  pulsos;
- comparar dos patrones simultáneos y entender sus relaciones temporales;
- conectar lo que se programa con una representación visual.

No hace falta saber leer partituras para comenzar. Ayuda conocer la diferencia
entre rápido y lento, poder contar pulsos y saber que una negra, una corchea y
una semicorchea tienen duraciones distintas. La aplicación permite investigar
esas diferencias sin notación tradicional.

### Convenciones para leer la interfaz

- **BPM** significa negras por minuto. El tempo se expresa siempre con
  referencia a la negra, aunque el denominador del compás sea otro.
- El **numerador** indica cuántas unidades de denominador hay en el compás.
  Ritmia las llama pulsos de la grilla. No afirma que todas se perciban como el
  pulso principal de una interpretación musical.
- El **denominador** da el valor de cada unidad: 1 redonda, 2 blanca, 4 negra,
  8 corchea y 16 semicorchea.
- Para los cálculos de la aplicación, la duración de un compás es
  `(60 / BPM) × numerador × (4 / denominador)`.
- Un indicador visual de acento describe el valor configurado. No garantiza
  que una persona perciba el acento de una manera determinada: eso requiere
  escuchar el resultado.

Los límites actuales son numerador entero de 1 a 32, denominador 1, 2, 4, 8 o
16 y tempo entero de 40 a 200 BPM. Véase
[`src/music/constants.js`](../src/music/constants.js).

## 2. Primer contacto con la interfaz

### Reproducción y tempo

El botón **PLAY** inicia las pistas activas y cambia a **STOP** durante la
reproducción. El control deslizante BPM y el campo numérico ajustan el mismo
tempo. El rango visible y aceptado es 40–200; el campo numérico limita los
valores enteros a ese rango.

En los niveles 1 y 2 se oye la pista A. En el nivel 3 se suma la pista B, según
el modo elegido. Se pueden cambiar los parámetros durante la reproducción; el
motor invalida los eventos futuros ya programados y conserva la fase temporal.
El momento exacto en que se percibe un cambio puede depender de la escucha y
del estado de reproducción.

### Visualizador circular

Cada arco representa una posición de la grilla de su pista. El anillo interior
es A; al llegar al nivel 3 aparece el anillo exterior B. La insignia indica la
métrica configurada, por ejemplo `A 7/8`. Durante la reproducción se resalta
visualmente la posición actual; el centro distingue reproducción activa de
detenida.

Desde el nivel 2 los colores de los arcos pueden diferenciar grupos métricos.
Un color de grupo no significa que se haya agregado un golpe: la agrupación no
altera por sí sola los acentos. En nivel 1 la grilla de pulsos puede mostrar
colores de la agrupación válida predeterminada, aunque el control para editarla
solo aparece en nivel 2.

### Grilla de pulsos y acentos

Cada botón de pulso muestra su número y un punto de color. Al activarlo, el
acento recorre este ciclo:

1. **Silencio (0):** no dispara el sonido de acento de esa pista.
2. **Suave (1):** dispara el sonido secundario.
3. **Fuerte (2):** dispara el sonido fuerte.
4. El siguiente toque vuelve a silencio.

En A, el acento suave usa un bajo de onda triangular y el fuerte un bombo
sintetizado. En B, el suave usa un hi-hat y el fuerte una caja. Los silencios
siguen siendo posiciones de la grilla y cuentan en las relaciones mostradas.
Los sonidos se sintetizan con Web Audio; no son muestras de instrumentos
acústicos. El volumen A y, en nivel 3, el volumen B se controlan por separado.

La grilla se puede operar con los controles de botón habituales del navegador.
Con 16 posiciones o más es desplazable horizontalmente: su contenedor puede
recibir foco y enfocar una posición fuera de pantalla la desplaza a la vista.
Hay una descripción accesible que anuncia el comportamiento desplazable.

### Metrónomo

**Metrónomo 1** activa un sonido adicional de woodblock en la primera posición
de A en cada compás. Es independiente del acento configurado para esa posición:
puede sonar incluso si el acento de A está en silencio. Apagarlo no silencia
los otros acentos.

### Test de nivel

**Test Nivel** abre una pregunta de opción múltiple basada en el estado actual:

- Nivel 1: duración del compás A.
- Nivel 2: cantidad de grupos de la agrupación aplicada.
- Nivel 3: descripción del modo activo o de la relación entre pistas.

La respuesta se valida al elegir una opción y se anuncia en el diálogo. Es una
comprobación breve de conceptos; no escucha al usuario, no mide su ejecución
musical ni asigna un puntaje acumulado.

### Opciones de accesibilidad y seguridad

- **Modo seguro** empieza activado. Por encima de 130 BPM evita iluminar
  visualmente los pulsos suaves; no silencia ni modifica el audio.
- **Reducir movimiento** empieza desactivado. Al activarlo, reduce las
  transformaciones y transiciones visuales. El prototipo experimental también
  respeta `prefers-reduced-motion: reduce`: si el sistema operativo solicita
  reducir el movimiento, esa preferencia prevalece y la opción interna no
  puede volver a activar las animaciones.
- Los botones e inputs tienen nombres accesibles; los controles de nivel
  exponen su estado como `aria-pressed`. El foco visible tiene un contorno.
- Los diálogos atrapan el foco, vuelven inerte el contenido del fondo, cierran
  con Escape y restauran el foco al control que los abrió.
- En grillas largas, el foco permite llegar a pulsos fuera del área visible.
  Esto y el uso táctil del desplazamiento están cubiertos por pruebas E2E.

## 3. Nivel 1 — Compases

El nivel 1 permite construir un compás A con presets, seleccionar su
denominador, editar el numerador o introducirlo como texto libre. Los presets
actuales son 2/4, 3/4, 4/4, 5/4, 5/8, 6/8, 7/8, 9/8, 11/8, 12/4, 12/8,
12/16, 15/8, 16/8, 24/16, 7/16 y 3/2.

El campo de texto libre acepta un numerador entero de 1 a 32. Aplicarlo cambia
solo el numerador; el denominador queda como estaba. Enter aplica el valor.
Una entrada vacía, decimal, no numérica o fuera del rango no cambia el compás.
También se puede editar directamente el campo numérico y escoger un
denominador de la lista.

El valor de cada posición está ligado al denominador. A 120 BPM:

- 4/4 dura 2 segundos: cuatro negras de medio segundo.
- 6/8 dura 1,5 segundos según la fórmula de Ritmia: seis corcheas de
  0,25 segundos cada una.
- 7/8 dura 1,75 segundos; la agrupación 3+2+2 puede ayudar a contar sus siete
  corcheas.

El BPM no cambia cuando se cambia de denominador. Por ello, comparar 3/4 con
3/8 conserva la duración de la negra, pero modifica cuánto dura el compás.

### Ejercicios progresivos

| Ejercicio | Acciones | Resultado esperado |
|---|---|---|
| 1. Escuchar un compás común | Iniciar con 4/4 y 92 BPM; luego detener. | **Código:** el compás muestra 4/4 y la duración indicada coincide con la fórmula. **Escucha humana:** contar cuatro posiciones por ciclo y percibir el tempo estable. |
| 2. Comparar valores | Fijar 120 BPM y alternar 3/4 y 3/8. | **Código:** se muestran 1,50 s y 0,75 s respectivamente. **Escucha humana:** el intervalo de negra se mantiene, pero el ciclo de 3/8 dura la mitad. |
| 3. Cambiar numerador | En texto libre introducir `7` y aplicar; después escoger el preset 7/8. | **Código:** el campo A marca 7; el preset además establece denominador 8. **Escucha humana:** contar siete posiciones por compás. |
| 4. Recorrer pulsos y volúmenes | Silenciar, suavizar y reforzar varios pulsos; bajar y subir Vol A. | **Código:** el nombre accesible de cada botón refleja su acento y el control cambia el volumen. **Escucha humana:** comparar silencio, sonido suave y golpe fuerte; confirmar que bajar Vol A reduce A. |

## 4. Nivel 2 — Agrupaciones

Una agrupación aditiva divide el total de posiciones en grupos consecutivos.
Por ejemplo, `3+2+2` reparte siete posiciones en tres grupos de 3, 2 y 2. Otra
agrupación de siete, como `2+3+2`, mantiene la suma y cambia dónde empiezan los
grupos. Esto permite explorar acentuaciones percibidas distintas sin cambiar
el número total de pulsos ni la duración calculada del compás.

La agrupación se escribe como enteros positivos separados por `+`; se permiten
espacios alrededor de números y separadores. Para aplicarse, la suma debe
coincidir con el numerador. Por ejemplo, `3+2+2` es válida en 7/8 y no en 8/8.
Al editar, el estado distingue entre agrupación válida, borrador vacío o
incompleto, formato inválido y suma incorrecta. Si el borrador deja de ser
válido, la última agrupación válida puede conservarse mientras siga sumando el
numerador actual; si no hay una válida aplicable, la grilla queda sin
agrupación activa.

Las sugerencias se calculan para el numerador actual. Al elegir una sugerencia
se actualiza el texto de agrupación; no se generan acentos automáticamente.
Los grupos válidos reciben colores distintos en la grilla y, desde nivel 2, en
los arcos del visualizador.

### Ejercicios progresivos

| Ejercicio | Acciones | Resultado esperado |
|---|---|---|
| 1. Aplicar 3+2+2 | Elegir nivel 2, fijar A en 7/8 y escribir `3+2+2`. | **Código:** feedback válido, suma 7; los colores separan las posiciones 1–3, 4–5 y 6–7. **Escucha humana:** la agrupación no cambia el patrón sonoro hasta que se editen los acentos. |
| 2. Comparar agrupaciones | Mantener 7/8; alternar `3+2+2` y la sugerencia `2+2+3`. | **Código:** cambian la segmentación y sus colores, pero no el numerador ni la duración del compás. **Escucha humana:** si los acentos de la grilla se dejan iguales, la agrupación por sí sola no debe producir nuevos golpes. |
| 3. Validar borradores | Escribir `3+`, luego `3x+2+2`, y finalmente `3+2+2`. | **Código:** estados incompleto, formato inválido y válido; puede indicarse si se conserva un grupo previo. **Escucha humana:** no se requiere para validar este ejercicio. |
| 4. Usar sugerencias | Con numerador 7, activar una sugerencia; cambiar a 8 y probar las sugerencias nuevas. | **Código:** las opciones corresponden al numerador y cada patrón sugerido suma el total. **Escucha humana:** elegir un patrón y marcar manualmente los acentos si se desea oír énfasis en sus comienzos. |

## 5. Nivel 3 — Polirritmia, polimetría, morph y clave

El nivel 3 habilita una pista B independiente en su patrón y volumen. El modo
determina cómo se relacionan los tiempos de A y B. Las relaciones mostradas
usan **posiciones de grilla**, no el número de sonidos audibles: también
cuentan los silencios.

En la sección de estadísticas:

- **Pasos por compás propio / `pulseRatio`:** cantidades de posiciones de cada
  ciclo, reducidas a una razón.
- **Frecuencia de pasos / `eventRatio`:** razón entre la frecuencia temporal
  de las posiciones.
- **Duración efectiva / `durationRatio`:** razón entre duraciones de ciclo.
- **Reencuentro:** coincidencia positiva de inicios de ciclo/compás desde que
  A y B parten juntas; no cuenta el inicio común en t=0 ni las coincidencias
  entre pasos internos.

### Polirritmia

En el modo de la aplicación, B se estira o comprime para que ambos ciclos
duren lo mismo que A. La cantidad de posiciones puede diferir; por eso los
eventos de A y B caen con frecuencias distintas dentro de una duración común.
La duración efectiva es 1:1. Por ejemplo, A=3/4 y B=2/8 muestran frecuencia de
pasos 3:2: B tiene dos posiciones en el tiempo de un ciclo de A.

### Polimetría

Cada pista conserva la duración de su unidad indicada por el denominador:
corchea con corchea, negra con negra, etc. Los compases pueden tener
duraciones distintas y sus inicios vuelven a coincidir al alcanzar el mínimo
común múltiplo de sus duraciones escritas. No es lo mismo que polirritmia:
comparten el tempo de referencia, pero no se fuerza que los ciclos completos
duren lo mismo.

Por ejemplo, con 120 BPM, A=3/4 y B=2/8: cada paso A dura 0,5 s y cada paso B
0,25 s. El compás A dura 1,5 s; el B, 0,5 s. El reencuentro de inicios ocurre
a los 1,5 s: 1 ciclo A y 3 ciclos B. La interfaz expresa duración efectiva
3:1 y frecuencia de pasos 1:2.

### Morph

Morph no es un tercer tipo de métrica: modula la ganancia relativa de las dos
pistas mediante un control de 0 a 100 %. A 0 % la contribución de B es cero; a
100 % la de A es cero; entre ambos extremos se mezclan las ganancias
configuradas. El tempo de B se adapta a la duración del ciclo de A, como en
polirritmia; el control no desplaza la fase ni transforma las notas.

### Clave

Clave carga uno de seis patrones en B: Son 3-2, Son 2-3, Rumba 3-2,
Rumba 2-3, Bossa 3-2 y Shiko. Las posiciones con valor 0 son silencio; 1 y 2
representan ataques suaves y fuertes. Elegir un patrón cambia las posiciones
de B y ajusta su numerador y denominador de patrón.

Los ciclos de son y rumba son canónicamente de ocho negras —dos compases de
4/4—, con 16 posiciones de corchea y cinco ataques. Su duración no se redefine
según la longitud de A. El reencuentro entre inicios de A y el ciclo de clave
se calcula por MCM de sus duraciones. Bossa y Shiko son patrones de ocho
posiciones adaptados a un ciclo de A; no se deben describir como ciclos de dos
compases de A.

### Ejercicios progresivos

| Ejercicio | Acciones | Resultado esperado |
|---|---|---|
| 1. Comparar polirritmia y polimetría | A=3/4, B=2/8, 120 BPM. Escuchar primero polirritmia y luego polimetría. | **Código:** polirritmia muestra pasos 3:2 y duración 1:1; polimetría muestra pasos 1:2, duración 3:1 y reencuentro 1×A/3×B a 1,5 s. **Escucha humana:** comparar cómo se distribuyen los ataques y cuándo vuelve el inicio común. |
| 2. Percibir ambas pistas | En nivel 3, configurar A=4/4, B=3/4 y alternar acentos de A y B. | **Código:** A y B muestran colores/pulsos separados y volúmenes independientes. **Escucha humana:** distinguir el bombo/bajo de A de la caja/hi-hat de B; verificar si cada patrón se puede seguir por separado. |
| 3. Explorar morph | Mantener nivel 3 y mover Morph de 0 % a 50 % y 100 %. | **Código:** el indicador de porcentaje sigue el control; los factores de ganancia pasan de B silenciada, a mezcla, a A silenciada. **Escucha humana:** comprobar la transición de predominio, teniendo en cuenta que volumen y percepción dependen del dispositivo y la audición. |
| 4. Probar una clave canónica | A=3/4, 120 BPM; seleccionar Clave y Son 3-2. | **Código:** el ciclo B dura 4 s; hay 16 subdivisiones y cinco ataques; el reencuentro indicado es 8×A/3×B a 12 s. **Escucha humana:** seguir el patrón de clave contra el ciclo más corto de A y localizar el retorno conjunto. |
| 5. Ajustar B durante reproducción | Iniciar nivel 3 y cambiar el numerador, volumen o patrón B mientras suena. | **Código:** la interfaz y las estadísticas reflejan la configuración nueva sin exigir Stop. **Escucha humana:** comprobar que B responde al cambio y que el audio sigue siendo usable; los tests no establecen una valoración de calidad perceptiva. |

## 6. Ejercicios de aprendizaje y validación funcional

Las comprobaciones de código descritas aquí son reproducibles observando
controles, nombres accesibles, estados o resultados calculados. Las
comprobaciones de escucha requieren una persona y un dispositivo con audio;
no son sustituidas por los tests automatizados.

| Ejercicio | Objetivo musical | Configuración inicial y acciones | Qué debería escucharse (validación humana) | Qué debería observarse (verificable) | Criterio de funcionamiento |
|---|---|---|---|---|---|
| Play/Stop y tempo | Relacionar tempo con velocidad. | Nivel 1, iniciar, cambiar BPM de 92 a 120 y detener. | El intervalo se acorta al subir BPM; Stop detiene los nuevos golpes. | Botón cambia nombre/estado, BPM muestra 120 y devuelve a Play al detener. | No hay error de interfaz; el control es operable con mouse y teclado. |
| Acentos | Diferenciar silencio, suave y fuerte. | En A, tocar un pulso varias veces: 0→1→2→0. | No se oye golpe de acento en 0, bajo en 1 y bombo en 2. | El nombre accesible cambia entre silencio/suave/fuerte y el punto representa el estado. | El ciclo vuelve a empezar correctamente y la grilla conserva cada configuración. |
| Metrónomo separado | Distinguir referencia de compás y acento programado. | Activar/desactivar Metrónomo 1; dejar el primer acento de A en silencio. | Con metrónomo activo se oye woodblock al inicio de A aun cuando ese acento está silenciado; al apagarlo, desaparece ese woodblock. | El toggle refleja su estado; otros acentos de A no cambian. | Solo se elimina la referencia de metrónomo, no los demás sonidos. |
| Correspondencia visual | Relacionar posición con tiempo. | Iniciar una métrica corta con varios acentos separados. | Los golpes coinciden aproximadamente con las posiciones configuradas. | Anillo y timeline avanzan durante reproducción; se reinician visualmente al detener. | No se observa una deriva visual evidente durante la prueba manual; esto no certifica precisión temporal absoluta. |
| Grilla larga | Aprender el desplazamiento del ciclo largo. | A=16; enfocar el grupo y luego el botón del pulso 16; probar gesto táctil en móvil. | La secuencia auditiva mantiene sus 16 posiciones. | `scrollWidth > clientWidth`; foco del pulso 16 lo hace visible; scroll por gesto funciona en móvil. | No se desplaza la página entera por causa de la grilla y el foco permanece perceptible. |
| Agrupación aditiva | Comparar organizaciones del mismo total. | Nivel 2, A=7/8; alternar 3+2+2 y 2+2+3. | Sin alterar acentos, la agrupación sola no añade golpes; con acentos editados, comprobar comienzos elegidos. | Suma válida y colores agrupados cambian, conservando siete posiciones. | No se confunde color de grupo con acento sonoro automático. |
| Comparar dos relaciones | Distinguir compresión de duración independiente. | Nivel 3, 120 BPM, A=3/4, B=2/8; alternar modos. | Polirritmia produce ciclos de misma duración con densidades distintas; polimetría, unidades de igual valor y ciclos de distinta duración. | Estadísticas para polirritmia: evento 3:2/duración 1:1; para polimetría: evento 1:2/duración 3:1/reencuentro 1×A/3×B. | Los cálculos visibles corresponden al modo seleccionado y no se presentan ambos términos como sinónimos. |
| Modal y teclado | Operar ayuda y evaluación sin mouse. | Foco en ayuda, Enter; recorrer con Tab/Shift+Tab; Escape. Repetir con Test Nivel. | No aplica. | Diálogo visible, foco contenido, fondo inerte, cierre con Escape y foco restaurado. | No se pierde el foco detrás del modal; botones tienen nombres claros. |
| Móvil y preferencias | Comprobar controles en espacio reducido. | Usar viewports de 320 y 375 px; recorrer controles; cambiar Reducir movimiento y Modo seguro. | La experiencia auditiva conserva los sonidos configurados; modo seguro no debe silenciar sonidos suaves. | No hay scroll horizontal accidental; controles principales visibles; modo seguro sobre 130 BPM limita el destello visual, no el audio. | Texto y controles siguen siendo utilizables, teclado y scroll táctil no quedan bloqueados. |

Los tests automáticos actuales cubren interacciones musicales, accesibilidad de
controles y diálogos, y escenarios E2E de viewports 320, 375, 768 y 1280 px,
grillas largas y flujo principal. Las pruebas automatizadas no determinan si
un acento resulta suficientemente claro o si una relación rítmica se entiende
auditivamente.

## 7. Base de contenido para un futuro tour

Ya existe una guía inicial en `WelcomeModal.jsx`, abierta desde **Abrir guía de
uso**. Tiene cuatro pantallas: bienvenida técnica, nivel 1, agrupaciones de
nivel 2 y modos de nivel 3. Incluye Atrás/Siguiente, un botón de entrada al
laboratorio y cierre por Escape, botón de cerrar o clic en el fondo. No se abre
automáticamente y todavía no destaca controles ni guía acciones dentro de la
interfaz. Puede servir como antecedente editorial, no como tour interactivo ya
implementado.

La tabla siguiente propone IDs estables para pasos futuros; los textos y
condiciones son contenido, no comportamientos ya construidos. Se pueden
reutilizar en un modelo de datos de tour sin acoplar la documentación a una
implementación concreta.

| ID estable | Nivel | Objetivo pedagógico | Componente React | Elemento a destacar | Texto breve sugerido | Acción esperada | Condición sugerida para avanzar | Posibles problemas de accesibilidad |
|---|---:|---|---|---|---|---|---|---|
| `welcome-purpose` | Inicio | Entender el propósito del laboratorio. | `WelcomeModal` | Título y controles principales | “Construí un ritmo y compará lo que programás con lo que escuchás.” | Continuar o cerrar. | Acción explícita de avanzar; no exigir Play. | Mantener el foco dentro del diálogo y ofrecer salida inmediata. |
| `transport-tempo` | Inicio | Controlar reproducción y rapidez. | `Header` | Botón Play/Stop y controles BPM | “Iniciá el ritmo y ajustá las negras por minuto.” | Iniciar y detener; mover BPM. | Observar cambio del estado de reproducción y BPM válido. | No depender solo del color o del icono; preservar nombres accesibles. |
| `visual-map` | Inicio | Relacionar anillos y pistas. | `CircularVisualizer`, `ProgressTimeline` | Anillo A, anillo B cuando exista, timeline | “Cada posición muestra el avance del ciclo; A y B tienen colores distintos.” | Observar durante reproducción. | Preferir “Entendido” a obligar una espera temporal. | Proporcionar texto alternativo/estado; no basar comprensión solo en animación. |
| `beat-accent-cycle` | 1 | Probar las tres intensidades. | `BeatGrid` | Un botón de pulso A | “Cada toque alterna silencio, suave y fuerte.” | Tocar o activar con teclado tres veces. | Estado accesible cambia y vuelve a silencio. | El color no basta: anunciar el acento y mostrar foco visible. |
| `meter-numerator` | 1 | Cambiar cantidad de posiciones. | `TimeSignatureBuilder` | Presets y numerador A | “El numerador determina cuántas posiciones tiene el compás.” | Seleccionar preset o escribir numerador válido. | Campo A refleja un entero permitido. | Evitar enfocar el input sin instrucción; no depender solo de placeholder. |
| `meter-denominator` | 1 | Comprender valor de unidad y duración. | `TimeSignatureBuilder`, `AudioInfoBadge` | Denominador y duración del compás | “El denominador cambia el valor de cada posición; BPM sigue en negras.” | Comparar, por ejemplo, 3/4 con 3/8. | Informar la duración calculada tras el cambio. | Explicar unidades en texto, no solo con fórmulas. |
| `volume-metronome` | 1 | Separar volumen de pista y referencia de tempo. | `Header`/`LevelTabs`, `TimeSignatureBuilder`, `AudioEngine` | Volumen A y Metrónomo 1 | “El metrónomo marca el inicio de A; el volumen controla la pista.” | Alternar metrónomo y bajar volumen. | Confirmación visual; la escucha queda a criterio de la persona. | Sliders deben conservar etiqueta, valor y operación por teclado. |
| `grouping-valid` | 2 | Leer grupos aditivos. | `GroupingInput`, `BeatGrid` | Texto, sugerencias y colores A | “En 7/8, 3+2+2 distribuye siete posiciones en tres grupos.” | Escribir patrón válido o elegir sugerencia. | Feedback válido y suma igual a 7. | Anunciar feedback y no codificar grupos solo por color. |
| `grouping-draft` | 2 | Distinguir borrador y configuración aplicada. | `GroupingInput` | Estado de validación | “Un texto incompleto no sustituye automáticamente la última agrupación válida.” | Probar `3+` y corregirlo. | Confirmar estado o corregirlo, sin bloquear navegación. | Mensajes de error/status deben estar asociados al campo. |
| `track-b` | 3 | Comprender que hay una segunda pista. | `PolyrhythmControls`, `BeatGrid` | Métrica, grilla y volumen B | “B tiene su propio patrón, acentos y volumen.” | Cambiar una posición o el volumen B. | Observar cambio en B; avance sin exigir audio. | Identificar pista mediante nombre/texto, no solo cian. |
| `relation-modes` | 3 | Diferenciar polirritmia y polimetría. | `PolyrhythmControls`, `AudioInfoBadge` | Selector de modo y estadísticas | “Polirritmia iguala duración de ciclo; polimetría conserva el valor de cada unidad.” | Alternar modos con A/B configuradas. | Mostrar que las razones cambian y explicar sus unidades. | Evitar transmitir razón solo visualmente; razones deben leerse en texto. |
| `morph-control` | 3 | Explorar mezcla de pistas. | `PolyrhythmControls` | Slider Morph | “El control mezcla las ganancias de A y B; no cambia el patrón.” | Probar extremos y punto medio. | Indicador llega a 0, 50 y 100 %. | Actualizar valor accesible; no exigir distinguir timbres para completar. |
| `clave-patterns` | 3 | Explorar patrones de clave. | `PolyrhythmControls`, `CircularVisualizer` | Selector de patrón de clave | “Son y rumba usan ciclos canónicos de ocho negras, organizados en dos compases de 4/4.” | Elegir Son 3-2 o Rumba 2-3. | Mostrar nombre, ciclo y ataques. | Describir patrones con texto y mantener botones alcanzables con teclado. |
| `test-level` | Cierre | Repasar una idea del nivel. | `MainLayout`, `TestModal` | Botón Test Nivel | “Respondé una pregunta sobre la configuración actual.” | Abrir el test y elegir una opción. | Feedback visible y anunciado; siempre permitir cerrar. | No convertir una respuesta incorrecta en bloqueo o penalización. |

### Requisitos propuestos del tour

El futuro tour debería ser opcional, fácil de cerrar y reiniciable desde un
punto visible. Debe funcionar con teclado, lectores de pantalla y dispositivos
móviles; no puede depender de hover, apuntar con mouse ni de una coordenada
fija. Debe respetar `prefers-reduced-motion` y el control de reducción de
movimiento, mantener contraste y foco visibles, anunciar cambios y evitar que
un tooltip tape el control que explica. Si utiliza diálogo modal, debe seguir
el patrón accesible probado en los modales actuales. Ninguna de estas mejoras
se implementa en esta tarea.

## 8. Capacidades, limitaciones y mejoras futuras

### Capacidades existentes

- Niveles 1–3 y numeradores 1–32, denominadores 1/2/4/8/16 y BPM 40–200.
- Patrones configurables por pista, volúmenes A/B, metrónomo opcional y cuatro
  modos de nivel 3.
- Parser, validación y sugerencias de agrupación; distinción entre agrupación
  aplicada y borrador.
- Estadísticas de pasos, frecuencias, duraciones y reencuentros. Las reglas y
  unidades se detallan en [`musical-domain.md`](musical-domain.md).
- Síntesis mediante Web Audio y programación por reloj `AudioContext`.
  Las pruebas comprueban reglas de cálculo, programación y ciclo de vida; no
  demuestran “cero jitter”, precisión perceptiva universal ni equivalencia con
  instrumentos acústicos.
- Grillas largas, controles con nombres accesibles, preferencias visuales y
  diálogos con manejo de foco.

### Discrepancias documentales detectadas

- El README describe datos históricos de pruebas (27 tests y una suite sin
  casos E2E) que no corresponden al estado actual del proyecto. En la
  validación reciente se reportaron 163 tests unitarios y 8 E2E; estos números
  pueden cambiar con futuras modificaciones.
- El README y la primera pantalla de `WelcomeModal` usan afirmaciones como
  “cero jitter”, “cero drift” o “precisión absoluta”. Las pruebas respaldan
  propiedades específicas de cálculo y programación, no garantías auditivas
  absolutas; conviene moderar esas frases al actualizar esos textos.
- La segunda pantalla de `WelcomeModal` dice que el scroll es para “más de 16”
  pulsos; `BeatGrid.jsx` lo activa desde 16 posiciones inclusive.
- La guía inicial llama al modal “tutorial interactivo”, pero actualmente es
  una introducción de cuatro pantallas sin pasos anclados a los controles ni
  condiciones de avance asociadas a acciones del usuario.

Esta tarea no actualiza README ni los textos del modal.

### Problemas detectados y límites de la validación

- Los colores de agrupación ayudan a seguir segmentos, pero la agrupación no
  crea acentos automáticos; eso puede no resultar obvio a una persona nueva.
- El Test de Nivel es una pregunta de opción múltiple, no una evaluación de
  escucha ni una prueba de ejecución.
- Las pruebas automatizadas no determinan inteligibilidad de timbres,
  audibilidad en distintos dispositivos, mezcla adecuada ni comprensión
  pedagógica.
- La visualización de los pulsos suaves se limita en modo seguro por encima
  de 130 BPM; el audio continúa. Esto puede hacer que animación y escucha no
  tengan el mismo énfasis visual.
- Las agrupaciones y patrones de clave reflejan convenciones codificadas en el
  proyecto; no sustituyen el contexto cultural, interpretativo o estilístico
  de quien enseña esos ritmos.

### Propuestas futuras

- Tour opcional y reiniciable, basado en los IDs de la tabla anterior.
- Explicaciones breves junto a `eventRatio`, `durationRatio` y reencuentros,
  con ejemplos sonoros y visuales comparables.
- Actividad pedagógica que permita elegir si los inicios de grupo deben
  convertirse en acentos sugeridos, sin cambiar la agrupación actual por
  defecto.
- Validación manual con personas usuarias y escucha en distintos parlantes y
  auriculares antes de afirmar que los contrastes son universalmente claros.
- Revisión editorial del README y de las cuatro pantallas actuales de ayuda.

## Referencias de implementación y pruebas

- Estado, defaults, fórmulas mostradas y preguntas del test:
  `src/context/RitmiaContext.jsx`.
- Límites, nombres de unidades y presets: `src/music/constants.js`.
- Fórmulas, razones y reencuentros: `src/music/timingCalculator.js` y
  `docs/musical-domain.md`.
- Agrupaciones y sugerencias: `src/music/groupingSuggestions.js`.
- Patrones canónicos: `src/music/clavePatterns.js`.
- Interfaz: `src/components/layout/`, `src/components/controls/`,
  `src/components/visualizer/` y `src/components/modals/`.
- Cobertura de interacción musical y accesibilidad:
  `tests/components/MusicalControls.test.jsx`,
  `tests/components/BeatGrid.test.jsx`,
  `tests/components/TimeSignatureBuilder.test.jsx`,
  `tests/components/Accessibility.test.jsx`,
  `tests/music/groupingSuggestions.test.js`,
  `tests/music/clavePatterns.test.js` y
  `tests/context/RitmiaContext.test.jsx`.
- Viewports, grillas largas, modales y recorrido principal:
  `e2e/accessibility-responsive.spec.js` y `e2e/ritmia.spec.js`.
