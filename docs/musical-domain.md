# Convenciones del dominio — Tarea 03A

La etiqueta anterior «ratio» era ambigua: se calculaba con las duraciones
escritas, pero se presentaba como polirritmia. Se distinguen tres relaciones
A:B reducidas, sin modificar los pasos que programa AudioEngine. El campo
ambiguo `ratio` se reemplaza por estos nombres explícitos en todos sus consumidores:

- `pulseRatio`: cantidad de pasos de grilla por compás propio. Incluye silencios;
  no es una cuenta de golpes audibles ni una decisión sobre el pulso percibido.
- `eventRatio`: frecuencia de pasos sobre el mismo intervalo temporal.
  En polirritmia es numA:numB; en polimetría es denA:denB.
- `durationRatio`: duración efectiva de los compases. Es 1:1 cuando B se adapta
  a A; en polimetría corresponde a sus duraciones métricas independientes.

BPM significa negras por minuto, incluso en compases compuestos. Un tick es
una fusa (1/32 de redonda), o 1/8 de negra. `ticksA/B` son duraciones escritas
antes de adaptar B; `lcmTicks` es su MCM exacto, no un límite del scheduler.
`stepA/B`, `measureA/B`, `tickSec` y `reunionSec` se expresan en segundos.
El primer reencuentro es la primera coincidencia positiva de inicios de
compás, partiendo juntos; no incluye t=0 ni coincidencias entre pasos internos.

En polirritmia y morph se conserva la ventana compartida existente: reencuentro
1×A/1×B. En polimetría se usa el MCM de las duraciones escritas. Los ciclos de
son y rumba duran canónicamente ocho negras al BPM vigente (64 fusas), con 16
subdivisiones de corchea y cinco ataques. La duración es independiente de A:
equivale a dos compases de 4/4, pero no se describe como dos compases de A si A
tiene otra métrica. `stepB` es la duración canónica dividida por las 16
posiciones; el reencuentro de inicios de compás A/B se calcula con el MCM de
`ticksA` y las 64 fusas del ciclo. `eventRatio` expresa las frecuencias de paso
en un intervalo común y `durationRatio` compara la duración de un compás A con
el ciclo B. Bossa y Shiko conservan su adaptación previa a un compás A.

Por ejemplo, a 120 BPM el ciclo de son/rumba dura 4s tanto con A=3/4 (1,5s;
reencuentro 8×A/3×B a los 12s), A=5/4 (2,5s; 8×A/5×B a los 20s) como A=7/8
(1,75s; 16×A/7×B a los 28s). Con A=4/4 dura dos compases A (4s).
Por ejemplo, a 120 BPM, 3/4 vs 2/8 tiene pasos 0,5s/0,75s en polirritmia
(eventos 3:2, duración 1:1), y 0,5s/0,25s en polimetría (eventos 1:2,
duración 3:1, reencuentro 1×A/3×B a los 1,5s).

Límites: numeradores enteros 1–32, denominadores 1/2/4/8/16 y BPM entero
40–200, iguales a la interfaz. Entradas inválidas al cálculo generan RangeError;
los setters del contexto conservan el último valor válido. No se normalizan
NaN, Infinity, ceros o denominadores arbitrarios a otra configuración musical.
El MCM máximo es 31744 ticks (31/1 vs 32/1); a 40 BPM son 5952 segundos.
Los enteros están muy por debajo de Number.MAX_SAFE_INTEGER. Los segundos
usan coma flotante; no se afirma exactitud binaria ni precisión auditiva.
El horizonte y presupuesto de eventos del scheduler permanecen independientes.
Se retiran `cappedLcm`, `MAX_LCM` y `capped`: no limitaban el trabajo del motor,
solo falseaban el resultado presentado.

Agrupaciones: se aceptan enteros positivos decimales de 1 a 32, incluidos
ceros iniciales, separados exclusivamente por `+`. Se permiten espacios
alrededor de números y separadores, no dentro de un número. Vacío o solo
espacios es un borrador vacío; un prefijo válido terminado en `+` es incompleto.
Ambos son estados no válidos. Separadores repetidos/iniciales, letras, decimales,
signos negativos y otros separadores son inválidos. La suma debe ser el numerador.
La última agrupación válida se conserva al editar texto incorrecto, solo mientras
siga correspondiendo al compás actual; de lo contrario no se aplica agrupación.
El feedback del formulario distingue el borrador de la agrupación aplicada.
Agrupar no crea ni mueve acentos: esta tarea preserva su función visual.

Pendiente de criterio pedagógico humano: si «pulso» debe significar paso escrito
o pulso percibido en compases compuestos; si el denominador de B debe seguir
visible en modos donde se adapta su duración; si se desea acentuación automática
por grupos. No se adoptan esas modificaciones aquí. Los reencuentros describen
configuraciones estables que parten juntas: la fase tras editar en reproducción
sigue su política anterior y no se corrige en esta tarea.
