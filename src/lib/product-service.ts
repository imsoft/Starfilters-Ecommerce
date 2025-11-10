/**
 * Servicio de Productos - Bind como fuente única
 *
 * Este servicio usa Bind ERP como la fuente única de verdad para productos.
 * MySQL se usa solo como cache opcional para mejorar rendimiento.
 */

import {
  getBindProducts,
  getAllBindProducts,
  getBindProductById,
  createBindProduct,
  updateBindProduct,
  deleteBindProduct,
  type BindProduct,
  type GetProductsOptions,
} from './bind';
import type { Product } from './database';
import { getFromCache, saveToCache, clearCacheKey } from './product-cache';

/**
 * Convertir producto de Bind a formato local
 */
export const bindProductToLocal = (bindProduct: any): Product => {
  // Bind API devuelve campos en PascalCase (ID, Title, Code, etc.)
  // El precio viene en Prices.Items[0].Price, no en Price directamente
  let price = 0;

  // Intentar obtener el precio del primer item en Prices.Items
  if (bindProduct.Prices?.Items && Array.isArray(bindProduct.Prices.Items) && bindProduct.Prices.Items.length > 0) {
    price = bindProduct.Prices.Items[0].Price || 0;
  } else if (bindProduct.Price) {
    price = bindProduct.Price;
  } else if (bindProduct.price) {
    price = bindProduct.price;
  }

  return {
    id: 0, // No se usa en Bind
    uuid: bindProduct.SKU || bindProduct.Code || bindProduct.sku || bindProduct.code || '',
    bind_id: bindProduct.ID || bindProduct.id || null,
    name: bindProduct.Title || bindProduct.title || '',
    name_en: bindProduct.customFields?.name_en || null,
    description: bindProduct.Description || bindProduct.description || '',
    description_en: bindProduct.customFields?.description_en || null,
    price: price,
    category: bindProduct.Category1 || bindProduct.Category || bindProduct.category || '',
    category_en: bindProduct.customFields?.category_en || null,
    stock: bindProduct.CurrentInventory || bindProduct.inventory || bindProduct.Inventory || 0,
    status: 'active', // Bind no tiene concepto de inactive, todos son activos
    tags: bindProduct.customFields?.tags || bindProduct.tags?.join(', ') || null,
    dimensions: bindProduct.customFields?.dimensions || null,
    weight: (bindProduct.Weight || bindProduct.weight)?.toString() || null,
    material: bindProduct.customFields?.material || null,
    warranty: bindProduct.customFields?.warranty || null,
    created_at: bindProduct.CreationDate ? new Date(bindProduct.CreationDate) : new Date(),
    updated_at: new Date(),
  };
};

/**
 * Convertir producto local a formato Bind
 */
export const localProductToBind = (product: Partial<Product>): BindProduct => {
  return {
    id: product.bind_id || undefined,
    title: product.name || '',
    description: product.description || '',
    price: product.price || 0,
    inventory: product.stock || 0,
    category: product.category || '',
    isActive: product.status === 'active',
    sku: product.uuid,
    tags: product.tags ? product.tags.split(',').map(t => t.trim()) : [],
    customFields: {
      name_en: product.name_en,
      description_en: product.description_en,
      category_en: product.category_en,
      dimensions: product.dimensions,
      weight: product.weight,
      material: product.material,
      warranty: product.warranty,
    },
  };
};

/**
 * Obtener todos los productos desde Bind (itera todas las páginas)
 * Usa caché para evitar llamadas repetidas a la API
 */
export const getAllProducts = async (options: Omit<GetProductsOptions, 'page' | 'pageSize'> = {}): Promise<Product[]> => {
  // Crear clave de caché basada en las opciones
  const cacheKey = `all-products-${JSON.stringify(options)}`;

  // Intentar obtener del caché primero
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  console.log('🔍 Obteniendo TODOS los productos desde Bind ERP...');

  // Usar getAllBindProducts que itera todas las páginas automáticamente
  const result = await getAllBindProducts({
    search: options.search,
    category: options.category,
    isActive: options.isActive,
  });

  if (!result.success || !result.data) {
    console.error('❌ Error obteniendo productos de Bind:', result.error);
    return [];
  }

  console.log(`✅ ${result.data.length} productos obtenidos de Bind`);

  // Convertir productos de Bind a formato local
  const convertedProducts = result.data.map(bindProductToLocal);

  console.log(`🎉 Total final: ${convertedProducts.length} productos convertidos`);

  // Guardar en caché
  saveToCache(cacheKey, convertedProducts);

  return convertedProducts;
};

