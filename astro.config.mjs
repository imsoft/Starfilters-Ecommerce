// @ts-check

import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  // Dominio canónico con www: el apex redirige en el proxy. Lo usan el
  // sitemap, las URLs canónicas y los datos estructurados.
  site: 'https://www.starfilters.mx',

  // URLs del sitio anterior de starfilters.mx (PHP) → sus equivalentes.
  // Al mover el dominio, los enlaces que Google y otros sitios ya tenían
  // dejan de dar 404 y pasan su valor a la página nueva.
  redirects: {
    '/products': { status: 301, destination: '/productos' },
    '/about': { status: 301, destination: '/acerca-de' },
    '/cleanroom': { status: 301, destination: '/cuartos-limpios' },
    '/articulo1': { status: 301, destination: '/productos?category=air-shower' },
    '/politica_calidad': { status: 301, destination: '/acerca-de' },
    '/terms_cond': { status: 301, destination: '/terms' },
    '/index': { status: 301, destination: '/' },
  },
  output: 'server',
  adapter: node({
    mode: 'middleware'
  }),

  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false
    }
  },

  vite: {
      plugins: [tailwindcss()],
	},

  integrations: [react()],

  security: {
    checkOrigin: false,
  },
});