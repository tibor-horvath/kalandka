import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Public origin for the Open Graph tags in index.html, e.g. SITE_URL=https://www.kalandka.hu.
  // Crawlers want absolute URLs; without it the tags fall back to root-relative paths.
  const siteUrl = (loadEnv(mode, '.', 'SITE_URL').SITE_URL ?? '').replace(/\/+$/, '');

  return {
    plugins: [
      react(),
      {
        name: 'site-url',
        transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl)
      },
      VitePWA({
        // A new version waits until the child is back on the home screen (src/lib/update.ts registers it).
        registerType: 'prompt',
        injectRegister: false,
        // PNG icons, favicon and <head> links are generated from public/icon.svg (see pwa-assets.config.ts).
        pwaAssets: { config: true },
        manifest: {
          id: '/',
          name: 'Kalandka',
          short_name: 'Kalandka',
          description: 'Számolós és logikai játékok 5–7 éveseknek.',
          lang: 'hu',
          // The installed app opens on the game; / is the landing page (src/App.tsx). The id stays '/', so existing installs keep their identity.
          start_url: '/jatek',
          display: 'fullscreen',
          // Phones and tablets work either way up (an upright tablet gets the portrait layout, see components/Stage.tsx).
          orientation: 'any',
          background_color: '#DDF0FA',
          theme_color: '#FFC93C',
          categories: ['education', 'games', 'kids']
        },
        // Precache the whole app on first visit, so later launches load nothing from the server
        // (offline or not) and an update downloads only the files whose content changed.
        workbox: {
          // Audio and images are listed ahead of use, so recordings or pictures added later work offline too.
          // Plain .woff fonts are left out: every browser that runs the app picks the .woff2.
          globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2,mp3,m4a,ogg}'],
          // The link-preview image is only fetched by crawlers, never by the app.
          globIgnores: ['og.png']
        }
      })
    ],
    test: {
      environment: 'node'
    }
  };
});
