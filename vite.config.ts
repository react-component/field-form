/// <reference types="vitest" />

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          'root-entry-name': 'variable',
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setupAfterEnv.ts',
    css: true,
    reporters: ['default', 'junit'],
    outputFile: './coverage/test-results.xml',
    // @ts-ignore
    coverage: {
      all: true,
      exclude: [
        '**/*.stories.*',
        '**/*.test.*',
        '**/*.d.ts',
        '**/types.ts',
        '**/__mocks__',
        'src/index.tsx',
        'src/.umi/**/*',
      ],
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['cobertura', 'html', 'text-summary', 'text'],
    },
  },
});
