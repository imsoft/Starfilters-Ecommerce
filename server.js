/**
 * Server para Hostinger
 * Este archivo inicia el servidor Node.js para Astro SSR
 * 
 * Usa Express con el handler de Astro en modo middleware
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { handler as ssrHandler } from './dist/server/entry.mjs';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

// Servir archivos estáticos
app.use(express.static(join(__dirname, 'dist/client')));

// SSR handler de Astro
app.use(ssrHandler);

// 404 del sitio.
//
// Montado como middleware, Astro llama a next() cuando ninguna ruta coincide, y
// Express respondía con su error crudo "Cannot GET /...". El proyecto tiene su
// propia 404.astro; aquí se renderiza esa, forzando el código 404 para que
// buscadores y clientes no la lean como una página válida.
app.use((req, res, next) => {
  req.url = '/404';
  const writeHeadOriginal = res.writeHead.bind(res);
  res.writeHead = (_status, ...resto) => writeHeadOriginal(404, ...resto);
  res.statusCode = 404;
  ssrHandler(req, res, next);
});

// Iniciar servidor
app.listen(PORT, HOSTNAME, () => {
  console.log(`🚀 Server running on http://${HOSTNAME}:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'production'}`);
});

