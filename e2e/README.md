# E2E de Ritmia

Playwright verifica recorridos principales de Ritmia y responsive en Chromium.
La suite se ejecuta en GitHub Actions sobre Ubuntu 24.04; la configuración
Chromium evita depender de navegadores que no son compatibles con macOS Monterey.

Para ejecutar localmente: `npx playwright install chromium` y
`npx playwright test`. En equipos sin navegador compatible se puede comprobar
el descubrimiento con `npx playwright test --list`; esto no sustituye la
ejecución E2E en CI.
