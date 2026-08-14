/**
 * Tamaño recomendado de imagen para cada zona del sitio.
 *
 * Los números no son de catálogo: salen de medir en el sitio real a cuánto se
 * muestra cada imagen (en escritorio y en móvil) y pedir el doble, que es lo
 * que necesita una pantalla de alta densidad para verse nítida. Subir menos se
 * ve pixelado; subir mucho más solo hace la página más lenta.
 *
 * Si cambia el diseño de alguna sección, hay que volver a medir y actualizar
 * aquí: es el único lugar donde vive esta información.
 */
export interface GuiaImagen {
  /** Medida sugerida, en píxeles */
  medidas: string;
  /** Cómo se recorta o encaja en la página */
  forma: string;
  /** Advertencia concreta, cuando la hay */
  nota?: string;
}

export const GUIA_IMAGENES = {
  producto: {
    medidas: '1200 × 1200 px',
    forma: 'Cuadrada',
    nota:
      'Se recorta a un cuadrado y se muestra hasta a 584 px. Deja el filtro centrado y con algo de aire alrededor.',
  },
  categoria: {
    medidas: '1200 × 1200 px',
    forma: 'Cuadrada',
    nota:
      'Es la foto que representa a toda la familia. Se recorta a un cuadrado tanto en la tienda como en la página de la categoría.',
  },
  blog: {
    medidas: '1200 × 800 px',
    forma: 'Horizontal (3:2)',
    nota:
      'Se recorta a un rectángulo horizontal en el listado del blog. Evita poner texto cerca de los bordes.',
  },
  casoPortada: {
    medidas: '1600 × 1000 px',
    forma: 'Horizontal',
    nota:
      'Dentro del caso se ve completa, sin recortar. En el listado se recorta a un rectángulo ancho, así que lo importante debe quedar al centro. Las fotos verticales funcionan, pero se ven más chicas.',
  },
  casoGaleria: {
    medidas: '1200 × 1200 px',
    forma: 'Cuadrada',
    nota:
      'Las miniaturas son cuadradas y, al hacer clic, la foto se abre a pantalla completa.',
  },
  portafolio: {
    medidas: '1200 × 750 px',
    forma: 'Horizontal (16:10)',
    nota: 'Se recorta a un rectángulo horizontal en la galería de la página principal.',
  },
  testimonioLogo: {
    medidas: '400 × 400 px',
    forma: 'PNG con fondo transparente',
    nota: 'El logo se muestra completo y pequeño; el fondo transparente evita el recuadro blanco.',
  },
  testimonioProyecto: {
    medidas: '1200 × 600 px',
    forma: 'Horizontal (2:1)',
    nota: 'Se recorta a una franja horizontal arriba de la tarjeta del testimonio.',
  },
  perfil: {
    medidas: '400 × 400 px',
    forma: 'Cuadrada',
    nota: 'Se muestra en un círculo pequeño: funciona mejor un retrato de frente.',
  },
} as const satisfies Record<string, GuiaImagen>;

export type ZonaImagen = keyof typeof GUIA_IMAGENES;