/**
 * Obtener un producto por su Bind ID
 */
export const getProductByBindId = async (bindId: string): Promise<Product | null> => {
  console.log('🔍 Obteniendo producto desde Bind:', bindId);

  const result = await getBindProductById(bindId);

  if (!result.success || !result.data) {
    console.error('❌ Error obteniendo producto de Bind:', result.error);
    return null;
  }

  console.log('✅ Producto obtenido de Bind');
  return bindProductToLocal(result.data);
};

/**
 * Crear un nuevo producto en Bind
 */
export const createProduct = async (productData: Partial<Product>): Promise<string | null> => {
  console.log('✨ Creando producto en Bind ERP...');

  const bindProductData = localProductToBind(productData);
  const result = await createBindProduct(bindProductData);

  if (!result.success || !result.data?.id) {
    console.error('❌ Error creando producto en Bind:', result.error);
    return null;
  }

  console.log('✅ Producto creado en Bind:', result.data.id);

  // Invalidar caché al crear un producto
  clearCacheKey('all-products-{}');

  return result.data.id;
};

/**
 * Actualizar un producto en Bind
 */
export const updateProduct = async (bindId: string, productData: Partial<Product>): Promise<boolean> => {
  console.log('📝 Actualizando producto en Bind:', bindId);

  const bindProductData = localProductToBind(productData);
  const result = await updateBindProduct(bindId, bindProductData);

  if (!result.success) {
    console.error('❌ Error actualizando producto en Bind:', result.error);
    return false;
  }

  console.log('✅ Producto actualizado en Bind');

  // Invalidar caché al actualizar un producto
  clearCacheKey('all-products-{}');

  return true;
};

/**
 * Eliminar un producto de Bind
 */
export const deleteProduct = async (bindId: string): Promise<boolean> => {
  console.log('🗑️ Eliminando producto de Bind:', bindId);

  const result = await deleteBindProduct(bindId);

  if (!result.success) {
    console.error('❌ Error eliminando producto de Bind:', result.error);
    return false;
  }

  console.log('✅ Producto eliminado de Bind');

  // Invalidar caché al eliminar un producto
  clearCacheKey('all-products-{}');

  return true;
};

/**
 * Buscar productos por término de búsqueda
 */
export const searchProducts = async (searchTerm: string, category?: string): Promise<Product[]> => {
  return getAllProducts({
    search: searchTerm,
    category,
    isActive: true, // Solo productos activos en búsquedas
  });
};

/**
 * Obtener productos por categoría
 */
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  return getAllProducts({
    category,
    isActive: true,
  });
};

/**
 * Obtener productos activos (para el sitio público)
 */
export const getActiveProducts = async (): Promise<Product[]> => {
  return getAllProducts({
    isActive: true,
  });
};

/**
 * Obtener productos recientes (para dashboard)
 */
export const getRecentProducts = async (limit: number = 5): Promise<Product[]> => {
  const products = await getAllProducts();

  // Ordenar por fecha de actualización (más recientes primero)
  // Como Bind puede no devolver fechas, usamos el orden que viene
  return products.slice(0, limit);
};

/**
 * Obtener estadísticas de productos
 */
export const getProductStats = async () => {
  const allProducts = await getAllProducts();
  const activeProducts = allProducts.filter(p => p.status === 'active');
  const inactiveProducts = allProducts.filter(p => p.status === 'inactive');
  const lowStockProducts = allProducts.filter(p => p.stock < 5);

  return {
    total: allProducts.length,
    active: activeProducts.length,
    inactive: inactiveProducts.length,
    lowStock: lowStockProducts.length,
  };
};

export default {
  getAllProducts,
  getProductByBindId,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductsByCategory,
  getActiveProducts,
  getRecentProducts,
  getProductStats,
  bindProductToLocal,
  localProductToBind,
};
