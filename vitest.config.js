import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: [
      'blocks/**/__tests__/**/*.test.{js,jsx}',
      'scripts/**/__tests__/**/*.test.{js,jsx}',
      'tools/**/__tests__/**/*.test.{js,jsx}',
      'tests/unit/**/*.test.{js,jsx}',
      'tests/integration/**/*.test.{js,jsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['blocks/**/*.{js,jsx}'],
      exclude: [
        'blocks/**/__tests__/**',
        'blocks/**/*.stories.jsx',
        'blocks/**/*.bundle.js',
      ],
    },
  },
});
