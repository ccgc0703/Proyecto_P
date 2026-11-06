import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // F4.4 · Code-splitting: vendors compartidos en chunks propios para que
  // los cambios de código de las páginas no invaliden la caché de MUI/router.
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // src/api/index.ts re-exporta endpoints.ts: si Rollup los reparte en
          // chunks distintos emite una circular ("...will end up in different
          // chunks"). Se fuerzan juntos al chunk "api".
          const norm = id.replace(/\\/g, '/');
          if (norm.includes('/src/api/')) return 'api';
          if (!id.includes('node_modules')) return undefined;
          // DataGrid es pesado y solo lo usan algunas páginas: que siga
          // repartido con sus chunks de ruta.
          if (id.includes('@mui/x-data-grid')) return undefined;
          if (id.includes('@mui') || id.includes('@emotion')) return 'vendor-mui';
          if (id.includes('@tanstack')) return 'vendor-router';
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return 'vendor-react';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
