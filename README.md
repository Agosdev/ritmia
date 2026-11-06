# Ritmia

Laboratorio rítmico interactivo con interfaz de vidrio brillante y percusión acústica.

Construí patrones de hasta 32 posiciones, editá acentos fuertes, suaves y silencios, ajustá BPM y volumen, y explorá dos niveles de navegación libre:

- **Ritmo:** una pista, compás y secuenciador; agrupaciones opcionales al final.
- **Dos ritmos:** A/B, polirritmia, polimetría, Morph y clave.

Incluye presets pedagógicos de palos flamencos y tango argentino marcato en cuatro. Se aplican al elegirlos y fijan el patrón A; «Compás libre» en el selector de la barra inferior desbloquea su edición conservando el ritmo. Sus alcances y fuentes se describen en [el informe de cierre](docs/10-cierre-ritmia.md).

El visualizador clásico es el único disponible. Sigue el reloj de AudioContext y respeta el movimiento reducido del sistema.

Reproducir/Detener conserva la fase; Reiniciar vuelve al principio y continúa solamente si se estaba reproduciendo. La marcación acústica del inicio de compás es opcional y comienza apagada.

Guía actual: [dos niveles, presets y modos](docs/guia-de-uso.md). Informe de esta tarea: [Tarea 11](docs/11-simplificacion.md).

## Desarrollo

React, Vite, Styled Components y Web Audio API. Usá Node 22 (ver `.nvmrc`).

```sh
nvm use
npm ci
npm run dev
```

## Verificación

```sh
npm test
npm run build
npm run test:e2e
git diff --check
```

Playwright puede usar Chrome local con `CHROME_PATH`. Las pruebas unitarias usan mocks; las comprobaciones de navegador no sustituyen una escucha musical humana.

## GitHub Pages

URL: <https://agosdev.github.io/ritmia/>. Los cambios locales necesitan aprobación y publicación para aparecer allí.

```sh
npm run build -- --mode pages
npm run preview -- --mode pages
```

El build Pages usa `/ritmia/`; el desarrollo local usa `/`. El workflow existente despliega al hacer push a `main`, después de las verificaciones configuradas.

## Atribuciones

Los cuatro WAV proceden de [Virtuosity Drums](https://versilian-studios.com/virtuosity-drums/), interpretados por Austin McMahon y publicados por Versilian Studios/Karoryfer bajo CC0. [Manifiesto de procedencia y transformaciones](public/audio/acoustic/manifest.json) y [licencia CC0](public/audio/acoustic/LICENSE.txt).

No se declara una licencia general del código de Ritmia; las licencias de audio y dependencias no deben interpretarse como tal.
