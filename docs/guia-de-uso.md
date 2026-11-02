# Guía de Ritmia

## Nivel 1 — Ritmo

Editá una pista A: BPM (negras por minuto), compás, volumen y golpes. Cada celda alterna silencio → suave → fuerte. Un preset es un punto de partida editable: cambia compás, acentos y agrupación de A, y el BPM compartido. Conserva B, sus volúmenes y el modo.

Al final, «Agrupaciones (opcional)» divide visualmente el compás. Por ejemplo, 7/8 en 3+2+2. Escribir grupos no cambia el sonido. «Aplicar acentos a los grupos» convierte en fuertes los comienzos que ya sonaban; conserva silencios y otros acentos. Un comienzo silencioso sigue vacío. Podés editar después cualquier celda. La acción requiere una agrupación válida y no cambia el compás.

## Nivel 2 — Dos ritmos

Agrega B para explorar relaciones entre patrones. Cambiar de nivel conserva la edición; solo este nivel reproduce B. El modo define la relación, independientemente del preset de A:

- Polirritmia: B distribuye sus posiciones dentro del ciclo de A. Su denominador escrito no determina la duración audible.
- Polimetría: cada compás dura según sus propios valores al mismo BPM. Se reencuentran según sus duraciones.
- Morph: mezcla las ganancias de A y B sobre un ciclo común. 0% solo A, 100% solo B.
- Clave: carga en B la clave seleccionada; al salir restaura el patrón B anterior. Los patrones canónicos de dos compases duran ocho negras; los adaptados siguen la duración de A. Los golpes siguen siendo editables. Cambiar de clave vuelve a cargar sus golpes.

El denominador B se edita en Polimetría. En Clave, el tamaño y denominador pertenecen al patrón. Entrada libre avanzada y marcas visuales de grupos B están en desplegables. Los grupos B no cambian los golpes.

## Reproducción y lectura

Reproducir/Detener pausa y reanuda conservando fase. Reiniciar vuelve al principio y continúa si estaba sonando. Los volúmenes A/B son independientes. La marcación de inicio de compás es opcional. Se usa exclusivamente percusión acústica; un fallo de carga permite reintentar.

El visualizador clásico sigue AudioContext. A usa cian y B magenta, además de etiquetas y formas distintas. Vacío = silencio, punto = suave, barra = fuerte. Las grillas largas desplazan internamente. El transporte permanece accesible y el movimiento reducido respeta la preferencia del sistema.
