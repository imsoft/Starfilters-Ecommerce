import { query } from '../config/database';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface Benefit extends RowDataPacket {
  id: number;
  text_es: string;
  text_en: string;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export async function getActiveBenefits(): Promise<Benefit[]> {
  return query(
    'SELECT * FROM benefits WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
  ) as Promise<Benefit[]>;
}

export async function getAllBenefits(): Promise<Benefit[]> {
  return query(
    'SELECT * FROM benefits ORDER BY sort_order ASC, id ASC'
  ) as Promise<Benefit[]>;
}

export async function getBenefitById(id: number): Promise<Benefit | null> {
  const results = await query(
    'SELECT * FROM benefits WHERE id = ?',
    [id]
  ) as Benefit[];
  return results[0] || null;
}

export async function createBenefit(data: {
  text_es: string;
  text_en: string;
  is_active?: boolean;
  sort_order?: number;
}): Promise<number> {
  const result = await query(
    'INSERT INTO benefits (text_es, text_en, is_active, sort_order) VALUES (?, ?, ?, ?)',
    [data.text_es, data.text_en, data.is_active ?? true, data.sort_order ?? 0]
  ) as ResultSetHeader;
  return result.insertId;
}

export async function updateBenefit(
  id: number,
  data: {
    text_es: string;
    text_en: string;
    is_active: boolean;
    sort_order: number;
  }
): Promise<void> {
  await query(
    'UPDATE benefits SET text_es = ?, text_en = ?, is_active = ?, sort_order = ? WHERE id = ?',
    [data.text_es, data.text_en, data.is_active, data.sort_order, id]
  );
}

export async function deleteBenefit(id: number): Promise<void> {
  await query('DELETE FROM benefits WHERE id = ?', [id]);
}

export async function reorderBenefits(items: { id: number; sort_order: number }[]): Promise<void> {
  for (const item of items) {
    await query('UPDATE benefits SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
  }
}

export async function getNextBenefitSortOrder(): Promise<number> {
  const rows = await query('SELECT MAX(sort_order) as max_order FROM benefits') as any[];
  return ((rows as any[])[0]?.max_order ?? -1) + 1;
}
