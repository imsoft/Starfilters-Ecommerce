/**
 * Servicio de integración con Bind ERP API
 * Documentación: https://developers.bind.com.mx/
 */

// Configuración de la API de Bind
const BIND_API_BASE_URL = 'https://api.bind.com.mx';
const BIND_API_TOKEN = import.meta.env.BIND_TOKEN;
const BIND_WAREHOUSE_ID = import.meta.env.BIND_WAREHOUSE_ID;
const BIND_PRICELIST_ID = import.meta.env.BIND_PRICELIST_ID;

/**
 * Interfaces para los datos de productos en Bind
 */
export interface BindProduct {
  id?: string;
  code?: string;
  title: string;
  description?: string;
  price?: number;
  cost?: number;
  taxIncluded?: boolean;
  taxRate?: number;
  inventory?: number;
  minInventory?: number;
  maxInventory?: number;
  unit?: string;
  weight?: number;
  weightUnit?: string;
  volume?: number;
  volumeUnit?: string;
  customFields?: Record<string, any>;
  isActive?: boolean;
  barcode?: string;
  sku?: string;
  category?: string;
  brand?: string;
  supplier?: string;
  imageUrl?: string;
  tags?: string[];
}

export interface BindProductResponse {
  success: boolean;
  data?: BindProduct;
  error?: string;
  message?: string;
}

export interface BindProductsListResponse {
  success: boolean;
  data?: BindProduct[];
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  error?: string;
  message?: string;
}

/**
 * Opciones para filtrar productos
 */
export interface GetProductsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
}

/**
 * Cliente HTTP para hacer peticiones a Bind API
 */
class BindAPIClient {
  private baseURL: string;
  private token: string;

  constructor(baseURL: string, token: string) {
    this.baseURL = baseURL;
    this.token = token;
  }

