import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  base: '/sandworm/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          renderer: ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
});
