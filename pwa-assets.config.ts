import { defineConfig } from '@vite-pwa/assets-generator/config';

// PNG icons rendered from public/icon.svg at build time.
// The SVG is already a full rounded tile, so "any" icons need no padding;
// maskable and Apple icons get the tile colour behind them so masked corners stay yellow.
const tile = { background: '#FFC93C', fit: 'contain' } as const;

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    transparent: { sizes: [64, 192, 512], favicons: [[48, 'favicon.ico']], padding: 0 },
    // Maskable safe zone is the inner 80% circle; 20% padding keeps the K and its sparkle inside it.
    maskable: { sizes: [512], padding: 0.2, resizeOptions: tile },
    apple: { sizes: [180], padding: 0, resizeOptions: tile }
  },
  images: ['public/icon.svg']
});
