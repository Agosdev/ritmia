# Prueba física de audio en Chrome para Android

Esta guía permite validar la reproducción en un teléfono real. La emulación de viewport y Chrome headless no sustituyen esta comprobación; hasta ejecutar estos pasos, el estado de Android físico queda **pendiente**.

## Preparación

1. Usá una computadora con Chrome actualizado y un cable USB que permita datos.
2. En Android, habilitá Opciones para desarrolladores y Depuración por USB. Conectá el teléfono, desbloquealo y aceptá la huella RSA de la computadora.
3. En Chrome de escritorio abrí `chrome://inspect/#devices` y habilitá **Discover USB devices**. El teléfono debe aparecer; junto a su pestaña de Ritmia, elegí **Inspect**.
4. Abrí la versión publicada de Ritmia en el teléfono. Conservá la consola y Network abiertas en DevTools. En Network activá **Preserve log** y desactivá **Disable cache** para la prueba normal; repetí una vez con caché desactivada para medir una carga fría.
5. En Performance, iniciá una grabación justo antes de cada escenario y detenela al final. Para la prueba larga, grabá 2 minutos. Guardá los perfiles como archivos `.json` fuera del repositorio y anotá modelo del teléfono, versión de Android/Chrome, estado de batería, orientación y si estaba conectado a corriente.

## Escenarios

Para cada caso, anotá si se oyen ataques perdidos/duplicados, cortes, distorsión o desincronización; revisá consola, requests y memoria en DevTools:

1. **Compás libre sencillo:** reproducí un patrón corto durante 30 segundos.
2. **Maqsum con darbuka:** dejá que termine la carga diferida del instrumento y reproducí durante 30 segundos. Verificá que no haya una pausa inicial inesperada y que el fallback/aviso aparezca si falla la muestra.
3. **Funk con batería y bajo:** reproducí durante 30 segundos; atendé a los ataques sincopados del bajo y a la independencia respecto del bombo.
4. **Dos pistas:** elegí patrones e instrumentos distintos para A y B, reproducí 60 segundos y comprueba que mantienen el pulso común.
5. **Densidad alta permitida:** usá la mayor subdivisión y cantidad de ataques que exponga la UI, en dos pistas, durante 60 segundos. No añadas golpes fuera de los controles disponibles.
6. **Cambios en reproducción:** durante 60 segundos, cambiá BPM mediante el control, aplicá un BPM sugerido y elegí varios presets. El patrón, los silencios y la sincronía deben mantenerse sin ráfagas atrasadas.
7. **Dos minutos:** repetí el escenario más exigente durante al menos 2 minutos. Mirá si la memoria crece sin estabilizarse, si aumentan los frames lentos o si se acumulan errores.

## Qué revisar en DevTools

- En **Performance**, inspeccioná frames, tareas largas, scripting, style/layout/paint y eventos de audio visibles en la traza. Una captura iniciada desde la computadora puede añadir overhead; compará siempre con la misma configuración.
- En **Console**, buscá errores de `AudioContext`, decodificación, archivos 404 y excepciones de React.
- En **Network**, filtrá por `wav` y confirmá que solo se solicitan los instrumentos usados. Revisá tamaño transferido, duración y requests repetidos.
- En **Memory**, tomá heap snapshots al inicio y luego de 2 minutos si el dispositivo lo permite. DevTools puede desconectar o ralentizar el teléfono durante capturas pesadas.
- Probá apagar y encender la pantalla, cambiar a otra app y volver. Una pausa manual no debe mostrar un error; una interrupción del navegador debe ofrecer **Reanudar sonido** sin reiniciar el patrón ni cambiar BPM/instrumentos.

## Reporte a devolver

Incluí modelo/dispositivo, Android, Chrome, escenario y duración; adjuntá los perfiles de Performance si son compartibles, errores de consola, requests de audio y una descripción del problema audible. Indicá expresamente si la prueba fue en teléfono físico o emulación. No compartas datos personales capturados en perfiles sin revisarlos.
