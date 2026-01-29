import type { APIRoute } from 'astro';
import { getBindProducts, getBindProductById } from '@/lib/bind';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Código es requerido',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Detectar si el código es un UUID (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code.trim());
    
    let product: any = null;
    let inventory = 0;
    
    // Si es un UUID, intentar buscar directamente por ID
    if (isUUID) {
      console.log('🔍 Buscando producto por UUID:', code);
      try {
        const productDetails = await getBindProductById(code.trim());
        if (productDetails.success && productDetails.data) {
          const bindData = productDetails.data as any;
          product = bindData;
          // El endpoint /api/Products/{id} devuelve CurrentInventory según la documentación
          inventory = bindData.CurrentInventory || bindData.currentInventory || bindData.Inventory || 0;
          
          // Extraer información relevante
          const customFields = bindData.customFields || {};
          const nominalSize = customFields.nominalSize || customFields.nominal_size || customFields.medida_nominal || '';
          const realSize = customFields.realSize || customFields.real_size || customFields.medida_real || '';
          const price = bindData.Price || bindData.price || bindData.Cost || bindData.cost || 0;
          
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                code: bindData.Code || bindData.code || bindData.SKU || bindData.sku || code,
                nominalSize,
                realSize,
                price,
                inventory: inventory || 0,
                title: bindData.Title || bindData.title || '',
                description: bindData.Description || bindData.description || '',
                customFields: customFields,
              },
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (error) {
        console.warn('No se encontró producto por UUID, intentando búsqueda por código:', error);
        // Continuar con la búsqueda por código si falla
      }
    }
    
    // Buscar en todos los productos de Bind por código o SKU
    const result = await getBindProducts({ page: 1, pageSize: 1000 });

    if (!result.success || !result.data) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al buscar en Bind API',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Buscar el producto por código o SKU
    product = result.data.find(
      (p) => p.code?.toUpperCase() === code.toUpperCase() || 
             p.sku?.toUpperCase() === code.toUpperCase() ||
             p.id?.toUpperCase() === code.toUpperCase()
    );

    if (!product) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Producto no encontrado',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Extraer información relevante
    // Los campos customFields pueden contener medidas nominales y reales
    const customFields = product.customFields || {};
    
    // Intentar obtener medidas desde customFields o usar valores por defecto
    const nominalSize = customFields.nominalSize || customFields.nominal_size || customFields.medida_nominal || '';
    const realSize = customFields.realSize || customFields.real_size || customFields.medida_real || '';
    const price = product.price || 0;
    
    // Obtener inventario: primero intentar desde el producto encontrado, luego desde detalles completos
    inventory = product.inventory || product.Inventory || 0;
    
    // Si el producto tiene un ID y no tenemos inventario, obtener detalles completos
    if (product.id && (!inventory || inventory === 0)) {
      try {
        const productDetails = await getBindProductById(product.id);
        if (productDetails.success && productDetails.data) {
          // El endpoint /api/Products/{id} devuelve CurrentInventory según la documentación
          const bindData = productDetails.data as any;
          inventory = bindData.CurrentInventory || bindData.currentInventory || bindData.Inventory || inventory || 0;
        }
      } catch (error) {
        console.warn('No se pudo obtener inventario detallado de Bind:', error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          code: product.code || product.sku || code,
          nominalSize,
          realSize,
          price,
          inventory: inventory || 0,
          // Información adicional del producto
          title: product.title,
          description: product.description,
          customFields: product.customFields,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error al buscar producto en Bind:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

