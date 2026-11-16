import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/server-panel-kit/',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory') || id.includes('internmap') || id.includes('decimal.js')) return 'charts'
            if (id.includes('react-router')) return 'router'
            if (id.includes('@radix-ui') || id.includes('radix-ui')) return 'radix'
            if (id.includes('@growthbook')) return 'growthbook'
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'react'
            return 'vendor'
          }
        },
      },
    },
  },
})
