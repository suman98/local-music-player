import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@music-library/core': path.resolve(__dirname, '../dist/index.js'),
    },
  },
  server: {
    port: 5173,
    open: true,
    middlewareMode: false,
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
