import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // El front habla con el Worker local sin CORS ni variables de entorno.
    proxy: { '/api': 'http://localhost:8787' },
  },
  build: {
    // MapLibre por sí solo pesa ~800 kB minificado — es el tamaño real de
    // una librería de mapas WebGL, no bloat. Con manualChunks abajo ya
    // vive aparte del código propio; este límite solo evita el aviso
    // repetido por algo que ya es una decisión consciente.
    chunkSizeWarningLimit: 850,
    rollupOptions: {
      output: {
        // MapLibre es la mitad del bundle y cambia poco entre releases —
        // separarlo del código propio deja que el navegador lo cachee
        // aparte. Sin esto, cualquier cambio de una línea en App.tsx
        // invalida el JS de la librería del mapa completo también.
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-maplibre': ['maplibre-gl'],
        },
      },
    },
  },
});
