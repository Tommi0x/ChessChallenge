import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/ChessChallenge/' : '/',
  plugins: [react()],
  test: {
    // Worktrees live under .claude/ and carry their own (often stale) tests.
    exclude: [...configDefaults.exclude, '.claude/**'],
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
