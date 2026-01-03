/**
 * Servicio de Configuración del Sitio
 *
 * Maneja la configuración general del sitio web
 */

import { query } from '@/config/database';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface SiteSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Obtener una configuración por clave
 */
export const getSetting = async (key: string): Promise<string | null> => {
  try {
    console.log('🔍 Obteniendo configuración:', key);

    const results = await query(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      [key]
    ) as SiteSetting[];

    if (results.length === 0) {
      console.log('❌ Configuración no encontrada');
      return null;
    }

    console.log('✅ Configuración obtenida');
    return results[0].setting_value;
  } catch (error) {
    console.error('❌ Error obteniendo configuración:', error);
    return null;
  }
};

/**
 * Obtener todas las configuraciones
 */
export const getAllSettings = async (): Promise<Record<string, string>> => {
  try {
    console.log('🔍 Obteniendo todas las configuraciones...');

    const results = await query(
      'SELECT setting_key, setting_value FROM site_settings'
    ) as SiteSetting[];

    const settings: Record<string, string> = {};
    results.forEach(setting => {
      settings[setting.setting_key] = setting.setting_value;
    });

    console.log(`✅ ${results.length} configuraciones obtenidas`);
    return settings;
  } catch (error) {
    console.error('❌ Error obteniendo configuraciones:', error);
    return {};
  }
};

/**
 * Actualizar o crear una configuración
 */
export const updateSetting = async (key: string, value: string): Promise<boolean> => {
  try {
    console.log('📝 Actualizando configuración:', key);

    await query(
      `INSERT INTO site_settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [key, value, value]
    );

    console.log('✅ Configuración actualizada');
    return true;
  } catch (error) {
    console.error('❌ Error actualizando configuración:', error);
    return false;
  }
};

/**
 * Configuraciones específicas con funciones helpers
 */

export const getHeroImage = async (): Promise<string> => {
  const image = await getSetting('hero_image');
  return image || '/images/hero-default.jpg';
};

export const updateHeroImage = async (imageUrl: string): Promise<boolean> => {
  return await updateSetting('hero_image', imageUrl);
};

export const getWhatsAppNumber = async (): Promise<string> => {
  const number = await getSetting('whatsapp_number');
  return number || '';
};

export const updateWhatsAppNumber = async (number: string): Promise<boolean> => {
  return await updateSetting('whatsapp_number', number);
};

export const getWhatsAppMessage = async (): Promise<string> => {
  const message = await getSetting('whatsapp_message');
  return message || 'Hola, me gustaría obtener más información sobre sus productos.';
};

export const updateWhatsAppMessage = async (message: string): Promise<boolean> => {
  return await updateSetting('whatsapp_message', message);
};

export default {
  getSetting,
  getAllSettings,
  updateSetting,
  getHeroImage,
  updateHeroImage,
  getWhatsAppNumber,
  updateWhatsAppNumber,
  getWhatsAppMessage,
  updateWhatsAppMessage,
};
