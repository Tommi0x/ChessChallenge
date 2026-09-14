import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative assets work at both a GitHub Pages repository path and a local preview.
  base: './',
  plugins: [react()],
  // Vite does not read PORT on its own; without this it ignores an assigned
  // port and silently picks its own, leaving whoever asked pointed at nothing.
  server: { port: Number(process.env.PORT) || undefined },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
