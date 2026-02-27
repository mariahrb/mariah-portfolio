import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    host: true, // expose on LAN (useful for testing on phone)
    open: true, // auto-open browser on `npm run dev`

    // Proxy all /api and /health requests to the Go backend
    // so the frontend never hits CORS issues in dev
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: '../backend/frontend/dist', // Go serves this in production
    emptyOutDir: true,
    sourcemap: true,
  },

  // Make VITE_API_URL available; falls back to proxy in dev
  // In production set VITE_API_URL=https://your-domain.com/api/v1
  envPrefix: 'VITE_',
});
