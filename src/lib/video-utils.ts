/**
 * Utilidades para manejar videos del Hero (YouTube vs archivo directo).
 */

/**
 * Extrae el ID de un video de YouTube a partir de distintos formatos de URL:
 *  - https://youtu.be/ID
 *  - https://www.youtube.com/watch?v=ID
 *  - https://www.youtube.com/embed/ID
 *  - https://www.youtube.com/shorts/ID
 *  - ID directo (11 caracteres)
 *
 * Devuelve el ID (sin parámetros como ?si=...) o null si no es de YouTube.
 */
export function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const value = url.trim();

  // Si ya es un ID directo (11 caracteres válidos, sin "/" ni ".")
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;

  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/** Indica si la URL corresponde a un video de YouTube. */
export function isYouTubeUrl(url: string | null | undefined): boolean {
  return getYouTubeId(url) !== null;
}

/** URL del thumbnail de un video de YouTube (para vistas previas). */
export function getYouTubeThumbnail(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Mejor miniatura disponible del video, resuelta en el servidor.
 *
 * YouTube solo genera `maxresdefault.jpg` si el video se subió en alta
 * resolución; para los demás responde 404. Pedirla desde el navegador y caer
 * al respaldo funciona, pero deja un 404 en cada carga y un parpadeo mientras
 * se cambia la imagen. Aquí se comprueba una vez del lado del servidor y se
 * recuerda el resultado, así el navegador recibe directo una URL que existe.
 *
 * Si la comprobación falla (sin red, YouTube lento), se devuelve `hqdefault`,
 * que YouTube genera siempre.
 */
const miniaturasResueltas = new Map<string, string>();

export async function getBestYouTubeThumbnail(id: string): Promise<string> {
  if (!id) return '';
  const cacheada = miniaturasResueltas.get(id);
  if (cacheada) return cacheada;

  const maxres = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  const hq = getYouTubeThumbnail(id);

  let elegida = hq;
  try {
    const control = new AbortController();
    const timeout = setTimeout(() => control.abort(), 3000);
    const res = await fetch(maxres, { method: 'HEAD', signal: control.signal });
    clearTimeout(timeout);
    if (res.ok) elegida = maxres;
  } catch {
    // Se queda con hqdefault: existe siempre.
  }

  miniaturasResueltas.set(id, elegida);
  return elegida;
}

/** Indica si la URL es un video servido por Cloudinary. */
export function isCloudinaryVideo(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('res.cloudinary.com') && url.includes('/video/upload/');
}

/**
 * Devuelve la URL del video optimizada por Cloudinary (calidad automática) para
 * que cargue más rápido como fondo. Si no es de Cloudinary, la devuelve tal cual.
 */
export function getOptimizedHeroVideo(url: string | null | undefined): string {
  if (!url) return '';
  if (!isCloudinaryVideo(url)) return url;
  // Evitar duplicar la transformación si ya la tiene.
  if (url.includes('/video/upload/q_auto')) return url;
  return url.replace('/video/upload/', '/video/upload/q_auto/');
}

/**
 * Genera un poster (primer fotograma) del propio video de Cloudinary, para que
 * mientras carga se vea una imagen del video y no una genérica.
 * Si no es de Cloudinary, devuelve el `fallback`.
 */
export function getHeroVideoPoster(url: string | null | undefined, fallback: string): string {
  if (!url || !isCloudinaryVideo(url)) return fallback;
  let poster = url.replace('/video/upload/', '/video/upload/so_0/');
  poster = poster.replace(/\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i, '.jpg');
  if (!/\.jpg($|\?)/i.test(poster)) poster += '.jpg';
  return poster;
}
