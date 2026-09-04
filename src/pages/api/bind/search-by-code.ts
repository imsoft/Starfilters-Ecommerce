import type { APIRoute } from 'astro';
import { requireAdminApi } from '@/lib/auth-utils';
import { getBindProducts, getBindProductById, getBindInventoryByCode } from '@/lib/bind';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies }) => {
  // Devuelve existencias de BIND. Solo lo usa la tabla de tamaños del panel,
  // y el cliente no quiere publicar cuántas piezas hay: sin sesión de
  // administrador, no responde.
  const noAutorizado = await requireAdminApi(cookies);
  if (noAutorizado) return noAutorizado;

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
    
    // Atajo: el mapa código → inventario ya está cacheado (5 min) y contempla
    // las distintas grafías de los campos. Antes se comparaba p.code en
    // minúscula mientras BIND devuelve "Code", así que no encontraba nada y el
    // admin mostraba N/A en la columna Stock.
    const mapaInventario = await getBindInventoryByCode();
    const inventarioDelMapa = mapaInventario?.get(code.trim().toUpperCase());

    // Buscar en todos los productos de Bind por código o SKU
    const result = await getBindProducts({ page: 1, pageSize: 5000 });

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
    const buscado = code.trim().toUpperCase();
    const igual = (valor: unknown) => String(valor ?? '').trim().toUpperCase() === buscado;
    product = (result.data as any[]).find(
      (p) => igual(p.Code ?? p.code) || igual(p.SKU ?? p.sku) || igual(p.ID ?? p.id)
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
    const price = product.Price ?? product.price ?? 0;
    
    // Obtener inventario: primero intentar desde el producto encontrado, luego desde detalles completos
    inventory = inventarioDelMapa ?? (product.Inventory ?? product.inventory ?? 0);
    
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
          code: product.Code || product.code || product.SKU || product.sku || code,
          nominalSize,
          realSize,
          price,
          inventory: inventory || 0,
          // Información adicional del producto
          title: product.Title || product.title,
          description: product.Descripcion || product.description,
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

