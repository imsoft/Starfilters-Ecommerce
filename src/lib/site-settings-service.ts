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

export const getHeroType = async (): Promise<'video' | 'image'> => {
  const type = await getSetting('hero_type');
  return (type as 'video' | 'image') || 'video';
};

export const updateHeroType = async (type: 'video' | 'image'): Promise<boolean> => {
  return await updateSetting('hero_type', type);
};

export const getHeroVideo = async (): Promise<string> => {
  const video = await getSetting('hero_video');
  return video || '/videos/hero-720.mp4';
};

export const updateHeroVideo = async (videoUrl: string): Promise<boolean> => {
  return await updateSetting('hero_video', videoUrl);
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

// Número de teléfono principal (Guadalajara / ventas)
export const getPhoneNumber = async (): Promise<string> => {
  const number = await getSetting('phone_number');
  return number || '523338987991';
};

export const updatePhoneNumber = async (number: string): Promise<boolean> => {
  return await updateSetting('phone_number', number);
};

// Número de teléfono secundario (CDMX / soporte)
export const getPhoneNumberCDMX = async (): Promise<string> => {
  const number = await getSetting('phone_number_cdmx');
  return number || '525550870287';
};

export const updatePhoneNumberCDMX = async (number: string): Promise<boolean> => {
  return await updateSetting('phone_number_cdmx', number);
};

/**
 * Correos que reciben las notificaciones internas de pedidos.
 *
 * Se guardan como un arreglo JSON en site_settings para que el admin pueda
 * poner los que quiera desde /admin/settings/notificaciones. Si la lista está
 * vacía se usa ADMIN_EMAIL del entorno, que es como funcionaba antes: así una
 * instalación sin configurar sigue avisando a alguien.
 */
export const ORDER_NOTIFICATION_EMAILS_KEY = 'order_notification_emails';

export const getOrderNotificationEmails = async (): Promise<string[]> => {
  const raw = await getSetting(ORDER_NOTIFICATION_EMAILS_KEY);

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const emails = parsed
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.trim())
          .filter(Boolean);
        if (emails.length > 0) return emails;
      }
    } catch (error) {
      console.error('❌ order_notification_emails ilegible, se usará ADMIN_EMAIL:', error);
    }
  }

  const fallback = process.env.ADMIN_EMAIL || import.meta.env.ADMIN_EMAIL;
  return fallback ? [fallback] : [];
};

export const updateOrderNotificationEmails = async (emails: string[]): Promise<boolean> => {
  const clean = emails.map((email) => email.trim()).filter(Boolean);
  return await updateSetting(ORDER_NOTIFICATION_EMAILS_KEY, JSON.stringify(clean));
};

/**
 * Instrucciones internas que se agregan al final del correo de nuevo pedido
 * (cómo preparar el paquete, a quién avisar, etc.). Opcional.
 */
export const getOrderNotificationNote = async (): Promise<string> => {
  const note = await getSetting('order_notification_note');
  return note || '';
};

export const updateOrderNotificationNote = async (note: string): Promise<boolean> => {
  return await updateSetting('order_notification_note', note);
};

export default {
  getSetting,
  getAllSettings,
  updateSetting,
  getHeroImage,
  updateHeroImage,
  getHeroType,
  updateHeroType,
  getHeroVideo,
  updateHeroVideo,
  getWhatsAppNumber,
  updateWhatsAppNumber,
  getWhatsAppMessage,
  updateWhatsAppMessage,
  getPhoneNumber,
  updatePhoneNumber,
  getPhoneNumberCDMX,
  updatePhoneNumberCDMX,
  getOrderNotificationEmails,
  updateOrderNotificationEmails,
  getOrderNotificationNote,
  updateOrderNotificationNote,
};
