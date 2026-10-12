import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the built page works from file:// inside Electron.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 1500 },
});
