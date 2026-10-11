import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => {
  const isDevServer = command === 'serve';
  return {
    // AI Studio previews the app from `/`, while GitHub Pages serves it from the repository path.
    base: isDevServer ? '/' : '/relevamiento-gasv-V1/',
    plugins: [
      {
        name: 'spa-html-entry',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const rawUrl = req.url?.split('?')[0] || '';
            if (
              rawUrl === '/' ||
              rawUrl === '/relevamiento-gasv-V1' ||
              rawUrl === '/relevamiento-gasv-V1/' ||
              rawUrl === '/relevamiento-gasv-V1/index.html' ||
              rawUrl === '/index.html'
            ) {
              try {
                const template = fs.readFileSync(path.resolve(process.cwd(), 'index.vite.html'), 'utf-8');
                const targetUrl = isDevServer ? (req.url || '/') : (req.url || '/relevamiento-gasv-V1/');
                const html = await server.transformIndexHtml(targetUrl, template);
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                return res.end(html);
              } catch (e) {
                return next(e);
              }
            }
            next();
          });
        },
      },
      {
        name: 'copy-dist-index',
        closeBundle() {
          const distViteHtml = path.resolve(process.cwd(), 'dist/index.vite.html');
          const distHtml = path.resolve(process.cwd(), 'dist/index.html');
          if (fs.existsSync(distViteHtml)) {
            fs.copyFileSync(distViteHtml, distHtml);
          }
        },
      },
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'apple-touch-icon.png',
          'icon.svg',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'gasv-icon-right.png',
          'gasv-logo.png',
        ],
        manifest: {
          id: '/relevamiento-gasv-V1/',
          name: 'Relevamiento Arquitectónico',
          short_name: 'Relevamiento',
          description:
            'Herramienta técnica de levantamiento, diagnóstico, registro fotográfico y cuantificación de proyectos arquitectónicos.',
          theme_color: '#17365d',
          background_color: '#17365d',
          display: 'standalone',
          orientation: 'any',
          start_url: '/relevamiento-gasv-V1/',
          scope: '/relevamiento-gasv-V1/',
          icons: [
            {
              src: './gasv-icon-right.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        },
        devOptions: {
          // Avoid a development service worker caching the wrong base path in AI Studio previews.
          enabled: !isDevServer,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(process.cwd(), 'index.vite.html'),
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
