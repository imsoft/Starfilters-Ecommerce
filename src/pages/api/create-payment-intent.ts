import type { APIRoute } from 'astro';
import { cotizarEnvio, armarPaqueteDesdeBD, pakkeConfigurado } from '@/lib/pakke';
import { createCheckoutPaymentIntent, validateCheckoutData, type CheckoutData, type BillingData, type DiscountData, type DeliveryMethod, type ResolvedCartItem } from '@/lib/payment-utils';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { getProductByUuid, getProductPrimaryImage } from '@/lib/database';
import { getBindProductById } from '@/lib/bind';
import { getProductVariants } from '@/lib/filter-category-service';
import { validateDiscountCode } from '@/lib/discount-codes';
import { getExchangeRate } from '@/lib/currency-service';

// Métodos de entrega que ofrece el checkout. Cualquier otro valor del body
// se rechaza: el costo de envío se calcula en el servidor a partir de esto.
const ALLOWED_SHIPPING_METHODS: DeliveryMethod[] = [
  'pickup-gdl', 'pickup-cdmx', 'metro-gdl', 'metro-cdmx', 'paqueteria',
];

const isUUID = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());

// Datos de facturación: opcionales y sin validación bloqueante. Solo se
// recortan y limitan de largo; si no viene nada útil se guarda null.
const sanitizeBilling = (raw: any): BillingData | null => {
  if (!raw || typeof raw !== 'object') return null;
  const clean = (value: any, max = 200) =>
    typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;
  const billing: BillingData = {
    businessName: clean(raw.businessName),
    rfc: clean(raw.rfc, 13)?.toUpperCase(),
    taxRegime: clean(raw.taxRegime),
    cfdiUse: clean(raw.cfdiUse),
    postalCode: clean(raw.postalCode, 10),
    email: clean(raw.email),
  };
  return Object.values(billing).some(Boolean) ? billing : null;
};

// Resuelve stock real y el ProductID de BIND para un código dado.
// Lee de BIND ERP si es posible; si BIND falla, cae al stock de BD sin romper.
async function resolveStockAndBindTarget(
  fallbackStock: number,
  codeToCheck: string | null | undefined,
  productName: string
): Promise<{ stock: number | null; bindTarget: string | null }> {
  // `null` significa "BIND no dio dato". Se distingue de 0 a propósito: el
  // stock local nunca se sincroniza y siempre es 0, así que usarlo como
  // respaldo rechazaba el pago ("Stock insuficiente") de productos que sí
  // hay, mientras que /api/check-stock los dejaba entrar al carrito. Aquí se
  // aplica el mismo criterio: sin dato de BIND, no se bloquea.
  let stock: number | null = fallbackStock > 0 ? fallbackStock : null;
  let bindTarget: string | null = null;

  if (!codeToCheck || !codeToCheck.trim()) {
    console.log(`📦 Sin código BIND para ${productName}; stock local ${fallbackStock}`);
    return { stock, bindTarget };
  }

  const code = codeToCheck.trim();
  try {
    if (isUUID(code)) {
      bindTarget = code;
      const bindResult = await getBindProductById(code);
      if (bindResult.success && bindResult.data) {
        const bindData = bindResult.data as any;
        const bindStock = bindData.CurrentInventory ?? bindData.currentInventory ?? bindData.Inventory;
        if (bindStock !== undefined && bindStock !== null) {
          stock = bindStock;
          console.log(`📦 Stock desde Bind ERP (UUID): ${stock} para producto ${productName}`);
        }
      }
    } else {
      // Buscar en Bind por código para obtener stock y el ProductID real
      const { getBindProducts } = await import('@/lib/bind');
      const bindProductsResult = await getBindProducts({ page: 1, pageSize: 1000 });

      if (bindProductsResult.success && bindProductsResult.data) {
        // BIND devuelve los campos capitalizados (Code, SKU, ID, Inventory).
        // Comparar solo contra p.code/p.sku/p.id nunca encontraba el producto:
        // el stock caía al local (siempre 0) y el pago se rechazaba por
        // "Stock insuficiente", además de dejar bindTarget nulo, con lo que la
        // venta tampoco descontaba inventario en BIND.
        const buscado = code.toUpperCase();
        const igual = (valor: unknown) => String(valor ?? '').trim().toUpperCase() === buscado;
        const bindProduct = bindProductsResult.data.find(
          (p: any) => igual(p.Code ?? p.code) || igual(p.SKU ?? p.sku) || igual(p.ID ?? p.id)
        ) as any;

        if (bindProduct) {
          bindTarget = bindProduct.ID ?? bindProduct.id ?? null;
          let bindStock = Number(bindProduct.Inventory ?? bindProduct.inventory ?? 0) || 0;

          if (bindTarget && (!bindStock || bindStock === 0)) {
            const productDetails = await getBindProductById(bindTarget);
            if (productDetails.success && productDetails.data) {
              const bindData = productDetails.data as any;
              bindStock = bindData.CurrentInventory ?? bindData.currentInventory ?? bindData.Inventory ?? bindStock ?? 0;
            }
          }

          if (bindStock !== undefined && bindStock !== null) {
            stock = bindStock;
            console.log(`📦 Stock desde Bind ERP (código): ${stock} para código ${code}`);
          }
        }
      }
    }
  } catch (bindError) {
    console.warn('⚠️ Error obteniendo stock desde Bind ERP, usando stock de base de datos:', bindError);
  }

  return { stock, bindTarget };
}

