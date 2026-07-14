import { query } from '@/config/database';
import { generateUUID } from '@/lib/database';
import type { CheckoutData, DeliveryMethod } from '@/lib/payment-utils';

// Borradores de checkout: guardan el carrito completo (con precios y datos
// resueltos en el servidor) al crear el Payment Intent. El metadata de Stripe
// solo lleva el uuid del borrador — cada valor de metadata está limitado a
// 500 caracteres, así que el carrito serializado NO cabe ahí (2+ items lo
// superan y Stripe rechaza el intent).

export interface DraftItem {
  product_id: number;
  uuid: string;
  name: string;
  quantity: number;
  price: number; // precio unitario en la moneda original (resuelto en servidor)
  currency: 'MXN' | 'USD';
  price_mxn: number; // precio unitario en MXN (lo que efectivamente se cobra)
  image_url: string | null;
  size: string | null;
  // Fila de filter_category_variants a decrementar (si el item es una variante
  // o un producto base con tamaño que resolvió a una variante)
  variant_id: number | null;
  // ProductID de BIND ERP ya resuelto para el ajuste de inventario
  bind_target: string | null;
}

export interface CheckoutDraftPayload {
  checkout: CheckoutData;
  shippingMethod: DeliveryMethod;
  items: DraftItem[];
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    exchangeRate?: number;
  };
  discount: {
    code: string;
    discountCodeId: number;
    amount: number;
  } | null;
}

let tableEnsured: Promise<void> | null = null;

const ensureTable = (): Promise<void> => {
  if (!tableEnsured) {
    tableEnsured = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS checkout_drafts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          uuid VARCHAR(36) NOT NULL UNIQUE,
          user_id INT NULL,
          payload JSON NOT NULL,
          payment_intent_id VARCHAR(100) NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    })().catch((error) => {
      tableEnsured = null;
      throw error;
    });
  }
  return tableEnsured;
};

export const createCheckoutDraft = async (
  payload: CheckoutDraftPayload,
  userId?: number
): Promise<{ id: number; uuid: string }> => {
  await ensureTable();
  const uuid = generateUUID();
  const result = await query(
    'INSERT INTO checkout_drafts (uuid, user_id, payload) VALUES (?, ?, ?)',
    [uuid, userId || null, JSON.stringify(payload)]
  ) as any;
  return { id: result.insertId, uuid };
};

export const attachPaymentIntentToDraft = async (
  draftUuid: string,
  paymentIntentId: string
): Promise<void> => {
  await ensureTable();
  await query(
    'UPDATE checkout_drafts SET payment_intent_id = ? WHERE uuid = ?',
    [paymentIntentId, draftUuid]
  );
};

export const getCheckoutDraftByUuid = async (
  draftUuid: string
): Promise<CheckoutDraftPayload | null> => {
  await ensureTable();
  const rows = await query(
    'SELECT payload FROM checkout_drafts WHERE uuid = ?',
    [draftUuid]
  ) as any[];
  if (!rows || rows.length === 0) return null;
  const raw = rows[0].payload;
  // mysql2 puede devolver la columna JSON ya parseada o como string
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
};

export const markDraftCompleted = async (draftUuid: string): Promise<void> => {
  await ensureTable();
  await query(
    "UPDATE checkout_drafts SET status = 'completed' WHERE uuid = ?",
    [draftUuid]
  );
};
