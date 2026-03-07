import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'tests/**/*.test.{ts,tsx}',
      'backend/**/*.test.{ts,tsx}',
      'frontend/**/*.test.{ts,tsx}',
    ],
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/frontend/**', 'jsdom'],
      ['tests/perf/**', 'jsdom'],
      ['frontend/**', 'jsdom'],
    ],
    setupFiles: ['./vitest.setup.ts'],
  },
});
