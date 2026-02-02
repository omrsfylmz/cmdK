import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

// Content script must be IIFE (immediately invoked function expression)
// to run in the isolated content script environment without relying on ESM loaders.
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}, // Fix for some libs expecting process.env
  },
  build: {
    emptyOutDir: false, // Don't delete dist, main build handles that
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/content/index.tsx'),
      name: 'ContentScript',
      fileName: () => 'assets/content.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
});
