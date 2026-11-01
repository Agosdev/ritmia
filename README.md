# Ritmia

Laboratorio rítmico interactivo con interfaz neumórfica, construido con React, Vite, Styled Components y Web Audio API.

**Sitio:** https://agosdev.github.io/ritmia/

Permite editar compases de hasta 32 pulsos, alternar acentos fuertes, suaves y silencios, ajustar BPM y volumen, y reproducir, pausar, reanudar o reiniciar patrones. Incluye un visualizador circular, percusión acústica y un kit de síntesis, opciones de movimiento reducido y ejercicios de lectura.

## Tres niveles de navegación libre

- **Ritmo:** una pista A, compás, acentos, silencios y secuenciador.
- **Agrupaciones:** añade agrupaciones aditivas configurables, como `3+2+2`.
- **Dos pistas:** combina A/B con polirritmia, polimetría, Morph (ganancia cruzada) y patrones de clave.

Lite es la única interfaz accesible en producción. El código de Art y del laboratorio original se conserva para inspección en desarrollo; los parámetros de URL no habilitan esas interfaces en el build público.

## Instalación y desarrollo

Requisitos: Node 22 y npm 10. `.nvmrc` fija la versión usada localmente.

```sh
git clone https://github.com/Agosdev/ritmia.git
cd ritmia
nvm use                 # si utilizás NVM
npm ci
npm run dev
```

Abrí la URL que muestra Vite. El desarrollo local usa `/`.

Rutas de inspección, exclusivamente en desarrollo:

- `/?dev=1`: selector Lite/Art, con estado musical compartido.
- `/?interface=art`: Art.
- `/?prototype=lab`: laboratorio original.
- `/?prototype=rhythm-a`: prototipo visual.

## Tests

```sh
npm test
npm run build
npm run test:e2e
git diff --check
```

Los E2E usan Playwright y arrancan Vite automáticamente en `127.0.0.1:5173`. Para instalar su Chromium en una plataforma compatible:

```sh
npx playwright install chromium
```

En un Mac con Chrome local ya instalado se puede usar:

```sh
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e
```

El workflow existente de pruebas conserva las verificaciones unitarias y E2E en Ubuntu.

## GitHub Pages

En **Settings → Pages → Build and deployment → Source**, seleccioná **GitHub Actions**. El workflow `Deploy GitHub Pages` se activa con un push a `main` o manualmente desde Actions. Usa Node 22, `npm ci`, tests, build y despliegue de `dist` mediante las acciones oficiales de Pages.

Para comprobar localmente el mismo build:

```sh
npm run build -- --mode pages
npm run preview -- --mode pages
```

Abrí `http://localhost:4173/ritmia/`. El modo `pages` fija la base `/ritmia/`; los builds normales y el desarrollo mantienen `/`. El banco acústico resuelve sus archivos mediante `import.meta.env.BASE_URL`.

La ejecución del workflow y la URL pública deben verificarse en Actions antes de dar por terminado el despliegue.

## Samples y atribuciones

El kit acústico deriva de **Virtuosity Drums**, de Versilian Studios LLC y Karoryfer Lecolds, con interpretación de **Austin McMahon**. La fuente declara **CC0 1.0 Universal**.

- [Proyecto original](https://versilian-studios.com/virtuosity-drums/).
- [Fuente fijada y licencia](https://github.com/sfzinstruments/virtuosity_drums/blob/9f04cf9a734527edfbb0a4eee1f674e45bbf71bc/LICENSE).
- [Licencia incluida](public/audio/acoustic/LICENSE.txt).
- [Manifiesto local](public/audio/acoustic/manifest.json): archivos originales, revisión, transformaciones y tamaños de las cuatro muestras distribuidas.

Las muestras se adaptaron a mono y 22,05 kHz, con recorte, fade y ajuste de amplitud. La referencia artística JPEG local no forma parte del repositorio ni del sitio.

CC0 se refiere a esas muestras. Este repositorio no declara una licencia general para su código; no debe inferirse una a partir de la licencia del audio.
