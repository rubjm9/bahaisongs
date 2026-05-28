import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    css: false,
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['**/*.config.*', '**/.next/**', '**/node_modules/**'],
    },
  },
  resolve: {
    alias: {
      '@/app': path.resolve(__dirname, './app'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/entities': path.resolve(__dirname, './src/entities'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/server': path.resolve(__dirname, './src/server'),
      '@/data': path.resolve(__dirname, './src/data'),
      '@/messages': path.resolve(__dirname, './messages'),
      // server-only is a Next.js runtime guard; in unit tests we stub it.
      'server-only': path.resolve(__dirname, './vitest-stub-empty.ts'),
    },
  },
});
