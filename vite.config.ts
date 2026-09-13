import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/ChessChallenge/' : '/',
  plugins: [react()],
  // Vite does not read PORT on its own; without this it ignores an assigned
  // port and silently picks its own, leaving whoever asked pointed at nothing.
  server: { port: Number(process.env.PORT) || undefined },
  test: {
    // Worktrees live under .claude/ and carry their own (often stale) tests.
    exclude: [...configDefaults.exclude, '.claude/**'],
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
