// @ts-check

import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://starfilters.com', // Actualiza con tu dominio real
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),

  vite: {
      plugins: [tailwindcss()],
	},

  integrations: [react()],
});