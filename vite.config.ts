import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: {
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL || 'https://jglveforpqhioxpambbq.supabase.co'),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_usAlnI8l2JjcgwOIiWbgRw_ZUKVJ2C3'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    build: {
      rollupOptions: {
        output: {
          chunkFileNames: (chunkInfo) => {
            let name = chunkInfo.name || '';
            if (name.includes('Error')) {
              name = name.replace(/Error/g, 'Err');
            }
            return `assets/${name}-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            let name = assetInfo.name || '';
            if (name.includes('Error')) {
              name = name.replace(/Error/g, 'Err');
            }
            return `assets/${name}-[hash].[ext]`;
          }
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
