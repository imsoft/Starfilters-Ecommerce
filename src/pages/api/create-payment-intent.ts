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
      console.warn('Error buscando variante por tamaño:', error);
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
    } catch (error) {
      console.warn('Error obteniendo stock desde Bind ERP, usando stock de base de datos:', error);
      // Continuar con stock de base de datos si falla
    }
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
      const actualStock = await getProductStock(product, item.size, item.bind_code);
      
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

    // Obtener datos de descuento si existen
    const discountData: DiscountData | undefined = body.discountCode ? {
      code: body.discountCode.code,
      discountCodeId: body.discountCode.discountCodeId,
      amount: body.discountCode.amount,
    } : undefined;

    // Crear Payment Intent
    const result = await createCheckoutPaymentIntent(
      checkoutData,
      body.shippingMethod || 'standard',
      user.id,
      discountData,
      cartItems // Pasar items del carrito
    );

    return new Response(JSON.stringify({
      client_secret: result.client_secret,
      payment_intent_id: result.payment_intent_id,
      order_total: result.order_total,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
