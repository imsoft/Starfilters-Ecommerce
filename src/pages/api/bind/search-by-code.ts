import type { APIRoute } from 'astro';
import { getBindProducts } from '@/lib/bind';

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
    // Buscar en todos los productos de Bind
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

    // Buscar el producto por código
    const product = result.data.find(
      (p) => p.code?.toUpperCase() === code.toUpperCase() || p.sku?.toUpperCase() === code.toUpperCase()
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

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          code: product.code || product.sku || code,
          nominalSize,
          realSize,
          price,
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

