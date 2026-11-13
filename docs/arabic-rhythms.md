# Ritmos de la familia Árabe: alcance y fuentes

Se recuperó el selector y los diez IDs locales. Se corrigieron compases y
patrones antes de validar. Las versiones aquí son esqueletos de práctica,
no transcripciones universales: existen variaciones regionales e interpretativas.
Karsilama y Chiftetelli son de tradición turca/griega; la familia del selector
los reúne por repertorio compartido, sin afirmar origen árabe.

## Fuentes consultadas (8 de noviembre de 2026)

- [Nesma y Khamis Henkesh, Rhythms of Oriental Dance, 2005](https://nesmaacademy.com/wp-content/uploads/2019/09/Nesma_BookletDVD_NV0401en.pdf), páginas impresas 7–11: bases de Wahda Sogayara, Masmoudi Sogayar, Maksoum, Fallahi, Saidi, Malfouf y Ayoup. Explica el compás y distingue golpes de rellenos.
- [Baba Yaga Music: diagramas y demostraciones](https://www.babayagamusic.com/Music/oriental-dance-rhythm-diagrams-and-descriptions.htm), secciones por métrica: cotejo de bases y selección de Chiftetelli lento y Turkish 9/8 (Karsilama). Sus diagramas identifican posiciones y silencios; no se mezclan variantes para fabricar otra.
- [Carmine Guida: Rhythm Cheat Sheet](https://s3-us-west-2.amazonaws.com/ctg-public-content/files/501049ab3470391206000002/haflasongs-full.pdf): cotejo de Ayub y del ciclo largo de Çiftetelli.

## Variantes elegidas

D = DUM, T = TAK, K = KA, `-` = posición sin ataque. Cada carácter ocupa
una posición igual de la rejilla. Estos símbolos guardan la intención del
modelo; no nombran los samples que se escuchan.

| Preset | Compás | Unidad de rejilla | Esqueleto |
| --- | --- | --- | --- |
| Maqsum | 4/4 | corchea | `DT-TD-T-` |
| Baladi (Masmoudi Saghir) | 4/4 | corchea | `DD-TD-T-` |
| Saidi | 4/4 | corchea | `DT-DD-T-` |
| Malfuf | 2/4 | semicorchea | `D--T--T-` |
| Ayoub | 2/4 | semicorchea | `D--KD-T-` |
| Masmoudi Kabir | 8/4 | negra | `DD-TD-T-` |
| Chiftetelli | 8/4 | corchea | `D--T--T-D-D-T---` |
| Wahda Sogayara | 4/4 | corchea | `D--T--T-` |
| Fallahi | 2/4 | semicorchea | `DT-TD-T-` |
| Karsilama | 9/8 | corchea | `D-T-D-TTT` |

Ayoub usa la variante con KA de enlace, no un tresillo ni 6/8.
Masmoudi usa la base con DUM en tiempos 1, 2 y 5, TAK en 4 y 7.
Chiftetelli usa la variante escasa, con TAK en 2&, 4, 7 y DUM en 1, 5, 6;
no la versión con rellenos de Carmine. Wahda usa la base de Nesma de un
solo DUM. Fallahi conserva el esqueleto comprimido de Maqsum: su ZAK
característico se reduce a T en este modelo de dos intensidades.
Karsilama incluye tres TAK finales en el grupo de tres, variante del diagrama
Turkish 9/8. La rejilla es uniforme: no reproduce swing ni microtiming.
Los tempos son sugerencias de práctica, no una norma ni parte de la definición.

## Contrato técnico

`num/den` conserva el compás musical. `subdivision` (opcional; antes = 1)
indica posiciones iguales por unidad del denominador. `strokes` preserva
los nombres de golpes; `accents` es su proyección sonora/visual:
D → 2, T/K → 1, silencio → 0. Un DUM no equivale musicalmente a un acento
fuerte: esta conversión es una limitación explícita de la herramienta.

BPM siempre significa negras/min. La duración de compás es
`(60/BPM) * num * 4/den`; la duración de posición es esa duración dividida
por `num * subdivision`. El denominador y BPM no se alteran para subdividir.
Los grupos siguen expresados en unidades del compás y se expanden solo para
las vistas de rejilla. Los ratios de eventos cuentan las posiciones subdivididas;
las duraciones y los reencuentros métricos permanecen iguales. B conserva su modo,
patrón y contrato temporal. AudioEngine no necesita modificaciones.

Compás libre conserva subdivisión, acentos, duración y reproducción al quitar
el preset. La subdivisión puede editarse después (1, 2 o 4) dentro del límite
existente de 32 posiciones y resolución de fusa; una métrica incompatible
vuelve a una posición por unidad. Cambiar la resolución conserva el prefijo de
acentos como el redimensionamiento previo de la rejilla; no reinterpreta golpes.
Los presets anteriores conservan todos sus datos musicales; solo agregan familia.

`productClosure` asumía una negra por posición para todos los presets. Ahora
verifica métrica, duración de compás y cada ataque programado, incluidos los
silencios y el denominador: permite corcheas/semicorcheas sin debilitar el contrato.

## Articulaciones y bancos de audio

La familia recomienda ahora darbuka real: DUM, TAK y PA son grabaciones
separadas. KA usa la muestra TAK a menor intensidad; los patrones actuales
no contienen PA y no se añaden golpes para utilizarlo. El kit acústico anterior
sigue disponible: al elegirlo se conserva la reducción a bombo fuerte/suave.
Otros instrumentos usan su mapeo documentado sin cambiar posiciones ni silencios.
Ver [fuentes, licencias y límites](audio-sources.md). No se modelan adornos,
microtiming ni todas las técnicas regionales, y no se certifica autenticidad
interpretativa mediante tests automatizados.
