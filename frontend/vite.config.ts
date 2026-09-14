/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Inventaire',
        short_name: 'Inventaire',
        description: "Inventaire hors ligne pour la maison de vacances",
        theme_color: '#1e293b',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell + assets only — /sync and /auth must never be cached,
        // the offline guarantee comes from IndexedDB, not a stale API response.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  server: {
    // Leading-dot entries match any subdomain, so this survives ngrok handing
    // out a new random subdomain on each free-tier tunnel restart.
    allowedHosts: ['.ngrok-free.dev'],
    // Forward API calls to the backend server-side, so a single ngrok tunnel
    // to the frontend is enough — the browser only ever sees one origin, and
    // ngrok's free tier only allows one tunnel at a time anyway.
    proxy: {
      '/auth': 'http://localhost:8000',
      '/sync': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    },
  },
})
