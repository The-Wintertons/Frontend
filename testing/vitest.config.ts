import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      include: ['src/**/*.vue', 'src/**/*.ts'],
      exclude: ['node_modules/']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../Winterton-Trades/src')
    }
  }
})
