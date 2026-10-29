# Ritmia — Laboratorio Rítmico de Precisión (1 a 32 pulsos)

**Ritmia** es una aplicación interactiva para la exploración y pedagogía del ritmo, métricas irregulares, polirritmia y polimetría, construida con **React**, **Styled Components**, **Web Audio API pura** y un diseño dark mode de alta estética y ergonomía.

---

## 🎯 Separación de Responsabilidades y Arquitectura

El proyecto está modularizado de forma estricta para garantizar testeabilidad, desacoplamiento y claridad de dominio:

```
src/
├── music/                      # 🎵 Dominio de Teoría Musical pura (100% testeable sin DOM ni Audio)
│   ├── constants.js            # Constantes métricas (MAX_NUM=32, BPM=40–200, presets)
│   ├── timingCalculator.js     # GCD, LCM, cálculo exacto de stepA/B, measureA/B, ratio
│   ├── groupingSuggestions.js  # Parser de agrupación ("3+2+2"), validación y sugerencias
│   └── clavePatterns.js        # 6 patrones afrocubanos clásicos (Son, Rumba, Bossa, Shiko)
│
├── audio/                      # 🔊 Motor Web Audio API de Alta Precisión (Cero Drift)
│   ├── AudioEngine.js          # Scheduler con lookahead (100ms) locked a AudioContext.currentTime
│   ├── instruments.js          # Síntesis analógica (Kick 160→45Hz, Bajo 110Hz, Snare, Hat, Woodblock)
│   └── masterBus.js            # DynamicsCompressor (-20dB, 6:1) + control maestro
│
├── context/                    # ⚛️ Estado Global React y Sincronización
│   └── RitmiaContext.jsx       # Contexto unificado, loop rAF (requestAnimationFrame) a 60fps
│
├── styles/                     # 🎨 Sistema de Diseño (Styled Components)
│   ├── theme.js                # Tokens (colores, sombras, tipografías, radios, transiciones)
│   ├── GlobalStyles.js         # Reset y estilos globales (reemplazo completo de Tailwind)
│   └── animations.js           # Keyframes de glow y microinteracciones
│
├── components/                 # 🧩 Componentes de Interfaz y UX
│   ├── ui/                     # Átomos reutilizables (Button, IconButton, Badge, Toggle, Card)
│   ├── layout/                 # Header, Footer, MainLayout
│   ├── visualizer/             # Visualizador circular SVG, BeatGrid táctil, Timeline, AudioInfo
│   ├── controls/               # Presets de compás, selector de agrupación, polirritmia/polimetría
│   └── modals/                 # WelcomeModal (tutorial interactivo), TestModal (evaluación de nivel)
│
└── tests/                      # 🧪 Suite de Pruebas Automatizadas (Vitest + Testing Library)
    ├── setup.js                # Mocks completos de Web Audio API
    ├── music/                  # Tests unitarios de teoría y cálculo métrico
    ├── audio/                  # Tests de programación de sintetizadores
    └── components/             # Tests de interacción táctil y componentes React
```

---

## 🚀 Comandos Disponibles

En la carpeta `/Users/agostina/.gemini/antigravity-ide/scratch/ritmia`:

```bash
# Iniciar servidor de desarrollo con HMR
npm run dev

# Ejecutar suite de pruebas completa
npm run test

# Ejecutar pruebas en modo observador (watch)
npm run test:watch

# Compilar bundle de producción
npm run build
```

---

## 💡 Características Clave

1. **Reloj Maestro Web Audio API**: Utiliza `AudioContext.currentTime` y no `Date.now` ni temporizadores Javascript para el disparo de sonido, garantizando **cero jitter y cero drift métrico**.
2. **Soporte hasta 32 pulsos**: Permite explorar compases largos como 12/4, 12/8, 15/8, 24/16, etc.
3. **Agrupación aditiva y sugerencias auto**: Parseo y validación en tiempo real de compases irregulares (ej. `3+2+2` o `3+3+3+3`) con paleta de arcos coloreados diferenciados.
4. **4 Modos de Nivel 3**:
   - **Polirritmia**: La pista B se ajusta temporalmente a la pista A (ratio exacto).
   - **Polimetría**: Duración métrica absoluta independiente (corchea = corchea) con cálculo de reencuentro por MCM exacto, sin truncamiento.
   - **Morphing**: Modulación cruzada de ganancia entre ambos compases sin desfase.
   - **Clave**: 6 patrones de clave sobre la base rítmica.
5. **Accesibilidad y Modo Seguro**: Opción de reducir movimiento y filtro de destellos para tempos rápidos (>130 BPM).

## Testing reproducible

Entorno verificado: macOS Monterey 12.7.6, Intel x86_64. La shell usaba
Node 18.17.0 / npm 9.6.7; el proyecto usa ahora el Node 22.16.0 ya instalado
(npm 10.9.2), fijado en `.nvmrc`. No se instaló ni cambió el Node global.
La rama [Node 22](https://github.com/nodejs/node/blob/v22.x/BUILDING.md)
compila binarios x64 con destino macOS 11; esto permite ejecutarlos aquí,
pero no convierte Monterey en una plataforma con soporte vigente.

```bash
nvm use
npm ci
npm test
npm run build
npx --no-install playwright test --list
npm run test:e2e
```

Vitest descubre exclusivamente `tests/**/*.{test,spec}.{js,jsx,ts,tsx}`:
se conservan los 27 tests existentes y `e2e/` queda fuera. El lockfile
mantiene formato v1 para preservar los cambios locales previos; no ejecutar
`npm update` como parte de la instalación.

Playwright apunta a Ritmia en `http://127.0.0.1:5173` y arranca Vite con
puerto estricto. En CI no reutiliza servidores existentes. No hay casos E2E
de Ritmia todavía: los ejemplos contra playwright.dev fueron retirados.
El listado devuelve `No tests found` y código 1; no equivale a un fallo de
carga de configuración ni a una ejecución exitosa de navegadores.

Los [requisitos de Playwright](https://playwright.dev/docs/intro) excluyen
Monterey; no se instalaron navegadores ni versiones antiguas para eludirlo.
Para futuros E2E usar CI Ubuntu 24.04 x64, Node 22 actualizado, `npm ci`,
`npx --no-install playwright install --with-deps`, y `npm run test:e2e`.
Agregar primero pruebas reales de Ritmia; no habilitar una comprobación verde
mediante `--pass-with-no-tests`. La validación local de listado no certifica
Chromium, Firefox ni WebKit.

Validación de Tarea 01 (28/10/2026, Node 22.16.0 / npm 10.9.2):
`npm test`: 6 archivos, 27 aprobados, 0 fallidos, 0 omitidos.
`npm run build`: correcto (69 módulos).
`npx --no-install playwright test --list`: configuración cargada, 0 casos,
código 1 (`No tests found`). No se ejecutaron navegadores.

Las unidades, ratios, reencuentros y reglas de validación están documentados en
[Convenciones del dominio musical](docs/musical-domain.md).
