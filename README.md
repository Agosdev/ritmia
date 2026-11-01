# Ritmia

Laboratorio rítmico interactivo con interfaz neumórfica y percusión acústica.

Construí patrones de hasta 32 posiciones, editá acentos fuertes, suaves y silencios, ajustá BPM y volumen, y explorá tres niveles de navegación libre:

- **Ritmo:** una pista, compás y secuenciador.
- **Agrupaciones:** grupos aditivos configurables.
- **Dos pistas:** A/B, polirritmia, polimetría, Morph y clave.

Incluye presets pedagógicos editables de bulerías, tangos flamencos y tango argentino marcato en cuatro. Sus alcances y fuentes se describen en [el informe de cierre](docs/10-cierre-ritmia.md).

El visualizador clásico es predeterminado. Rebote 2D (Canvas) y Órbita 3D (Three.js) son opcionales; Three.js se descarga al activar 3D. Se respeta automáticamente el movimiento reducido del sistema y se ofrece fallback 2D si WebGL no está disponible.

Reproducir/Detener conserva la fase; Reiniciar vuelve al principio y continúa solamente si se estaba reproduciendo. La marcación acústica del inicio de compás es opcional y comienza apagada.

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

Three.js utiliza [licencia MIT](public/licenses/three-MIT.txt). No se declara una licencia general del código de Ritmia; las licencias de audio y dependencias no deben interpretarse como tal.
