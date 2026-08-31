import type { APIRoute } from 'astro';
import { getProductByUuid } from '@/lib/database';
import { getBindProductById, getBindInventoryByCode } from '@/lib/bind';
import { getProductVariants } from '@/lib/filter-category-service';
import { existenciaSegunBind, normalizarCodigosBind } from '@/lib/stock';

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

    // Códigos a consultar.
    //
    // Si la petición trae un tamaño concreto se mira SOLO ese, que es el que se
    // va a comprar. Si no —el botón del listado no manda tamaño—, se miran
    // TODOS los códigos del producto y se suman, igual que hace la tarjeta del
    // listado. Antes aquí se tomaba un único código y bastaba con que ese
    // estuviera en cero para responder "agotado" sobre un producto que la
    // misma página anunciaba como disponible.
    let codigos: string[] = [];
    if (bindCode) {
      codigos = normalizarCodigosBind([bindCode]);
    } else {
      const deTamanos: string[] = [];
      if (product.filter_category_id) {
        try {
          const variantes = await getProductVariants(product.id, product.filter_category_id);
          deTamanos.push(
            ...variantes.filter((v) => v.is_active && v.bind_code).map((v) => v.bind_code as string)
          );
        } catch (error) {
          console.warn('⚠️ No se pudieron leer los tamaños para resolver los códigos BIND:', error);
        }
      }
      codigos = normalizarCodigosBind([product.bind_code, product.bind_id, ...deTamanos]);
    }

    const codigo = codigos[0] || '';

    // Inventario de BIND, consultado en proceso. Antes esta ruta se hacía una
    // petición HTTP a sí misma (/api/bind/search-by-code) armando el origen con
    // request.url: detrás del proxy ese origen no siempre es alcanzable desde
    // el propio servidor, la llamada fallaba y el producto quedaba en el stock
    // local —que nunca se sincroniza y siempre es 0—, así que la ficha decía
    // "disponible" y el botón respondía "agotado".
    let stock: number | null = null;
    if (codigos.length > 0) {
      try {
        const mapa = await getBindInventoryByCode();
        const sumaBind = existenciaSegunBind(mapa, codigos);
        if (sumaBind !== null) {
          stock = sumaBind;
        } else if (ES_UUID.test(codigo)) {
          const bindResult = await getBindProductById(codigo);
          if (bindResult.success && bindResult.data) {
            const bindData = bindResult.data as any;
            const inv = bindData.CurrentInventory ?? bindData.currentInventory ?? bindData.Inventory;
            if (inv !== undefined && inv !== null) stock = Number(inv) || 0;
          }
        }
      } catch (error) {
        console.warn('Error obteniendo stock desde BIND para', codigos.join(', '), error);
      }
    }

    // Sin dato de BIND no se bloquea la venta: el stock local no se sincroniza
    // (siempre 0), así que usarlo como "agotado" impedía comprar productos que
    // sí hay. El cobro vuelve a validar existencias antes de cargar la tarjeta.
    const hayDatoReal = stock !== null;
    if (!hayDatoReal) {
      console.warn(
        `⚠️ Sin inventario de BIND para "${product.name}" (códigos: ${codigos.join(', ') || 'ninguno'}); se permite agregar y se validará al pagar.`
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
