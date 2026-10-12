import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Kalandka – Számkertész',
        short_name: 'Kalandka',
        description: 'Számolós és logikai játékok 5–7 éveseknek.',
        lang: 'hu',
        start_url: '/',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#DDF0FA',
        theme_color: '#FFC93C',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}']
      }
    })
  ],
  test: {
    environment: 'node'
  }
});
