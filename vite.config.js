import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const BACKEND_HOST = '34.227.74.50';
const BACKEND_PORT = 8082;
const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

export default defineConfig(() => ({
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: 'all',

    proxy: {
      '/api/socket': {
        target: `ws://${BACKEND_HOST}:${BACKEND_PORT}`,
        ws: true,
        changeOrigin: true,
        secure: false,

        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            console.error(
              '[VITE PROXY SOCKET ERROR]',
              req?.method,
              req?.url,
              err.message
            );
          });
        },
      },

      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,

        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            console.error(
              '[VITE PROXY ERROR]',
              req?.method,
              req?.url,
              'TARGET:',
              BACKEND_URL,
              'ERROR:',
              err.message
            );
          });

          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(
              '[VITE PROXY]',
              req.method,
              req.url,
              '→',
              `${BACKEND_URL}${req.url}`
            );
          });

          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(
              '[VITE PROXY RESPONSE]',
              proxyRes.statusCode,
              req.method,
              req.url
            );
          });
        },
      },
    },
  },

  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 1100,
  },

  plugins: [
    svgr(),

    react(),

    VitePWA({
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon-180x180.png',
      ],

      workbox: {
        navigateFallbackDenylist: [/^\/api/],
        globPatterns: ['**/*.{js,css,html,woff,woff2,mp3}'],
      },

      manifest: {
        short_name: 'Traclink GPS Portal',
        name: 'Traclink GPS Portal',
        theme_color: '#00a79d',

        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),

    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@mapbox/mapbox-gl-rtl-text/dist/mapbox-gl-rtl-text.js',
          dest: '',
        },
      ],
    }),
  ],
}));