import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';

// GitHub Pages serves the app at https://<user>.github.io/bonewake/
// so the base path needs the repo name in production. Locally we serve from /.
const isProd = process.env.NODE_ENV === 'production' || process.env.VITE_BUILD_TARGET === 'pages';
const base = isProd ? '/bonewake/' : '/';

function safeExec(cmd: string, fallback = ''): string {
  try { return execSync(cmd).toString().trim(); } catch { return fallback; }
}
const APP_VERSION = safeExec('git rev-parse --short HEAD', 'dev');
const APP_COMMIT_MSG = safeExec('git log -1 --pretty=%s', 'Local build');

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __APP_COMMIT_MSG__: JSON.stringify(APP_COMMIT_MSG),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'sprites/**/*', 'audio/**/*'],
      workbox: {
        // Bigger limit so the heavy sprite atlases (some >1MB) can be cached
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,mp3,wav,ttf,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bonewake-images',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\.(?:mp3|wav|ogg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bonewake-audio',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      manifest: {
        name: 'BoneWake',
        short_name: 'BoneWake',
        description: 'A dark-fantasy pixel-art auto-battler RPG. Offline-first, single-player.',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        scope: base,
        start_url: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
});
