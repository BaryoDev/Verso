
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/renderer/src/setupTests.js'], // Assuming setupTests exists or will be created/checked, otherwise remove
    exclude: ['**/node_modules/**', '**/dist/**', '**/out/**', '**/*.spec.js', 'src/renderer/src/e2e/**'],
  },
});
