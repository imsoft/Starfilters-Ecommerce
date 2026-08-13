import type { APIRoute } from 'astro';
import { getProductByUuid } from '@/lib/database';
import { getBindProductById, getBindInventoryByCode } from '@/lib/bind';
import { getProductVariants } from '@/lib/filter-category-service';

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const uuid = url.searchParams.get('uuid');
    const bindCode = url.searchParams.get('bind_code'); // Opcional: bind_code específico
    const requestedQuantity = parseInt(url.searchParams.get('quantity') || '1');

    if (!uuid) {
      return new Response(JSON.stringify({
        error: 'UUID de producto requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const product = await getProductByUuid(uuid);

    if (!product) {
      return new Response(JSON.stringify({
        error: 'Producto no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Código a consultar: el que venga en la petición (el tamaño elegido), el
    // del producto o —si no hay— el de alguno de sus tamaños.
    let codigo = (bindCode || product.bind_code || product.bind_id || '').trim();
    if (!codigo && product.filter_category_id) {
      try {
        const variantes = await getProductVariants(product.id, product.filter_category_id);
        codigo = (variantes.find((v) => v.is_active && v.bind_code)?.bind_code || '').trim();
      } catch (error) {
        console.warn('⚠️ No se pudieron leer los tamaños para resolver el código BIND:', error);
      }
    }

    // Inventario de BIND, consultado en proceso. Antes esta ruta se hacía una
    // petición HTTP a sí misma (/api/bind/search-by-code) armando el origen con
    // request.url: detrás del proxy ese origen no siempre es alcanzable desde
    // el propio servidor, la llamada fallaba y el producto quedaba en el stock
    // local —que nunca se sincroniza y siempre es 0—, así que la ficha decía
    // "disponible" y el botón respondía "agotado".
    let stock: number | null = null;
    if (codigo) {
      try {
        const mapa = await getBindInventoryByCode();
        const enMapa = mapa?.get(codigo.toUpperCase());
        if (enMapa !== undefined) {
          stock = enMapa;
        } else if (ES_UUID.test(codigo)) {
          const bindResult = await getBindProductById(codigo);
          if (bindResult.success && bindResult.data) {
            const bindData = bindResult.data as any;
            const inv = bindData.CurrentInventory ?? bindData.currentInventory ?? bindData.Inventory;
            if (inv !== undefined && inv !== null) stock = Number(inv) || 0;
          }
        }
      } catch (error) {
        console.warn('Error obteniendo stock desde BIND para', codigo, error);
      }
    }

    // Sin dato de BIND no se bloquea la venta: el stock local no se sincroniza
    // (siempre 0), así que usarlo como "agotado" impedía comprar productos que
    // sí hay. El cobro vuelve a validar existencias antes de cargar la tarjeta.
    const hayDatoReal = stock !== null;
    if (!hayDatoReal) {
      console.warn(
        `⚠️ Sin inventario de BIND para "${product.name}" (código: ${codigo || 'ninguno'}); se permite agregar y se validará al pagar.`
      );
    }

    const existencias = hayDatoReal ? (stock as number) : requestedQuantity;
    const available = existencias >= requestedQuantity;

    // El cliente no quiere publicar cuántas piezas hay: la respuesta solo dice
    // si alcanza o no, y si está agotado. La cantidad exacta (y de dónde salió)
    // se queda en el servidor, donde se sigue validando el pago.
    return new Response(JSON.stringify({
      available,
      outOfStock: hayDatoReal && existencias === 0,
      requested: requestedQuantity,
      canAddToCart: available
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error checking stock:', error);
    return new Response(JSON.stringify({
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
