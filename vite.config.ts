import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // A new version waits until the child is back on the home screen (src/lib/update.ts registers it).
      registerType: 'prompt',
      injectRegister: false,
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
      // Precache the whole app on first visit, so later launches load nothing from the server
      // (offline or not) and an update downloads only the files whose content changed.
      workbox: {
        // Audio and images are listed ahead of use, so recordings or pictures added later work offline too.
        // Plain .woff fonts are left out: every browser that runs the app picks the .woff2.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2,mp3,m4a,ogg}']
      }
    })
  ],
  test: {
    environment: 'node'
  }
});