// El idioma del comprador: lo manda el checkout o, en su defecto, se lee de la
// URL desde la que se envió el formulario (/en/checkout → inglés).
const idiomaDeLaCompra = (desdeBody: unknown, referer: string | null): 'es' | 'en' => {
  if (desdeBody === 'en' || desdeBody === 'es') return desdeBody;
  if (referer) {
    try {
      const ruta = new URL(referer).pathname;
      if (ruta === '/en' || ruta.startsWith('/en/')) return 'en';
    } catch {
      // Un referer ilegible no es motivo para fallar: se queda en español.
    }
  }
  return 'es';
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verificar autenticación
    const user = getAuthenticatedUser(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener datos del request
    const body = await request.json();
    const checkoutData: CheckoutData = {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      address: body.address,
      city: body.city,
      state: body.state,
      postalCode: body.postalCode,
      country: body.country,
      phone: body.phone,
      company: body.company,
      apartment: body.apartment,
      billing: sanitizeBilling(body.billing),
      // De qué versión del sitio vino la compra, para escribirle al cliente en
      // ese idioma. Se prefiere lo que mande el checkout; si no, se deduce de
      // la página desde la que se envió. Si nada llega, español.
      lang: idiomaDeLaCompra(body.lang, request.headers.get('referer')),
    };

    // Moneda del cobro: la manda el checkout según su idioma (español MXN,
    // inglés USD). Solo se aceptan esas dos; cualquier otra cosa cae a pesos.
    const chargeCurrency: 'MXN' | 'USD' =
      String(body.currency || '').toUpperCase() === 'USD' ? 'USD' : 'MXN';

    // Solo se aceptan los métodos de entrega que ofrece la UI; el costo se
    // calcula en el servidor.
    const shippingMethodFromBody = (body.shippingMethod || 'paqueteria') as DeliveryMethod;
    if (!ALLOWED_SHIPPING_METHODS.includes(shippingMethodFromBody)) {
      return new Response(JSON.stringify({
        error: 'Datos inválidos',
        details: ['Método de entrega no válido']
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Recogida en sucursal: el formulario de dirección se oculta a propósito
    // en el checkout, así que llega vacío. Se completa con la dirección de la
    // sucursal para que la validación pase y el pedido quede con datos útiles.
    // (Antes esto respondía "Datos inválidos" y bloqueaba todo pago con recogida.)
    if (shippingMethodFromBody === 'pickup-gdl' || shippingMethodFromBody === 'pickup-cdmx') {
      const isGdl = shippingMethodFromBody === 'pickup-gdl';
      checkoutData.address = checkoutData.address?.trim()
        || (isGdl
          ? 'Recoger en sucursal: Cto. San Eduardo 88-Int. 4, San Juan de Ocotán'
          : 'Recoger en sucursal: Ventura G.Tena 250, Asturias, Cuauhtémoc');
      checkoutData.city = checkoutData.city?.trim() || (isGdl ? 'Zapopan' : 'Ciudad de México');
      checkoutData.state = checkoutData.state?.trim() || (isGdl ? 'Jalisco' : 'CDMX');
      checkoutData.postalCode = checkoutData.postalCode?.trim() || (isGdl ? '45019' : '06890');
      checkoutData.country = checkoutData.country?.trim() || 'México';
    }

    // Validar datos
    const validation = validateCheckoutData(checkoutData);
    if (!validation.isValid) {
      return new Response(JSON.stringify({
        error: 'Datos inválidos',
        details: validation.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener carrito del body (enviado desde el cliente)
    const cartItems = body.items || [];

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return new Response(JSON.stringify({
        error: 'El carrito está vacío'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Resolver cada item en el servidor: precio y nombre desde la BD (el
    // precio del cliente no se usa para cobrar), stock desde BIND/BD, y el
    // ProductID de BIND que el webhook usará para descontar inventario.
    const resolvedItems: ResolvedCartItem[] = [];
    try {
      for (const item of cartItems) {
        if (!item.uuid) {
          return new Response(JSON.stringify({
            error: 'Datos inválidos',
            details: ['Item del carrito sin UUID']
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const quantity = parseInt(item.quantity, 10);
        if (!Number.isFinite(quantity) || quantity <= 0) {
          return new Response(JSON.stringify({
            error: 'Datos inválidos',
            details: [`Cantidad inválida para ${item.name || item.uuid}`]
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        console.log(`🔍 Validando stock para producto: ${item.name || item.uuid}`);
        const product = await getProductByUuid(item.uuid);
        if (!product) {
          return new Response(JSON.stringify({
            error: 'Producto no encontrado',
            details: [`El producto ${item.name || item.uuid} no existe`]
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Datos autoritativos del servidor (pueden reemplazarse por la variante)
        let unitPrice = Number(product.price) || 0;
        let currency: 'MXN' | 'USD' = (product as any).currency === 'USD' ? 'USD' : 'MXN';
        let variantId: number | null = null;
        let codeToCheck: string | null = null;
        let fallbackStock = Number(product.stock) || 0;

        // Producto al que pertenece la medida cuando el item es una variante.
        let parentProductId: number | null = null;

        // Nombre con el que va a la orden y al correo. Para una medida se arma
        // con el producto al que pertenece, no con la categoría.
        let nombreParaOrden: string | null = null;

        if (item.uuid.startsWith('variant-')) {
          // El item ES una variante: getProductByUuid ya devolvió sus datos
          variantId = product.id;
          codeToCheck = (product as any).bind_code || null;
          parentProductId = Number((product as any).product_id) || null;

          // Una medida heredada de la categoría (product_id NULL) no sabe de
          // qué producto es. La ficha manda parent_uuid: el producto desde el
          // que se eligió. Se acepta solo si es de la misma categoría, para
          // que nadie cuele un nombre ajeno.
          if (!parentProductId && typeof item.parent_uuid === 'string' && item.parent_uuid && !item.parent_uuid.startsWith('variant-')) {
            const padre = await getProductByUuid(item.parent_uuid);
            if (padre && Number((padre as any).filter_category_id) === Number((product as any).filter_category_id)) {
              parentProductId = padre.id;
              nombreParaOrden = `${padre.name} - ${(product as any).nominal_size || ''}`.trim().replace(/ - $/, '');
            }
          }
        } else if (item.size && (product as any).filter_category_id) {
          // Producto base con tamaño elegido: buscar la variante que coincide
          try {
            const variants = await getProductVariants(product.id, (product as any).filter_category_id);
            // La etiqueta que manda el carrito es la del desplegable: "nominal /
            // real", o solo "nominal" cuando las dos son iguales o la real está
            // vacía. Se compara con la misma regla, sin distinguir mayúsculas.
            const limpiar = (t: unknown) => String(t ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
            const etiquetaDe = (n: unknown, r: unknown) => {
              const nn = limpiar(n), rr = limpiar(r);
              return nn && rr && nn !== rr ? `${nn} / ${rr}` : nn || rr;
            };
            const buscada = limpiar(item.size);
            const matchingVariant = variants.find(v =>
              v.is_active && etiquetaDe(v.nominal_size, v.real_size) === buscada
            );
            if (matchingVariant) {
              variantId = matchingVariant.id;
              codeToCheck = matchingVariant.bind_code || null;
              fallbackStock = Number(matchingVariant.stock) || 0;
              if (matchingVariant.price) {
                unitPrice = Number(matchingVariant.price);
                currency = (matchingVariant as any).currency === 'USD' ? 'USD' : 'MXN';
              }
              console.log(`🔍 Variante ${matchingVariant.id} (bind_code ${codeToCheck || 'N/A'}) para tamaño ${item.size}`);
            }
          } catch (error) {
            console.warn('⚠️ Error buscando variante por tamaño, usando datos del producto:', error);
          }
        }

        if (!codeToCheck) {
          codeToCheck = (product as any).bind_code || (product as any).bind_id || null;
        }

        const { stock: actualStock, bindTarget } = await resolveStockAndBindTarget(
          fallbackStock,
          codeToCheck,
          product.name
        );
        console.log(`✅ Stock obtenido: ${actualStock ?? 'sin dato'} para producto ${product.name}`);

        if (actualStock === null) {
          console.warn(`⚠️ Sin inventario de BIND para "${product.name}"; se permite el cobro (mismo criterio que check-stock).`);
        }

        if (actualStock !== null && actualStock < quantity) {
          return new Response(JSON.stringify({
            error: 'Stock insuficiente',
            // Sin cifras de inventario: el mensaje llega hasta la pantalla del
            // cliente y no queremos publicar cuántas piezas hay.
            details: [`No tenemos inventario suficiente de "${item.name || product.name}" para la cantidad solicitada. Contáctanos y con gusto te ayudamos.`]
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (unitPrice <= 0) {
          return new Response(JSON.stringify({
            error: 'Producto sin precio',
            details: [`El producto ${product.name} no tiene precio configurado`]
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Imagen para la orden/correo (mejor esfuerzo)
        let imageUrl: string | null = null;
        try {
          // Para una variante, la foto es la del producto al que pertenece.
          const idParaImagen = item.uuid.startsWith('variant-') ? parentProductId : product.id;
          if (idParaImagen) {
            const primaryImage = await getProductPrimaryImage(idParaImagen);
            imageUrl = primaryImage?.image_url || null;
          }
        } catch {
          imageUrl = null;
        }
        if (!imageUrl) imageUrl = (product as any).image_url || null;

        resolvedItems.push({
          // Para variantes, el producto real: así el descuento por producto,
          // la orden y la cotización del envío apuntan al producto y no a la
          // fila de la medida.
          product_id: parentProductId ?? product.id,
          parent_product_id: parentProductId,
          uuid: item.uuid,
          name: nombreParaOrden ?? product.name,
          quantity,
          price: unitPrice,
          currency,
          image_url: imageUrl || undefined,
          size: item.size || undefined,
          variant_id: variantId,
          bind_target: bindTarget,
          // El código con el que se identifica la pieza: el de la medida
          // elegida o, si no, el del producto.
          bind_code: codeToCheck || null,
        } as ResolvedCartItem);
      }
    } catch (stockError) {
      console.error('❌ Error validando stock:', stockError);
      // Si falla la validación de stock, retornar error específico
      return new Response(JSON.stringify({
        error: 'Error al validar stock',
        details: [stockError instanceof Error ? stockError.message : 'Error desconocido al validar stock']
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Re-validar el código de descuento en el servidor: el monto que manda
    // el cliente no se usa (podría venir manipulado).
    let discountData: DiscountData | undefined;
    if (body.discountCode?.code) {
      const hasUSDItems = resolvedItems.some(i => i.currency === 'USD');
      const exchangeRate = hasUSDItems ? await getExchangeRate() : undefined;
      const subtotalMXN = resolvedItems.reduce((sum, i) => {
        const priceMXN = i.currency === 'USD' && exchangeRate ? i.price * exchangeRate : i.price;
        return sum + priceMXN * i.quantity;
      }, 0);

      const discountValidation = await validateDiscountCode(
        body.discountCode.code,
        subtotalMXN,
        resolvedItems.map(i => ({ product_id: i.product_id, uuid: i.uuid }))
      );

      if (!discountValidation.valid || !discountValidation.discountCode) {
        return new Response(JSON.stringify({
          error: 'Código de descuento inválido',
          details: [discountValidation.message]
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Los códigos se definen en pesos y el importe se calcula sobre el
      // subtotal en pesos. Si el cobro es en dólares hay que convertirlo:
      // antes se restaban $500 MXN como si fueran $500 USD.
      let montoDescuento = discountValidation.discountAmount || 0;
      if (chargeCurrency === 'USD') {
        const tasa = exchangeRate ?? (await getExchangeRate());
        montoDescuento = tasa ? Math.round((montoDescuento / tasa) * 100) / 100 : montoDescuento;
      }

      discountData = {
        code: discountValidation.discountCode.code,
        discountCodeId: discountValidation.discountCode.id,
        amount: montoDescuento,
      };
    }

    // Crear Payment Intent
    console.log('💳 Creando Payment Intent con Stripe...');
    console.log('📋 Datos del checkout:', {
      email: checkoutData.email,
      shippingMethod: shippingMethodFromBody,
      userId: user.id,
      itemsCount: resolvedItems.length,
      hasDiscount: !!discountData
    });

    // Envío por paquetería: el servidor vuelve a cotizar con Pakke en vez de
    // creerle el precio al navegador. Si se tomara el del cliente, cualquiera
    // podría pedir el envío en cero; y si se usara la tarifa fija de $350, se
    // cobraría algo distinto de lo que el comprador vio y aceptó.
    let shippingOverrideMXN: number | null = null;
    if (shippingMethodFromBody === 'paqueteria' && pakkeConfigurado()) {
      try {
        const { paquete } = await armarPaqueteDesdeBD(
          resolvedItems.map((item: any) => ({
            uuid: item.uuid,
            cantidad: Number(item.quantity) || 1,
          }))
        );
        const opciones = await cotizarEnvio(String(checkoutData.postalCode || ''), paquete);
        if (opciones.length > 0) {
          // Sin servicio elegido se toma la más barata, que es la que el
          // checkout preselecciona.
          const elegido = opciones.find((o) => o.serviceId === body.shippingServiceId) || opciones[0];
          shippingOverrideMXN = elegido.subtotal;
        }
      } catch (error: any) {
        console.error('⚠️ No se pudo recotizar el envío al cobrar:', error?.message);
      }

      // Si el comprador eligió una paquetería y aquí no se pudo confirmar el
      // precio, se detiene el cobro. Antes se caía a la tarifa fija de $350,
      // que podía ser mayor que la que el comprador vio y aceptó.
      if (shippingOverrideMXN === null && body.shippingServiceId) {
        return new Response(
          JSON.stringify({
            error: 'No pudimos confirmar el costo de envío. Vuelve a intentarlo en un momento.',
            code: 'shipping_quote_unavailable',
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    let result;
    try {
      result = await createCheckoutPaymentIntent(
        checkoutData,
        shippingMethodFromBody,
        user.id,
        discountData,
        resolvedItems,
        chargeCurrency,
        shippingOverrideMXN
      );

      console.log('✅ Payment Intent creado exitosamente:', {
        payment_intent_id: result.payment_intent_id,
        order_total: result.order_total,
        hasClientSecret: !!result.client_secret
      });
    } catch (paymentError) {
      console.error('❌ Error en createCheckoutPaymentIntent:', paymentError);
      if (paymentError instanceof Error) {
        console.error('Error message:', paymentError.message);
        console.error('Error stack:', paymentError.stack);
      }
      // Re-lanzar el error para que sea capturado por el catch general
      throw paymentError;
    }

    if (!result) {
      throw new Error('No se recibió respuesta de createCheckoutPaymentIntent');
    }

    if (!result.client_secret) {
      throw new Error('No se recibió client_secret del Payment Intent');
    }

    return new Response(JSON.stringify({
      client_secret: result.client_secret,
      payment_intent_id: result.payment_intent_id,
      order_total: result.order_total,
      // El checkout la necesita para mostrar el total en la misma moneda que
      // se va a cobrar, sin volver a calcularla por su cuenta
      currency: result.currency,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error creating payment intent:', error);

    // Log detallado del error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error name:', error.name);
    } else {
      console.error('Error object:', JSON.stringify(error, null, 2));
    }

    // Retornar mensaje de error más descriptivo
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const isDevelopment = import.meta.env.DEV;

    // Determinar el tipo de error para dar un mensaje más específico
    let userFriendlyMessage = 'Error interno del servidor';
    if (error instanceof Error) {
      if (error.message.includes('Stripe')) {
        userFriendlyMessage = 'Error al procesar el pago con Stripe. Verifica tu configuración.';
      } else if (error.message.includes('stock') || error.message.includes('Stock')) {
        userFriendlyMessage = error.message;
      } else if (error.message.includes('carrito') || error.message.includes('vacío')) {
        userFriendlyMessage = error.message;
      } else if (error.message.includes('No autorizado')) {
        userFriendlyMessage = 'Debes iniciar sesión para realizar una compra';
      }
    }

    return new Response(JSON.stringify({
      error: userFriendlyMessage,
      ...(isDevelopment && {
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        fullError: error instanceof Error ? {
          name: error.name,
          message: error.message
        } : error
      })
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
