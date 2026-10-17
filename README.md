# Ritmia — Laboratorio Rítmico de Precisión (1 a 32 pulsos)

**Ritmia** es una aplicación interactiva para la exploración y pedagogía del ritmo, métricas irregulares, polirritmia y polimetría, construida con **React**, **Styled Components**, **Web Audio API pura** y un diseño dark mode de alta estética y ergonomía.

---

## 🎯 Separación de Responsabilidades y Arquitectura

El proyecto está modularizado de forma estricta para garantizar testeabilidad, desacoplamiento y claridad de dominio:

```
src/
├── music/                      # 🎵 Dominio de Teoría Musical pura (100% testeable sin DOM ni Audio)
│   ├── constants.js            # Constantes métricas (MAX_NUM=32, MAX_LCM=2048, presets)
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
   - **Polimetría**: Duración métrica absoluta independiente (corchea = corchea) con cálculo de reencuentro por MCM capado a 2048.
   - **Morphing**: Modulación cruzada de ganancia entre ambos compases sin desfase.
   - **Clave**: 6 patrones de clave sobre la base rítmica.
5. **Accesibilidad y Modo Seguro**: Opción de reducir movimiento y filtro de destellos para tempos rápidos (>130 BPM).
