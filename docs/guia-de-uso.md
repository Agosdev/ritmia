# Guía de Ritmia

## Nivel 1 — Ritmo

Editá una pista A: BPM (negras por minuto), compás, volumen y golpes. Cada celda alterna silencio → suave → fuerte. Elegir un preset lo aplica de inmediato: configura compás, acentos y agrupación de A, y el BPM compartido. Mientras esté seleccionado, el compás, sus golpes y sus grupos están bloqueados para que puedas observar y escuchar el modelo. BPM y volumen siguen disponibles. Conserva B, sus volúmenes y el modo.

Al final, «Agrupaciones (opcional)» divide visualmente el compás. Por ejemplo, 7/8 en 3+2+2. Escribir grupos no cambia el sonido. «Aplicar acentos a los grupos» convierte en fuertes los comienzos que ya sonaban; conserva silencios y otros acentos. Un comienzo silencioso sigue vacío. Podés editar después cualquier celda. La acción requiere una agrupación válida y no cambia el compás.

Para editar A, elegí **Compás libre** (en negrita) en el selector de la barra inferior, o usá la **×** junto al selector o a la izquierda del chip bajo el título. Las dos × aparecen solo con un preset activo y devuelven el foco al selector. El chip muestra el nombre y el compás de A, actualizados al seleccionar o editar en modo libre. Esta acción quita la selección y conservan compás, golpes, grupos, tempo y reproducción actuales; no reinician el audio ni borran B. «Compás libre» significa edición manual de un compás válido, no una reproducción sin métrica. Los presets se pueden cambiar directamente entre sí. En los de doce cuentas, al quitar el preset se vuelve a la numeración de pasos desde 1.

## Nivel 2 — Dos ritmos

Agrega B para explorar relaciones entre patrones. Cambiar de nivel conserva la edición; solo este nivel reproduce B. El modo define la relación, independientemente del preset de A:

- Polirritmia: B distribuye sus posiciones dentro del ciclo de A. Su denominador escrito no determina la duración audible.
- Polimetría: cada compás dura según sus propios valores al mismo BPM. Se reencuentran según sus duraciones.
- Morph: mezcla las ganancias de A y B sobre un ciclo común. 0% solo A, 100% solo B.
- Clave: carga en B la clave seleccionada; al salir restaura el patrón B anterior. Los patrones canónicos de dos compases duran ocho negras; los adaptados siguen la duración de A. Los golpes siguen siendo editables. Cambiar de clave vuelve a cargar sus golpes.

El denominador B se edita en Polimetría. En Clave, el tamaño y denominador pertenecen al patrón. Entrada libre avanzada y marcas visuales de grupos B están en desplegables. Los grupos B no cambian los golpes.

## Reproducción y lectura

Reproducir/Detener pausa y reanuda conservando fase. Reiniciar vuelve al principio y continúa si estaba sonando. Los volúmenes A/B son independientes. La marcación de inicio de compás es opcional. Se usa exclusivamente percusión acústica; un fallo de carga permite reintentar.

El visualizador clásico sigue AudioContext. A usa cian y B magenta, además de etiquetas y formas distintas. Vacío = silencio, punto = suave, barra = fuerte. Las grillas largas desplazan internamente. Los niveles permanecen fijos arriba. La barra inferior conserva BPM y una fila de tres controles: Reproducir/Detener, Reiniciar y el único selector de presets. La explicación del preset se mantiene sobre el visualizador. «Marcar inicio de compás» está justo antes del secuenciador A. Se retiraron los accesos de tres puntos y bienvenida. El movimiento reducido respeta la preferencia del sistema.

## Palos flamencos en los presets

El selector muestra los nombres de los palos. Además de Bulerías y Tangos flamencos, incluye Martinete, Soleá, Soleá por bulerías, Alegrías, Seguiriyas, Guajiras, Tientos, Rumba flamenca, Farruca y Sevillanas. Se conservan la variante de Bulerías y el Marcato argentino existentes.

Son modelos de práctica con BPM sugeridos; para modificarlos elegí Compás libre. Los ciclos de doce posiciones usan la misma rejilla interna 12/4 que Bulerías, una negra por cuenta. Guajiras representa la alternancia de agrupación 3+3 y 2+2+2; no cambia de denominador durante la reproducción. Martinete carga únicamente una adaptación a seguiriya para baile, explicada al aplicar: no simula el cante libre. No se agregaron modos ni se modificó el motor.

Referencias de contraste: [estudio didáctico de compases de doce pulsos, Telethusa](https://www.flamencoinvestigacion.es/articulos-1012-02-2017-propuestas-ritmo-flamenco/), [Sevillanas, Instituto Andaluz del Flamenco](https://www.juntadeandalucia.es/aaiicc/flamenco/content/sevillanas) y [Tientos, Instituto Andaluz del Flamenco](https://www.juntadeandalucia.es/aaiicc/flamenco/content/tientos). Las reducciones y tempos elegidos son decisiones pedagógicas de Ritmia.

El acabado de vidrio brillante usa la paleta de la referencia local: violeta #8A5CF5, turquesa #2DD9D0, rosa #F59CEB, lavanda #9BABFF y blanco cálido. Bordes iluminados, reflejos estáticos y sombras de contacto separan tarjetas y controles. El fondo es un degradado estático; no se carga la imagen de referencia en la aplicación.

La aproximación web aplica transparencia y desenfoque solo a barras y paneles grandes; botones, chips y controles interiores usan degradados y reflejos sin apilar filtros. Mantiene texto oscuro y un fondo opaco alternativo cuando no hay soporte de filtros o el sistema pide menos transparencia/más contraste. No hay refracción dinámica ni animaciones decorativas. Enfoque contrastado con la [guía de Setproduct sobre glassmorphism y liquid glass](https://www.setproduct.com/blog/liquid-glass-vs-glassmorphism).

Los sliders muestran su valor con un tramo de color. Silencio (círculo vacío), suave (punto) y fuerte (barra) mantienen formas y nombres además del color.

En móvil (hasta 600 px), reproducción y reinicio usan iconos con sus nombres accesibles, reservando más ancho para el preset. La × está integrada a la izquierda dentro del selector, con el nombre alineado a la derecha. El área de la × sigue siendo de 44 × 44 px.

Nivel 1 usa una gama fría (cian, azul y lavanda) con un toque durazno; Nivel 2 invierte el balance con durazno y rosa más un acento cian. Cambiar de nivel cambia el material visual junto con la navegación musical existente. Los bordes tienen un reflejo iridiscente fino que no cubre el texto; paneles y barras son más translúcidos y menos difusos. Los controles interiores conservan reflejos estáticos y no agregan filtros de desenfoque.

En móvil, la leyenda de silencio, suave y fuerte se presenta en una columna alineada a la izquierda.
