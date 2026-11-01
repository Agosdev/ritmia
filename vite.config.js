import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/ritmia/' : '/',
  plugins: [react()],
  test: {
    include: ['tests/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    css: false,
  },
}))
