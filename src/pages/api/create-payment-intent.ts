import type { APIRoute } from 'astro';
import { createCheckoutPaymentIntent, validateCheckoutData, type CheckoutData, type DiscountData } from '@/lib/payment-utils';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { getCart } from '@/lib/cart';
import { getProductByUuid } from '@/lib/database';
import { getBindProductById } from '@/lib/bind';
import { getCategoryVariants } from '@/lib/filter-category-service';

// Función helper para obtener stock real desde Bind ERP o base de datos
async function getProductStock(product: any, itemSize?: string, bindCode?: string): Promise<number> {
  let stock = product.stock || 0;
  
  try {
    // Si hay un bind_code pasado como parámetro, usarlo directamente
    let codeToCheck = bindCode;
    
    // Si no hay bind_code pero hay un tamaño seleccionado, buscar en variantes de categoría
    if (!codeToCheck && itemSize && product.filter_category_id) {
      try {
        const variants = await getCategoryVariants(product.filter_category_id);
        // El tamaño viene en formato "nominal / real"
        const sizeParts = itemSize.split(' / ');
        const nominalSize = sizeParts[0]?.trim() || '';
        const realSize = sizeParts[1]?.trim() || '';
        
        // Buscar variante que coincida con el tamaño
        const matchingVariant = variants.find(v => 
          v.nominal_size?.trim() === nominalSize && 
          v.real_size?.trim() === realSize &&
          v.is_active
        );
        
        if (matchingVariant?.bind_code) {
          codeToCheck = matchingVariant.bind_code;
          console.log(`🔍 Encontrado bind_code ${codeToCheck} para tamaño ${itemSize}`);
        }
      } catch (error) {
        console.warn('⚠️ Error buscando variante por tamaño, usando stock de BD:', error);
        // Continuar con stock de BD si falla
      }
    }
    
    // Si aún no hay código, usar el del producto
    if (!codeToCheck) {
      codeToCheck = product.bind_code || product.bind_id;
    }
    
    // Si hay un código, intentar obtener stock desde Bind ERP
    if (codeToCheck && codeToCheck.trim()) {
      try {
        // Detectar si es un UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(codeToCheck.trim());
        
        if (isUUID) {
          // Buscar por ID directamente en Bind ERP
          const bindResult = await getBindProductById(codeToCheck.trim());
          if (bindResult.success && bindResult.data) {
            const bindData = bindResult.data as any;
            const bindStock = bindData.CurrentInventory || bindData.currentInventory || bindData.Inventory || 0;
            if (bindStock !== undefined && bindStock !== null) {
              stock = bindStock;
              console.log(`📦 Stock desde Bind ERP (UUID): ${stock} para producto ${product.name}`);
              return stock;
            }
          }
        } else {
          // Buscar en Bind usando el código
          const { getBindProducts } = await import('@/lib/bind');
          const bindProductsResult = await getBindProducts({ page: 1, pageSize: 1000 });
          
          if (bindProductsResult.success && bindProductsResult.data) {
            const bindProduct = bindProductsResult.data.find(
              (p: any) => p.code?.toUpperCase() === codeToCheck.toUpperCase() || 
                         p.sku?.toUpperCase() === codeToCheck.toUpperCase() ||
                         p.id?.toUpperCase() === codeToCheck.toUpperCase()
            );
            
            if (bindProduct) {
              let bindStock = bindProduct.inventory || bindProduct.Inventory || 0;
              
              // Si no tenemos inventario, intentar obtener detalles completos
              if (bindProduct.id && (!bindStock || bindStock === 0)) {
                const productDetails = await getBindProductById(bindProduct.id);
                if (productDetails.success && productDetails.data) {
                  const bindData = productDetails.data as any;
                  bindStock = bindData.CurrentInventory || bindData.currentInventory || bindData.Inventory || bindStock || 0;
                }
              }
              
              if (bindStock !== undefined && bindStock !== null) {
                stock = bindStock;
                console.log(`📦 Stock desde Bind ERP (código): ${stock} para código ${codeToCheck}`);
                return stock;
              }
            }
          }
        }
      } catch (bindError) {
        console.warn('⚠️ Error obteniendo stock desde Bind ERP, usando stock de base de datos:', bindError);
        // Continuar con stock de base de datos si falla - NO lanzar error
      }
    }
  } catch (error) {
    console.error('❌ Error crítico en getProductStock:', error);
    // En caso de error crítico, retornar stock de BD en lugar de lanzar error
    // Esto evita que falle todo el checkout si hay un problema con Bind
  }
  
  console.log(`📦 Stock desde base de datos: ${stock} para producto ${product.name}`);
  return stock;
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

    // Recogida en sucursal: el formulario de dirección se oculta a propósito
    // en el checkout, así que llega vacío. Se completa con la dirección de la
    // sucursal para que la validación pase y el pedido quede con datos útiles.
    // (Antes esto respondía "Datos inválidos" y bloqueaba todo pago con recogida.)
    const shippingMethodFromBody = body.shippingMethod || 'standard';
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

    // Validar stock antes de crear el Payment Intent (consultando Bind ERP si hay bind_code)
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
        
        // Obtener stock real desde Bind ERP o base de datos
        // Si el item tiene un size, buscar el bind_code correspondiente en las variantes
        console.log(`📦 Obteniendo stock para producto ${product.name}, tamaño: ${item.size || 'N/A'}, bind_code: ${item.bind_code || 'N/A'}`);
        const actualStock = await getProductStock(product, item.size, item.bind_code);
        console.log(`✅ Stock obtenido: ${actualStock} para producto ${product.name}`);
        
        if (actualStock < item.quantity) {
          return new Response(JSON.stringify({ 
            error: 'Stock insuficiente',
            details: [`No hay suficiente stock para ${item.name || product.name}. Disponible: ${actualStock}, Solicitado: ${item.quantity}`]
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
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

    // Obtener datos de descuento si existen
    const discountData: DiscountData | undefined = body.discountCode ? {
      code: body.discountCode.code,
      discountCodeId: body.discountCode.discountCodeId,
      amount: body.discountCode.amount,
    } : undefined;

    // Crear Payment Intent
    console.log('💳 Creando Payment Intent con Stripe...');
    console.log('📋 Datos del checkout:', {
      email: checkoutData.email,
      shippingMethod: body.shippingMethod || 'standard',
      userId: user.id,
      itemsCount: cartItems.length,
      hasDiscount: !!discountData
    });
    
    let result;
    try {
      result = await createCheckoutPaymentIntent(
        checkoutData,
        body.shippingMethod || 'standard',
        user.id,
        discountData,
        cartItems // Pasar items del carrito
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
