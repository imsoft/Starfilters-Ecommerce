#!/bin/bash
echo "=== Verificando configuración de WhatsApp ==="
echo ""
echo "1. Verificando si existe la tabla site_settings:"
mysql -u root -p'Temporal1#' starfilters_ecommerce_db -e "SHOW TABLES LIKE 'site_settings';" 2>/dev/null

echo ""
echo "2. Verificando datos en site_settings:"
mysql -u root -p'Temporal1#' starfilters_ecommerce_db -e "SELECT * FROM site_settings WHERE setting_key LIKE 'whatsapp%';" 2>/dev/null

echo ""
echo "=== Verificación completa ==="
