#!/usr/bin/env node

/**
 * Diagnóstico de SOLO LECTURA de la configuración del Hero.
 *
 * Revisa la tabla site_settings: si existe, si setting_key es UNIQUE (necesario
 * para que la subida sobrescriba en vez de duplicar), y qué valores hero_* tiene
 * (detecta filas duplicadas, que harían que el sitio siga mostrando el video
 * viejo aunque subas uno nuevo).
 *
 * NO modifica nada.
 *
 * Uso: node scripts/check-hero.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'starfilters_ecommerce_db',
  });

  const [dbRows] = await connection.query('SELECT DATABASE() AS db');
  console.log(`🔗 Conectado a la base: ${dbRows[0].db}\n`);
  const q = async (s, p = []) => (await connection.query(s, p))[0];

  // ¿Existe la tabla?
  const exists = (await q(
    `SELECT COUNT(*) n FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings'`
  ))[0].n > 0;
  if (!exists) {
    console.log('❌ La tabla site_settings NO existe. Por eso no se guarda el video del Hero.');
    console.log('   Solución: crear la tabla (migrations/add_site_settings.sql).');
    await connection.end();
    process.exit(1);
  }

  // ¿setting_key es UNIQUE?
  const idx = await q(`SHOW INDEX FROM site_settings WHERE Column_name = 'setting_key'`);
  const isUnique = idx.some((i) => i.Non_unique === 0);
  console.log(`${isUnique ? '✅' : '❌'} setting_key tiene índice UNIQUE: ${isUnique}`);
  if (!isUnique) {
    console.log('   ⚠️  Sin UNIQUE, cada "guardar" inserta una fila nueva y el sitio sigue leyendo la vieja.');
  }

  // Valores y duplicados de las claves hero_*
  console.log('\n── Filas hero_* en site_settings ──────────────────────');
  const rows = await q(
    `SELECT id, setting_key, setting_value, updated_at FROM site_settings
     WHERE setting_key LIKE 'hero%' ORDER BY setting_key, id`
  );
  if (rows.length === 0) {
    console.log('   (ninguna fila hero_* — nunca se ha guardado configuración del Hero)');
  } else {
    for (const r of rows) {
      const v = (r.setting_value || '').slice(0, 70);
      console.log(`   #${r.id}  ${r.setting_key} = ${v}${(r.setting_value || '').length > 70 ? '…' : ''}`);
    }
  }

  // Conteo por clave (para detectar duplicados)
  const counts = await q(
    `SELECT setting_key, COUNT(*) n FROM site_settings WHERE setting_key LIKE 'hero%' GROUP BY setting_key`
  );
  const dups = counts.filter((c) => c.n > 1);
  console.log('\n── Resumen ────────────────────────────────────────────');
  if (dups.length > 0) {
    console.log('❌ Hay claves DUPLICADAS (esta es la causa típica de "subí el video y no cambió"):');
    dups.forEach((d) => console.log(`   • ${d.setting_key}: ${d.n} filas`));
    console.log('   Solución: limpiar duplicados y agregar índice UNIQUE (te paso un script si sale esto).');
  } else if (rows.length > 0) {
    console.log('✅ Sin duplicados. El valor guardado del Hero es el más reciente mostrado arriba.');
    console.log('   Si el sitio sigue mostrando el video viejo, es caché (reinicia la app / purga CDN/Nginx).');
  }

  await connection.end();
}

main().catch((err) => {
  console.error('❌ Error consultando la base:', err.message);
  process.exit(2);
});
