/**
 * Paqueterías y sus páginas de rastreo.
 *
 * El correo de "pedido enviado" mostraba el número de guía a secas: el cliente
 * veía "Número de rastreo: 125" sin saber con qué paquetería iba ni dónde
 * consultarlo.
 *
 * La paquetería la escribe a mano el admin al marcar el pedido como enviado,
 * así que el valor puede venir de cualquier forma ("FedEx", "fedex", "FEDEX
 * Express"). Aquí se normaliza y, si se reconoce, se arma el enlace de rastreo.
 *
 * IMPORTANTE: si una paquetería NO se reconoce, se muestra su nombre tal como
 * se capturó y SIN enlace. Es preferible a mandar al cliente a una página rota.
 *
 * Estas URLs no se pudieron comprobar de forma automática —las paqueterías
 * bloquean las peticiones de robots—, así que conviene validar cada una con una
 * guía real. Corregir alguna es cambiar una sola línea de este archivo.
 */

export interface PaqueteriaResuelta {
  /** Nombre para mostrar, ya con su escritura correcta. */
  nombre: string;
  /** Página de rastreo con la guía, o null si no se conoce. */
  url: string | null;
}

interface EntradaCatalogo {
  /** Cómo puede haberla escrito el admin, ya normalizado. */
  claves: string[];
  nombre: string;
  url?: (guia: string) => string;
}

const CATALOGO: EntradaCatalogo[] = [
  {
    claves: ['fedex', 'fedexexpress', 'fedexground'],
    nombre: 'FedEx',
    url: (g) => `https://www.fedex.com/fedextrack/?trknbr=${g}`,
  },
  {
    claves: ['ups'],
    nombre: 'UPS',
    url: (g) => `https://www.ups.com/track?tracknum=${g}`,
  },
  {
    claves: ['dhl', 'dhlexpress'],
    nombre: 'DHL',
    url: (g) => `https://www.dhl.com/mx-es/home/rastreo.html?tracking-id=${g}&submit=1`,
  },
  {
    claves: ['estafeta'],
    nombre: 'Estafeta',
    url: (g) => `https://rastreo3.estafeta.com/RastreoPublico/?wayBill=${g}`,
  },
  {
    claves: ['redpack'],
    nombre: 'Redpack',
    url: (g) => `https://www.redpack.com.mx/es/rastreo/?guias=${g}`,
  },
  {
    claves: ['paquetexpress', 'paqueteexpress'],
    nombre: 'Paquetexpress',
    url: (g) => `https://www.paquetexpress.com.mx/rastreo/?guia=${g}`,
  },
  {
    claves: ['99minutos', 'noventaynueveminutos'],
    nombre: '99 Minutos',
    url: (g) => `https://99minutos.com/rastreo?tracking=${g}`,
  },
  {
    claves: ['jtexpress', 'jyt', 'jt'],
    nombre: 'J&T Express',
    url: (g) => `https://www.jtexpress.mx/trajectoryQuery?waybillNo=${g}`,
  },
  {
    claves: ['tresguerras', '3guerras'],
    nombre: 'Tres Guerras',
  },
  {
    claves: ['sendex'],
    nombre: 'Sendex',
  },
];

/** Minúsculas, sin acentos y sin nada que no sea letra o número. */
const normalizar = (valor: string): string =>
  valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/**
 * Resuelve la paquetería capturada. Devuelve null si no se capturó ninguna.
 * Si se capturó pero no se reconoce, devuelve el nombre tal cual y url en null.
 */
export const resolverPaqueteria = (
  paqueteria?: string | null,
  guia?: string | null
): PaqueteriaResuelta | null => {
  const capturada = (paqueteria || '').trim();
  if (!capturada) return null;

  const clave = normalizar(capturada);
  // Coincide si la clave del catálogo aparece en lo capturado: así "FedEx
  // Express" o "Envío DHL" siguen reconociéndose.
  const entrada = CATALOGO.find((c) => c.claves.some((k) => clave.includes(k)));

  if (!entrada) return { nombre: capturada, url: null };

  const numero = (guia || '').trim();
  return {
    nombre: entrada.nombre,
    url: entrada.url && numero ? entrada.url(encodeURIComponent(numero)) : null,
  };
};
