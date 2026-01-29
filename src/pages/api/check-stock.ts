import type { APIRoute } from 'astro';
import { getProductByUuid } from '@/lib/database';
import { getBindProductById } from '@/lib/bind';
import { getCategoryVariants } from '@/lib/filter-category-service';

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

    let stock = product.stock || 0;
    let stockSource = 'database';

    // Si hay un bind_code (del producto o pasado como parámetro), intentar obtener stock desde Bind ERP
    const codeToCheck = bindCode || product.bind_code || product.bind_id;
    
    if (codeToCheck && codeToCheck.trim()) {
      try {
        // Detectar si es un UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(codeToCheck.trim());
        
        if (isUUID) {
          // Buscar por ID directamente
          const bindResult = await getBindProductById(codeToCheck.trim());
          if (bindResult.success && bindResult.data) {
            const bindData = bindResult.data as any;
            const bindStock = bindData.CurrentInventory || bindData.currentInventory || bindData.Inventory || 0;
            if (bindStock !== undefined && bindStock !== null) {
              stock = bindStock;
              stockSource = 'bind_erp';
            }
          }
        } else {
          // Buscar en variantes de categoría que puedan tener este bind_code
          if (product.filter_category_id) {
            const variants = await getCategoryVariants(product.filter_category_id);
            const matchingVariant = variants.find(v => 
              v.bind_code && v.bind_code.trim().toLowerCase() === codeToCheck.trim().toLowerCase()
            );
            
            if (matchingVariant && matchingVariant.bind_code) {
              // Intentar obtener stock desde Bind usando el código
              try {
                const bindSearchResponse = await fetch(
                  `${request.url.split('/api')[0]}/api/bind/search-by-code?code=${encodeURIComponent(matchingVariant.bind_code.trim())}`
                );
                if (bindSearchResponse.ok) {
                  const bindSearchData = await bindSearchResponse.json();
                  if (bindSearchData.success && bindSearchData.data?.inventory !== undefined) {
                    stock = bindSearchData.data.inventory;
                    stockSource = 'bind_erp';
                  }
                }
              } catch (error) {
                console.warn('No se pudo obtener stock desde Bind para código:', codeToCheck);
              }
            }
          }
        }
      } catch (error) {
        console.warn('Error obteniendo stock desde Bind ERP, usando stock de base de datos:', error);
        // Continuar con stock de base de datos si falla
      }
    }

    const available = stock >= requestedQuantity;

    return new Response(JSON.stringify({
      available,
      stock: stock,
      requested: requestedQuantity,
      canAddToCart: stock > 0 && available,
      stockSource
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
