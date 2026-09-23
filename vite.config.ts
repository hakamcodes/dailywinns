import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          // Precache all built assets (JS, CSS, fonts, logo)
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff2}'],
            // Cache Firebase SDK and app shell with stale-while-revalidate
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } }
              },
              {
                // Firebase Auth & Firestore API calls — network first, fall back to cache
                urlPattern: /^https:\/\/.*\.googleapis\.com\/.*/i,
                handler: 'NetworkFirst',
                options: { cacheName: 'firebase-api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 } }
              }
            ],
            // Skip waiting so new SW activates immediately on update
            skipWaiting: true,
            clientsClaim: true,
          },
          manifest: {
            name: 'Daily Wins',
            short_name: 'Daily Wins',
            description: 'Your all-in-one life operating system. Track habits, study, sleep and earn life score points.',
            theme_color: '#4f46e5',
            background_color: '#fefcfb',
            display: 'standalone',
            orientation: 'portrait',
            start_url: '/',
            icons: [
              { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
              { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
            ],
          },
          // Inject SW registration into index.html automatically
          injectRegister: 'auto',
          devOptions: {
            // Enable SW in dev so you can test offline behaviour locally
            enabled: false,
          }
        })
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
