import type { APIRoute } from 'astro';
import { createCheckoutPaymentIntent, validateCheckoutData, type CheckoutData, type DiscountData, type DeliveryMethod, type ResolvedCartItem } from '@/lib/payment-utils';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { getProductByUuid, getProductPrimaryImage } from '@/lib/database';
import { getBindProductById } from '@/lib/bind';
import { getCategoryVariants } from '@/lib/filter-category-service';
import { validateDiscountCode } from '@/lib/discount-codes';
import { getExchangeRate } from '@/lib/currency-service';

// Métodos de entrega que ofrece el checkout. Cualquier otro valor del body
// se rechaza: el costo de envío se calcula en el servidor a partir de esto.
const ALLOWED_SHIPPING_METHODS: DeliveryMethod[] = [
  'pickup-gdl', 'pickup-cdmx', 'metro-gdl', 'metro-cdmx', 'paqueteria',
];

const isUUID = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());

// Resuelve stock real y el ProductID de BIND para un código dado.
// Lee de BIND ERP si es posible; si BIND falla, cae al stock de BD sin romper.
async function resolveStockAndBindTarget(
  fallbackStock: number,
  codeToCheck: string | null | undefined,
  productName: string
): Promise<{ stock: number; bindTarget: string | null }> {
  let stock = fallbackStock || 0;
  let bindTarget: string | null = null;

  if (!codeToCheck || !codeToCheck.trim()) {
    console.log(`📦 Stock desde base de datos: ${stock} para producto ${productName}`);
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
        const bindProduct = bindProductsResult.data.find(
          (p: any) => p.code?.toUpperCase() === code.toUpperCase() ||
                     p.sku?.toUpperCase() === code.toUpperCase() ||
                     p.id?.toUpperCase() === code.toUpperCase()
        );

        if (bindProduct) {
          bindTarget = bindProduct.id || null;
          let bindStock = bindProduct.inventory || (bindProduct as any).Inventory || 0;

          if (bindProduct.id && (!bindStock || bindStock === 0)) {
            const productDetails = await getBindProductById(bindProduct.id);
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
    };

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

        if (item.uuid.startsWith('variant-')) {
          // El item ES una variante: getProductByUuid ya devolvió sus datos
          variantId = product.id;
          codeToCheck = (product as any).bind_code || null;
        } else if (item.size && (product as any).filter_category_id) {
          // Producto base con tamaño elegido: buscar la variante que coincide
          try {
            const variants = await getCategoryVariants((product as any).filter_category_id);
            const sizeParts = String(item.size).split(' / ');
            const nominalSize = sizeParts[0]?.trim() || '';
            const realSize = sizeParts[1]?.trim() || '';
            const matchingVariant = variants.find(v =>
              v.nominal_size?.trim() === nominalSize &&
              v.real_size?.trim() === realSize &&
              v.is_active
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
        console.log(`✅ Stock obtenido: ${actualStock} para producto ${product.name}`);

        if (actualStock < quantity) {
          return new Response(JSON.stringify({
            error: 'Stock insuficiente',
            details: [`No hay suficiente stock para ${item.name || product.name}. Disponible: ${actualStock}, Solicitado: ${quantity}`]
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
        let imageUrl: string | null = (product as any).image_url || null;
        if (!imageUrl && !item.uuid.startsWith('variant-')) {
          try {
            const primaryImage = await getProductPrimaryImage(product.id);
            imageUrl = primaryImage?.image_url || null;
          } catch {
            imageUrl = null;
          }
        }

        resolvedItems.push({
          product_id: product.id,
          uuid: item.uuid,
          name: product.name,
          quantity,
          price: unitPrice,
          currency,
          image_url: imageUrl || undefined,
          size: item.size || undefined,
          variant_id: variantId,
          bind_target: bindTarget,
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

      discountData = {
        code: discountValidation.discountCode.code,
        discountCodeId: discountValidation.discountCode.id,
        amount: discountValidation.discountAmount || 0,
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

    let result;
    try {
      result = await createCheckoutPaymentIntent(
        checkoutData,
        shippingMethodFromBody,
        user.id,
        discountData,
        resolvedItems
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
