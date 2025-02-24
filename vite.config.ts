import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import wasm from 'vite-plugin-wasm'
import removeConsole from 'vite-plugin-remove-console';
//@ts-ignore
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), wasm(),removeConsole(), crossOriginIsolation()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
})
