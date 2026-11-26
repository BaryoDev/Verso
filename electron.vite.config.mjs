import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {},
  // Bundled, because a sandboxed preload can load only electron itself.
  preload: {
    build: {
      externalizeDeps: { exclude: ['@electron-toolkit/preload'] }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
