# Pruebas de navegador de Ritmia

Usar Node 22 y `npm run test:e2e`. `CHROME_PATH` permite usar Chrome local. Playwright inicia Vite en 5173 o reutiliza ese servidor.

La suite verifica dos niveles, edición, transporte, presets, audio acústico/error/reintento, teclado, responsive, movimiento reducido del sistema, visualizador clásico y ausencia de rutas heredadas. El audio real se decodifica en navegador; los tests no equivalen a una escucha humana. `scripts/verify-pages.mjs` valida el preview con base `/ritmia/`.
