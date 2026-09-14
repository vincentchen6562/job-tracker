import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    // In development Express runs separately; forwarding keeps /api on the
    // page's own origin, as it is in production (ADR-0004).
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
