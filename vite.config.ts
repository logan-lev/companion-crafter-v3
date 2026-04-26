import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }

          if (id.includes('/src/data/srd-spells.ts')) {
            return 'spell-data'
          }

          if (id.includes('/src/data/srd-classes.ts')) {
            return 'class-data'
          }

          if (id.includes('/src/data/srd-races.ts')) {
            return 'race-data'
          }

          if (id.includes('/src/data/')) {
            return 'game-data'
          }
        },
      },
    },
  },
})
