import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // PNG icons, favicon and <head> links are generated from public/icon.svg (see pwa-assets.config.ts).
      pwaAssets: { config: true },
      manifest: {
        id: '/',
        name: 'Kalandka – Számkertész',
        short_name: 'Kalandka',
        description: 'Számolós és logikai játékok 5–7 éveseknek.',
        lang: 'hu',
        start_url: '/',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#DDF0FA',
        theme_color: '#FFC93C',
        categories: ['education', 'games', 'kids']
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}']
      }
    })
  ],
  test: {
    environment: 'node'
  }
});
