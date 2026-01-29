import { query } from '../config/database';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface DiscountCode extends RowDataPacket {
  id: number;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  start_date: Date | null;
  end_date: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DiscountCodeValidation {
  valid: boolean;
  message: string;
  discountCode?: DiscountCode;
  discountAmount?: number;
}

/**
 * Valida un código de descuento y calcula el monto del descuento
 */
export async function validateDiscountCode(
  code: string,
  subtotal: number,
  cartItems?: Array<{ product_id: number; uuid: string }> // Items del carrito para validar productos permitidos
): Promise<DiscountCodeValidation> {
  try {
    // Buscar el código de descuento
    const results = await query(
      `SELECT * FROM discount_codes WHERE code = ? AND is_active = TRUE`,
      [code.toUpperCase()]
    ) as DiscountCode[];

    if (!results || results.length === 0) {
      return {
        valid: false,
        message: 'Código de descuento no válido',
      };
    }

    const discountCode = results[0];
    const now = new Date();

    // Validar fechas de vigencia
    if (discountCode.start_date && new Date(discountCode.start_date) > now) {
      return {
        valid: false,
        message: 'Este código aún no está activo',
      };
    }

    if (discountCode.end_date && new Date(discountCode.end_date) < now) {
      return {
        valid: false,
        message: 'Este código ha expirado',
      };
    }

    // Validar límite de uso
    if (
      discountCode.usage_limit !== null &&
      discountCode.usage_count >= discountCode.usage_limit
    ) {
      return {
        valid: false,
        message: 'Este código ha alcanzado su límite de uso',
      };
    }

    // Validar monto mínimo de compra
    if (
      discountCode.min_purchase_amount !== null &&
      subtotal < discountCode.min_purchase_amount
    ) {
      return {
        valid: false,
        message: `Este código requiere una compra mínima de $${discountCode.min_purchase_amount.toFixed(2)} MXN`,
      };
    }

    // Validar productos permitidos (si el código tiene productos específicos)
    const allowedProductIds = await getDiscountCodeProducts(discountCode.id);
    if (allowedProductIds.length > 0 && cartItems) {
      // Verificar que todos los productos del carrito estén en la lista permitida
      const cartProductIds = cartItems.map(item => item.product_id);
      const allProductsAllowed = cartProductIds.every(id => allowedProductIds.includes(id));
      
      if (!allProductsAllowed) {
        return {
          valid: false,
          message: 'Este código de descuento solo es válido para productos específicos',
        };
      }
    }

    // Calcular el descuento
    let discountAmount = 0;
    if (discountCode.discount_type === 'percentage') {
      discountAmount = (subtotal * discountCode.discount_value) / 100;
      // Aplicar límite máximo si existe
      if (
        discountCode.max_discount_amount !== null &&
        discountAmount > discountCode.max_discount_amount
      ) {
        discountAmount = discountCode.max_discount_amount;
      }
    } else {
      // Descuento fijo
      discountAmount = discountCode.discount_value;
      // El descuento no puede ser mayor al subtotal
      if (discountAmount > subtotal) {
        discountAmount = subtotal;
      }
    }

    return {
      valid: true,
      message: 'Código aplicado exitosamente',
      discountCode,
      discountAmount: Math.round(discountAmount * 100) / 100, // Redondear a 2 decimales
    };
  } catch (error) {
    console.error('Error validating discount code:', error);
    return {
      valid: false,
      message: 'Error al validar el código de descuento',
    };
  }
}

/**
 * Registra el uso de un código de descuento
 */
export async function recordDiscountCodeUsage(
  discountCodeId: number,
  orderId: number,
  discountAmount: number,
  userId?: number
): Promise<void> {
  try {
    // Insertar registro de uso
    await query(
      `INSERT INTO discount_code_usage (discount_code_id, order_id, user_id, discount_amount)
       VALUES (?, ?, ?, ?)`,
      [discountCodeId, orderId, userId || null, discountAmount]
    );

    // Incrementar contador de uso
    await query(
      `UPDATE discount_codes SET usage_count = usage_count + 1 WHERE id = ?`,
      [discountCodeId]
    );
  } catch (error) {
    console.error('Error recording discount code usage:', error);
    throw error;
  }
}

/**
 * Obtiene todos los códigos de descuento (para admin)
 */
export async function getAllDiscountCodes(): Promise<DiscountCode[]> {
  try {
    const results = await query(
      `SELECT * FROM discount_codes ORDER BY created_at DESC`
    ) as DiscountCode[];
    return results || [];
  } catch (error) {
    console.error('Error fetching discount codes:', error);
    return [];
  }
}

/**
 * Crea un nuevo código de descuento
 */
export async function createDiscountCode(data: {
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  product_ids?: number[]; // IDs de productos específicos (opcional)
}): Promise<number> {
  try {
    const result = await query(
      `INSERT INTO discount_codes
       (code, description, discount_type, discount_value, min_purchase_amount,
        max_discount_amount, usage_limit, start_date, end_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.code.toUpperCase(),
        data.description || null,
        data.discount_type,
        data.discount_value,
        data.min_purchase_amount || null,
        data.max_discount_amount || null,
        data.usage_limit || null,
        data.start_date || null,
        data.end_date || null,
        data.is_active !== undefined ? data.is_active : true,
      ]
    );
    
    const discountCodeId = (result as any).insertId;
    
    // Si hay productos específicos, asociarlos al código de descuento
    if (data.product_ids && data.product_ids.length > 0) {
      await associateProductsToDiscountCode(discountCodeId, data.product_ids);
    }
    
    return discountCodeId;
  } catch (error) {
    console.error('Error creating discount code:', error);
    throw error;
  }
}

/**
 * Asocia productos específicos a un código de descuento
 */
export async function associateProductsToDiscountCode(
  discountCodeId: number,
  productIds: number[]
): Promise<void> {
  try {
    // Eliminar asociaciones existentes
    await query(
      `DELETE FROM discount_code_products WHERE discount_code_id = ?`,
      [discountCodeId]
    );
    
    // Crear nuevas asociaciones
    if (productIds.length > 0) {
      const values = productIds.map(() => '(?, ?)').join(', ');
      const params = productIds.flatMap(id => [discountCodeId, id]);
      
      await query(
        `INSERT INTO discount_code_products (discount_code_id, product_id) VALUES ${values}`,
        params
      );
    }
  } catch (error) {
    console.error('Error associating products to discount code:', error);
    throw error;
  }
}

/**
 * Obtiene los IDs de productos asociados a un código de descuento
 */
export async function getDiscountCodeProducts(discountCodeId: number): Promise<number[]> {
  try {
    const results = await query(
      `SELECT product_id FROM discount_code_products WHERE discount_code_id = ?`,
      [discountCodeId]
    ) as { product_id: number }[];
    
    return results.map(r => r.product_id);
  } catch (error) {
    console.error('Error fetching discount code products:', error);
    return [];
  }
}

/**
 * Actualiza un código de descuento
 */
export async function updateDiscountCode(
  id: number,
  data: Partial<Omit<DiscountCode, 'id' | 'usage_count' | 'created_at' | 'updated_at'>> & {
    product_ids?: number[];
  }
): Promise<void> {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.code !== undefined) {
      updates.push('code = ?');
      values.push(data.code.toUpperCase());
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.discount_type !== undefined) {
      updates.push('discount_type = ?');
      values.push(data.discount_type);
    }
    if (data.discount_value !== undefined) {
      updates.push('discount_value = ?');
      values.push(data.discount_value);
    }
    if (data.min_purchase_amount !== undefined) {
      updates.push('min_purchase_amount = ?');
      values.push(data.min_purchase_amount);
    }
    if (data.max_discount_amount !== undefined) {
      updates.push('max_discount_amount = ?');
      values.push(data.max_discount_amount);
    }
    if (data.usage_limit !== undefined) {
      updates.push('usage_limit = ?');
      values.push(data.usage_limit);
    }
    if (data.start_date !== undefined) {
      updates.push('start_date = ?');
      values.push(data.start_date);
    }
    if (data.end_date !== undefined) {
      updates.push('end_date = ?');
      values.push(data.end_date);
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(data.is_active);
    }

    if (updates.length > 0) {
      values.push(id);
      await query(
        `UPDATE discount_codes SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Actualizar productos asociados si se proporcionan
    if (data.product_ids !== undefined) {
      await associateProductsToDiscountCode(id, data.product_ids);
    }
  } catch (error) {
    console.error('Error updating discount code:', error);
    throw error;
  }
}

/**
 * Elimina un código de descuento
 */
export async function deleteDiscountCode(id: number): Promise<void> {
  try {
    await query(`DELETE FROM discount_codes WHERE id = ?`, [id]);
  } catch (error) {
    console.error('Error deleting discount code:', error);
    throw error;
  }
}

/**
 * Obtiene un código de descuento por ID
 */
export async function getDiscountCodeById(id: number): Promise<DiscountCode | null> {
  try {
    const results = await query(
      `SELECT * FROM discount_codes WHERE id = ?`,
      [id]
    ) as DiscountCode[];
    return results && results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Error fetching discount code:', error);
    return null;
  }
}
