/**
 * Cómo se ve y cómo avanza el estado de un pedido, en un solo lugar.
 *
 * Cada pantalla tenía su propia copia: la lista decía "En Proceso" y el detalle
 * "En preparación" para el mismo estado, y los colores del badge estaban
 * escritos dos veces. Aquí viven una sola vez para que no vuelvan a separarse.
 *
 * Este módulo NO toca base de datos ni correo a propósito: lo importan páginas
 * del panel, y cargar el resto arrastraría la conexión a MySQL sin necesidad.
 */

export type EstadoPedido = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface EstadoInfo {
  /** Cómo se le llama al estado en toda la interfaz. */
  etiqueta: string;
  /** Clases del chip, las mismas que ya usaba el panel. */
  badge: string;
  /** Qué significa, para explicarlo sin que el admin adivine. */
  significa: string;
}

export const ESTADOS: Record<EstadoPedido, EstadoInfo> = {
  pending: {
    etiqueta: 'Pendiente',
    badge: 'bg-yellow-100 text-yellow-800',
    significa: 'Se cobró y nadie lo ha tomado todavía.',
  },
  processing: {
    etiqueta: 'En preparación',
    badge: 'bg-blue-100 text-blue-800',
    significa: 'Se está surtiendo del almacén.',
  },
  shipped: {
    etiqueta: 'Enviado',
    badge: 'bg-purple-100 text-purple-800',
    significa: 'Salió a entrega o está listo para recoger.',
  },
  delivered: {
    etiqueta: 'Entregado',
    badge: 'bg-green-100 text-green-800',
    significa: 'El cliente ya lo recibió. Pedido cerrado.',
  },
  cancelled: {
    etiqueta: 'Cancelado',
    badge: 'bg-red-100 text-red-800',
    significa: 'El pedido no se va a entregar.',
  },
};

export const esEstadoPedido = (valor: unknown): valor is EstadoPedido =>
  typeof valor === 'string' && valor in ESTADOS;

export const infoEstado = (estado: string): EstadoInfo =>
  esEstadoPedido(estado)
    ? ESTADOS[estado]
    : { etiqueta: estado, badge: 'bg-gray-100 text-gray-800', significa: '' };

/** Orden en el que avanza un pedido. "cancelled" queda fuera: es una salida. */
export const FLUJO: EstadoPedido[] = ['pending', 'processing', 'shipped', 'delivered'];

export interface SiguientePaso {
  estado: EstadoPedido;
  /** El verbo del botón: dice qué va a pasar, no cómo se llama el estado. */
  boton: string;
  /** Título de la tarjeta en el detalle. */
  titulo: string;
  /** Una línea sobre a quién se le avisa y de qué. */
  explicacion: string;
}

/**
 * Qué sigue después del estado actual.
 *
 * `esRecoger` cambia el vocabulario: un pedido que el cliente recoge no se
 * "envía", queda listo en sucursal. `necesitaGuia` marca los que no se pueden
 * despachar desde la lista porque falta capturar la paquetería.
 */
export const siguientePaso = (
  estado: string,
  opciones: { esRecoger?: boolean; necesitaGuia?: boolean } = {}
): SiguientePaso | null => {
  const { esRecoger = false, necesitaGuia = false } = opciones;

  switch (estado) {
    case 'pending':
      return {
        estado: 'processing',
        boton: 'Empezar a preparar',
        titulo: 'Marcar en preparación',
        explicacion: 'Avisa al cliente y al equipo que ya se está surtiendo el pedido.',
      };
    case 'processing':
      return {
        estado: 'shipped',
        boton: esRecoger ? 'Marcar listo' : 'Confirmar envío',
        titulo: esRecoger ? 'Marcar como listo para recoger' : 'Marcar como enviado',
        explicacion: esRecoger
          ? 'Avisa al cliente que ya puede pasar por su pedido a la sucursal.'
          : necesitaGuia
            ? 'El aviso al cliente lleva la paquetería y el número de guía.'
            : 'Avisa al cliente que su pedido va en camino.',
      };
    case 'shipped':
      return {
        estado: 'delivered',
        boton: 'Marcar como entregado',
        titulo: 'Cerrar el pedido',
        explicacion: 'Cierra el pedido y confirma que el cliente ya lo recibió.',
      };
    default:
      // Entregado y cancelado no avanzan.
      return null;
  }
};

/**
 * ¿Este pedido necesita que se capture una guía antes de darlo por enviado?
 * Solo la paquetería nacional: el reparto propio y las recolecciones no tienen
 * número que anotar.
 */
export const necesitaGuia = (metodoEntrega?: string | null): boolean =>
  metodoEntrega === 'paqueteria';