  /**
   * Headers comunes para todas las peticiones
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/json',
    };
  }

  /**
   * Manejo de errores de la API
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || `Error ${response.status}: ${response.statusText}`;
      } catch {
        errorMessage = `Error ${response.status}: ${errorText || response.statusText}`;
      }

      console.error('❌ Bind API Error:', {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
      });

      throw new Error(errorMessage);
    }

    // Manejar respuestas sin contenido (204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    const text = await response.text();
    if (!text || text.trim() === '') {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('🔍 Bind API GET:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('📤 Bind API POST:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('📝 Bind API PUT:', url);

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('🗑️ Bind API DELETE:', url);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }
}

// Instancia del cliente
const bindClient = new BindAPIClient(BIND_API_BASE_URL, BIND_API_TOKEN);

/**
 * ========================================
 * FUNCIONES PÚBLICAS - CRUD DE PRODUCTOS
 * ========================================
 */

/**
 * Crear un nuevo producto en Bind
 */
export const createBindProduct = async (product: BindProduct): Promise<BindProductResponse> => {
  try {
    console.log('✨ Creando producto en Bind:', product.title);

    const response = await bindClient.post<any>('/api/Products', product);

    return {
      success: true,
      data: response,
      message: 'Producto creado exitosamente en Bind',
    };
  } catch (error) {
    console.error('❌ Error al crear producto en Bind:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al crear producto',
    };
  }
};

/**
 * Obtener un producto por ID de Bind
 */
export const getBindProductById = async (id: string): Promise<BindProductResponse> => {
  try {
    console.log('🔍 Obteniendo producto de Bind:', id);

    const response = await bindClient.get<any>(`/api/Products/${id}`);

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error('❌ Error al obtener producto de Bind:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al obtener producto',
    };
  }
};

/**
 * Obtener lista de productos de Bind con precios e inventario
 * Usa el endpoint /api/ProductsPriceAndInventory que incluye información de precios
 */
export const getBindProducts = async (options: GetProductsOptions = {}): Promise<BindProductsListResponse> => {
  try {
    const { page = 1, pageSize = 100 } = options;

    // Verificar que tenemos los IDs necesarios
    if (!BIND_WAREHOUSE_ID || !BIND_PRICELIST_ID) {
      console.warn('⚠️ BIND_WAREHOUSE_ID o BIND_PRICELIST_ID no están configurados, usando endpoint básico');

      // Fallback al endpoint básico si no tenemos los IDs
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      const endpoint = `/api/Products?${params.toString()}`;
      console.log('📋 Obteniendo productos de Bind (endpoint básico):', endpoint);

      const response = await bindClient.get<any>(endpoint);
      const products = response.value || response.items || response.data || response;

      return {
        success: true,
        data: Array.isArray(products) ? products : [],
        pagination: response.pagination || response['@odata.count'] || response.count,
      };
    }

    // Usar el endpoint con precios e inventario
    const endpoint = `/api/ProductsPriceAndInventory?warehouseId=${BIND_WAREHOUSE_ID}&priceListId=${BIND_PRICELIST_ID}`;
    console.log('📋 Obteniendo productos con precios de Bind:', endpoint);

    const response = await bindClient.get<any>(endpoint);

    // Este endpoint devuelve un array directo con precios
    let products = Array.isArray(response) ? response : (response.value || response.items || response.data || []);

    // DEBUG: Verificar estructura de precios
    if (Array.isArray(products) && products.length > 0) {
      console.log('🔍 DEBUG - Estructura del primer producto con precios:');
      console.log('  - Tiene Price?:', !!products[0].Price);
      console.log('  - Price value:', products[0].Price);
      console.log('  - Tiene Inventory?:', !!products[0].Inventory);
      console.log('  - Campos disponibles:', Object.keys(products[0]));
    }

    console.log(`✅ ${products.length} productos con precios obtenidos de Bind API`);

    // Aplicar paginación manual ya que este endpoint no soporta paginación
    const startIndex = (page - 1) * pageSize;
    const paginatedProducts = products.slice(startIndex, startIndex + pageSize);

    return {
      success: true,
      data: paginatedProducts,
      pagination: {
        page: page,
        pageSize: pageSize,
        totalItems: products.length,
        totalPages: Math.ceil(products.length / pageSize),
      },
    };
  } catch (error) {
    console.error('❌ Error al obtener productos de Bind:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al obtener productos',
    };
  }
};

/**
 * Obtener TODOS los productos de Bind iterando sobre todas las páginas
 * LIMITADO: Solo obtiene las primeras 50 páginas (5000 productos) para evitar timeouts
 */
export const getAllBindProducts = async (options: Omit<GetProductsOptions, 'page' | 'pageSize'> = {}): Promise<BindProductsListResponse> => {
  try {
    console.log('🔄 Obteniendo productos de Bind (limitado a 5000)...');

    const allProducts: BindProduct[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    const pageSize = 100; // Máximo por página
    const maxPages = 50; // LÍMITE: solo 50 páginas = 5000 productos

    while (hasMorePages && currentPage <= maxPages) {
      const result = await getBindProducts({
        ...options,
        page: currentPage,
        pageSize: pageSize,
      });

      if (!result.success || !result.data) {
        console.error(`❌ Error en página ${currentPage}:`, result.error);
        break;
      }

      const pageProducts = result.data;
      allProducts.push(...pageProducts);

      // Log cada 10 páginas para reducir spam
      if (currentPage % 10 === 0 || pageProducts.length < pageSize) {
        console.log(`📊 Progreso: ${allProducts.length} productos (página ${currentPage})`);
      }

      // Si obtuvimos menos productos que el pageSize, es la última página
      if (pageProducts.length < pageSize) {
        hasMorePages = false;
        console.log('✅ Última página alcanzada');
      } else {
        currentPage++;
      }
    }

    if (currentPage > maxPages) {
      console.log(`⚠️ Límite alcanzado: ${allProducts.length} productos (máximo: ${maxPages * pageSize})`);
    } else {
      console.log(`🎉 Total de productos obtenidos: ${allProducts.length}`);
    }

    return {
      success: true,
      data: allProducts,
      pagination: {
        page: 1,
        pageSize: allProducts.length,
        totalItems: allProducts.length,
        totalPages: 1,
      },
    };
  } catch (error) {
    console.error('❌ Error al obtener todos los productos de Bind:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al obtener todos los productos',
    };
  }
};

/**
 * Actualizar un producto existente en Bind
 */
export const updateBindProduct = async (id: string, product: Partial<BindProduct>): Promise<BindProductResponse> => {
  try {
    console.log('📝 Actualizando producto en Bind:', id);

    const response = await bindClient.put<any>('/api/Products', {
      id,
      ...product,
    });

    return {
      success: true,
      data: response,
      message: 'Producto actualizado exitosamente en Bind',
    };
  } catch (error) {
    console.error('❌ Error al actualizar producto en Bind:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al actualizar producto',
    };
  }
};

/**
 * Eliminar un producto de Bind
 */
export const deleteBindProduct = async (id: string): Promise<BindProductResponse> => {
  try {
    console.log('🗑️ Eliminando producto de Bind:', id);

    const response = await bindClient.delete<any>(`/api/Products/${id}`);

    return {
      success: true,
      message: 'Producto eliminado exitosamente de Bind',
    };
  } catch (error) {
    console.error('❌ Error al eliminar producto de Bind:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al eliminar producto',
    };
  }
};

/**
 * Sincronizar producto: crear o actualizar en Bind
 * Útil cuando no sabes si el producto ya existe en Bind
 */
export const syncBindProduct = async (
  bindId: string | null,
  product: BindProduct
): Promise<BindProductResponse> => {
  try {
    if (bindId) {
      // Producto ya existe en Bind, actualizar
      console.log('🔄 Sincronizando (actualizar) producto en Bind:', bindId);
      return await updateBindProduct(bindId, product);
    } else {
      // Producto nuevo, crear
      console.log('🔄 Sincronizando (crear) producto en Bind');
      return await createBindProduct(product);
    }
  } catch (error) {
    console.error('❌ Error al sincronizar producto con Bind:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al sincronizar producto',
    };
  }
};

/**
 * Interface para el modelo NewInventoryAdjustment de Bind ERP
 * Documentación: POST /api/Inventory
 */
interface NewInventoryAdjustment {
  ProductID: string;
  WarehouseID: string;
  AdjustQty: number;
  Date: string;
  Comments: string;
}

/**
 * Ajustar el inventario de un producto en Bind mediante POST /api/Inventory
 * Usa un ajuste de inventario (delta negativo) en lugar de establecer un valor absoluto.
 * Esto garantiza que el stock de Bind siempre se ajuste correctamente,
 * incluso si se modificó directamente en Bind (ej. entrada de mercancía).
 *
 * @param bindId - UUID del producto en Bind
 * @param quantitySold - Cantidad vendida (número positivo, se convertirá a negativo internamente)
 * @param orderNumber - Número de orden para trazabilidad
 */
export const adjustBindProductInventory = async (
  bindId: string,
  quantitySold: number,
  orderNumber: string
): Promise<BindProductResponse> => {
  try {
    if (!BIND_WAREHOUSE_ID) {
      console.error('❌ BIND_WAREHOUSE_ID no está configurado');
      return {
        success: false,
        error: 'BIND_WAREHOUSE_ID no está configurado. No se puede ajustar inventario en Bind.',
      };
    }

    const adjustQty = -Math.abs(quantitySold);

    console.log(`📦 Ajustando inventario en Bind (Producto: ${bindId}, Cantidad: ${adjustQty}, Orden: ${orderNumber})`);

    const adjustment: NewInventoryAdjustment = {
      ProductID: bindId,
      WarehouseID: BIND_WAREHOUSE_ID,
      AdjustQty: adjustQty,
      Date: new Date().toISOString(),
      Comments: `Venta e-commerce - Orden ${orderNumber} (${quantitySold} unidad${quantitySold !== 1 ? 'es' : ''})`,
    };

    await bindClient.post<any>('/api/Inventory', adjustment);

    console.log(`✅ Inventario ajustado en Bind: producto ${bindId}, ${adjustQty} unidades (Orden: ${orderNumber})`);

    return {
      success: true,
      message: `Inventario ajustado exitosamente en Bind: ${adjustQty} unidades`,
    };
  } catch (error) {
    console.error('❌ Error al ajustar inventario en Bind:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al ajustar inventario',
    };
  }
};

/**
 * @deprecated Usar adjustBindProductInventory en su lugar.
 * Esta función usaba PUT /api/Products que NO actualiza inventario en Bind.
 * Se mantiene temporalmente por compatibilidad pero redirige a la función correcta.
 */
export const updateBindProductInventory = async (
  bindId: string,
  _newInventory: number,
  orderNumber: string = 'N/A',
  quantitySold: number = 0
): Promise<BindProductResponse> => {
  if (quantitySold > 0) {
    return adjustBindProductInventory(bindId, quantitySold, orderNumber);
  }
  console.warn('⚠️ updateBindProductInventory llamado sin quantitySold. No se puede ajustar inventario.');
  return {
    success: false,
    error: 'Se requiere quantitySold para ajustar inventario correctamente.',
  };
};

/**
 * Verificar conexión con Bind API
 */
export const checkBindConnection = async (): Promise<boolean> => {
  try {
    console.log('🔌 Verificando conexión con Bind API...');
    await bindClient.get('/api/Products?pageSize=1');
    console.log('✅ Conexión con Bind API exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión con Bind API:', error);
    return false;
  }
};

export default {
  createBindProduct,
  getBindProductById,
  getBindProducts,
  getAllBindProducts,
  updateBindProduct,
  adjustBindProductInventory,
  updateBindProductInventory,
  deleteBindProduct,
  syncBindProduct,
  checkBindConnection,
};

/**
 * Mapa código BIND → inventario, para pintar existencias en listados.
 *
 * /api/ProductsPriceAndInventory devuelve el catálogo COMPLETO en una sola
 * llamada (la paginación de getBindProducts es un slice en memoria), así que
 * se pide una vez con un tamaño grande: paginar de 100 en 100 hacía una
 * descarga completa por página y con el plazo de 8s solo entraban los primeros
 * productos, por eso el resto salía como "código sin coincidencia".
 *
 * Con tiempo límite y caché en memoria: si BIND tarda o falla, quien llama
 * muestra el dato local.
 */
let inventarioCache: { data: Map<string, number>; timestamp: number } | null = null;
const INVENTARIO_TTL_MS = 5 * 60 * 1000;

/** Los campos llegan en distintas grafías según el endpoint de BIND */
const primerValor = (obj: any, claves: string[]): any => {
  for (const clave of claves) {
    if (obj[clave] !== undefined && obj[clave] !== null && obj[clave] !== '') return obj[clave];
  }
  return undefined;
};

export const getBindInventoryByCode = async (
  timeoutMs = 8000
): Promise<Map<string, number> | null> => {
  if (inventarioCache && Date.now() - inventarioCache.timestamp < INVENTARIO_TTL_MS) {
    return inventarioCache.data;
  }

  try {
    const resultado = await Promise.race([
      getBindProducts({ page: 1, pageSize: 5000 }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);

    if (!resultado) {
      console.warn(`⚠️ BIND no respondió en ${timeoutMs}ms; se usará el inventario local`);
      return null;
    }
    if (!resultado.success || !resultado.data) return null;

    const mapa = new Map<string, number>();
    for (const bp of resultado.data as any[]) {
      const inventario = Number(
        primerValor(bp, ['inventory', 'Inventory', 'CurrentInventory', 'currentInventory', 'Existencia', 'stock']) ?? 0
      ) || 0;
      const claves = [
        primerValor(bp, ['code', 'Code', 'productCode', 'ProductCode']),
        primerValor(bp, ['sku', 'SKU', 'Sku']),
        primerValor(bp, ['id', 'ID', 'Id', 'productId', 'ProductID']),
      ];
      for (const clave of claves) {
        if (clave) mapa.set(String(clave).trim().toUpperCase(), inventario);
      }
    }

    if (mapa.size === 0 && (resultado.data as any[]).length > 0) {
      console.warn(
        '⚠️ BIND devolvió productos pero sin código reconocible. Campos del primero:',
        Object.keys((resultado.data as any[])[0])
      );
    } else {
      console.log(`📦 Inventario de BIND: ${mapa.size} claves de ${(resultado.data as any[]).length} productos`);
    }

    inventarioCache = { data: mapa, timestamp: Date.now() };
    return mapa;
  } catch (error) {
    console.error('❌ Error obteniendo inventario de BIND:', error);
    return null;
  }
};

/**
 * Precio de BIND por código, en pesos.
 *
 * IMPORTANTE: /api/ProductsPriceAndInventory devuelve el precio **ya convertido
 * a MXN**, aunque el producto esté capturado en dólares. Se comprobó contra el
 * catálogo real comparando con /api/Products/{id}, que sí da el precio nativo:
 *
 *   VENT7   lista 17.11      nativo 1 USD      → 17.11x
 *   BFIL1   lista 72,389.03  nativo 4,231 USD  → 17.11x
 *   B952    lista 1,131      nativo 1,131 MXN  → 1.00x
 *
 * Es decir, el `CurrencyCode` del detalle dice en qué moneda se captura el
 * producto, NO en qué moneda viene el precio de la lista. Tomarlo como moneda
 * de la lista habría multiplicado los precios por 17.
 */
export interface PrecioBind {
  precio: number;
  moneda: 'MXN';
}

export const getBindPreciosPorCodigo = async (
  codigos: string[]
): Promise<Map<string, PrecioBind>> => {
  const resultado = new Map<string, PrecioBind>();
  const buscados = new Set(codigos.map((c) => String(c).trim().toUpperCase()).filter(Boolean));
  if (buscados.size === 0) return resultado;

  const lista = await getBindProducts({ page: 1, pageSize: 5000 });
  if (!lista.success || !lista.data) return resultado;

  for (const bp of lista.data as any[]) {
    const codigo = String(bp.Code ?? bp.code ?? '').trim().toUpperCase();
    if (!codigo || !buscados.has(codigo)) continue;
    const precio = Number(bp.Price ?? bp.price ?? 0) || 0;
    if (precio > 0) resultado.set(codigo, { precio, moneda: 'MXN' });
  }

  console.log(`💲 Precios de BIND resueltos: ${resultado.size} de ${buscados.size} códigos`);
  return resultado;
};
