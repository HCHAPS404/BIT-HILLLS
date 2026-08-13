import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // El front habla con el Worker local sin CORS ni variables de entorno.
    proxy: { '/api': 'http://localhost:8787' },
  },
});
