/**
 * Server para Hostinger
 * Este archivo inicia el servidor Node.js para Astro SSR
 * 
 * El adapter de Astro Node en modo 'standalone' exporta un handler
 * que ya maneja todo (archivos estáticos y SSR)
 */

import { handler } from './dist/server/entry.mjs';

const PORT = process.env.PORT || 8080;
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

// El handler de Astro Node adapter maneja todo automáticamente
const server = await handler({
  port: PORT,
  hostname: HOSTNAME,
});

console.log(`🚀 Server running on http://${HOSTNAME}:${PORT}`);
console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);

