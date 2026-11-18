import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Offline support uses a hand-written public/sw.js instead of vite-plugin-pwa's
// build-time generateSW step: on this machine, a Windows Application Control
// policy blocks the native rollup binary that step needs on its second
// invocation (reproducible, not transient). A cache-on-fetch service worker
// gives the same "offline after first load" outcome without that build step.
export default defineConfig({
  plugins: [react(), tailwindcss() as any],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
