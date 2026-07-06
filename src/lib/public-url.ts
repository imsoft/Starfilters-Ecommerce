/**
 * Origen público del sitio para construir enlaces absolutos (correos de
 * verificación, reset de contraseña, etc.).
 *
 * En producción el sitio corre detrás de un proxy: Astro.url.origin resuelve
 * a http://localhost:4321 y los enlaces de los correos quedaban rotos.
 *
 * Orden de resolución:
 *   1. PUBLIC_SITE_URL del .env (configurar en el servidor, p. ej.
 *      https://srv1171123.hstgr.cloud; al migrar el dominio solo se cambia ahí)
 *   2. En desarrollo, el origin real de la petición (localhost:4321)
 *   3. El origin de la petición si no es localhost
 *   4. Cabeceras X-Forwarded-Host / X-Forwarded-Proto del proxy
 *   5. SITE_URL del .env como último recurso
 */
export function getPublicOrigin(request: Request): string {
  const clean = (u: string) => u.trim().replace(/\/+$/, '');

  const envUrl = import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL;
  if (envUrl) return clean(envUrl);

  const url = new URL(request.url);

  if (import.meta.env.DEV) return url.origin;

  const isLocal = /^(localhost|127\.|0\.0\.0\.0)/.test(url.hostname);
  if (!isLocal) return url.origin;

  const fwdHost = request.headers.get('x-forwarded-host');
  if (fwdHost) {
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    return `${proto}://${fwdHost.split(',')[0].trim()}`;
  }

  const siteUrl = import.meta.env.SITE_URL || process.env.SITE_URL;
  if (siteUrl) return clean(siteUrl);

  return url.origin;
}
