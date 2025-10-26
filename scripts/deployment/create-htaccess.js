#!/usr/bin/env node
/**
 * Script para crear archivo .htaccess para Hostinger
 * Uso: node scripts/deployment/create-htaccess.js
 */

import { writeFileSync } from 'fs';
import { existsSync } from 'fs';

const HTACCESS_FILE = './.htaccess';

const htaccessContent = `# ============================================
# CONFIGURACIÓN APACHE PARA HOSTINGER
# ============================================

# Habilitar Rewrite Engine
RewriteEngine On

# Redirigir HTTP a HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Redirigir www a no-www (opcional)
# RewriteCond %{HTTP_HOST} ^www\.(.+)$ [NC]
# RewriteRule ^(.*)$ https://%1/$1 [R=301,L]

# Habilitar compresión GZIP
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
  AddOutputFilterByType DEFLATE application/json
  AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# Cache de navegador
<IfModule mod_expires.c>
  ExpiresActive On
  
  # Imágenes
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/x-icon "access plus 1 year"
  
  # CSS y JavaScript
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/x-javascript "access plus 1 month"
  
  # Fuentes
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType application/font-woff "access plus 1 year"
  ExpiresByType application/font-woff2 "access plus 1 year"
  
  # Documentos
  ExpiresByType application/pdf "access plus 1 month"
  
  # Por defecto
  ExpiresDefault "access plus 2 days"
</IfModule>

# Headers de seguridad
<IfModule mod_headers.c>
  # Prevenir clickjacking
  Header always set X-Frame-Options "SAMEORIGIN"
  
  # Prevenir MIME type sniffing
  Header always set X-Content-Type-Options "nosniff"
  
  # Habilitar XSS protection
  Header always set X-XSS-Protection "1; mode=block"
  
  # Referrer Policy
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  
  # Content Security Policy (ajusta según necesites)
  # Header always set Content-Security-Policy "default-src 'self'"
</IfModule>

# Deshabilitar listado de directorios
Options -Indexes

# Proteger archivos sensibles
<FilesMatch "^\\.env$">
  Order allow,deny
  Deny from all
</FilesMatch>

<FilesMatch "\\.(sql|log|md)$">
  Order allow,deny
  Deny from all
</FilesMatch>
`;

console.log('📝 Creando archivo .htaccess para Hostinger...\n');

try {
  // Verificar si ya existe
  if (existsSync(HTACCESS_FILE)) {
    console.log(`⚠️  El archivo ${HTACCESS_FILE} ya existe`);
    console.log('   No se sobrescribirá para no perder tu configuración\n');
  } else {
    writeFileSync(HTACCESS_FILE, htaccessContent);
    console.log(`✅ Archivo creado: ${HTACCESS_FILE}`);
    console.log('\n💡 Este archivo incluye:');
    console.log('   ✓ Redirección automática a HTTPS');
    console.log('   ✓ Compresión GZIP');
    console.log('   ✓ Cache de navegador');
    console.log('   ✓ Headers de seguridad');
    console.log('   ✓ Protección de archivos sensibles\n');
  }

} catch (error) {
  console.error('❌ Error al crear .htaccess:', error.message);
  process.exit(1);
}
