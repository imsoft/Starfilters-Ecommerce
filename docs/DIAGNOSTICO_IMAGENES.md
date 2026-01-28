# 🔍 Diagnóstico: Problemas con Subida/Eliminación de Imágenes

## Pasos para Diagnosticar el Problema

### 1. Abrir la Consola del Navegador

1. Ve a la página de edición de categoría: `https://srv1171123.hstgr.cloud/admin/filter-categories/edit/17`
2. Presiona `F12` o `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
3. Ve a la pestaña **"Console"**

### 2. Verificar Autenticación

Ejecuta este código en la consola:

```javascript
// Verificar si hay cookie de autenticación
console.log('Cookies:', document.cookie);
console.log('¿Tiene auth-token?', document.cookie.includes('auth-token'));

// Intentar hacer una petición de prueba
fetch('/api/filter-categories/upload-image', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ test: true })
})
.then(r => r.text())
.then(text => {
  console.log('Respuesta:', text);
  try {
    const json = JSON.parse(text);
    console.log('JSON parseado:', json);
  } catch(e) {
    console.log('No es JSON, respuesta completa:', text);
  }
})
.catch(e => console.error('Error:', e));
```

### 3. Verificar que Estás Logueado

```javascript
// Verificar el estado de autenticación
fetch('/api/admin/dashboard', {
  credentials: 'include'
})
.then(r => {
  console.log('Status:', r.status);
  return r.text();
})
.then(text => console.log('Respuesta dashboard:', text.substring(0, 200)))
.catch(e => console.error('Error:', e));
```

### 4. Probar Subida de Imagen Manualmente

```javascript
// Crear un FormData de prueba
const formData = new FormData();
const blob = new Blob(['test'], { type: 'image/png' });
formData.append('file', blob, 'test.png');
formData.append('categoryId', '17');
formData.append('imageType', 'carousel');

// Intentar subir
fetch('/api/filter-categories/upload-image', {
  method: 'POST',
  credentials: 'include',
  body: formData
})
.then(r => {
  console.log('Status:', r.status);
  console.log('Headers:', [...r.headers.entries()]);
  return r.text();
})
.then(text => {
  console.log('Respuesta completa:', text);
  try {
    const json = JSON.parse(text);
    console.log('JSON:', json);
  } catch(e) {
    console.log('No es JSON');
  }
})
.catch(e => console.error('Error:', e));
```

### 5. Verificar Logs del Servidor

En el VPS, ejecuta:

```bash
# Ver logs de PM2
pm2 logs starfilters-app --lines 100

# O ver logs en tiempo real
pm2 logs starfilters-app
```

Busca mensajes que empiecen con:
- `📤 Subiendo imagen de categoría`
- `❌ Error al subir imagen`
- `🔐 No se encontró token`
- `401` o `No autorizado`

## Problemas Comunes y Soluciones

### Problema 1: Error 401 (No autorizado)

**Síntomas:**
- Las peticiones devuelven status 401
- Mensaje "No autorizado" en la consola

**Soluciones:**
1. **Recargar la página e iniciar sesión nuevamente**
2. **Verificar que la cookie `auth-token` existe:**
   ```javascript
   console.log(document.cookie);
   ```
3. **Limpiar cookies y volver a iniciar sesión:**
   - Abre DevTools → Application → Cookies
   - Elimina todas las cookies del dominio
   - Recarga y vuelve a iniciar sesión

### Problema 2: Error 500 (Error del servidor)

**Síntomas:**
- Las peticiones devuelven status 500
- Error en los logs del servidor

**Soluciones:**
1. **Verificar logs del servidor:**
   ```bash
   pm2 logs starfilters-app --err
   ```
2. **Verificar que Cloudinary esté configurado:**
   ```bash
   cd ~/starfilters-app
   cat .env | grep CLOUDINARY
   ```
3. **Verificar permisos de la base de datos:**
   ```bash
   mysql -u starfilters_user -p starfilters_ecommerce_db -e "SHOW GRANTS;"
   ```

### Problema 3: La imagen se sube pero no se guarda en BD

**Síntomas:**
- El upload a Cloudinary funciona
- Pero la imagen no aparece en la tabla `filter_category_images`

**Soluciones:**
1. **Verificar que la función `saveCarouselImageToDB` se ejecute:**
   - Abre la consola y busca mensajes `💾 Guardando imagen en BD`
2. **Verificar la tabla directamente:**
   ```sql
   SELECT * FROM filter_category_images WHERE category_id = 17;
   ```
3. **Verificar que el endpoint POST `/api/filter-categories/images` funcione:**
   ```javascript
   fetch('/api/filter-categories/images', {
     method: 'POST',
     credentials: 'include',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       categoryId: 17,
       imageUrl: 'https://test.com/image.jpg',
       isPrimary: false
     })
   })
   .then(r => r.text())
   .then(text => console.log('Respuesta:', text));
   ```

### Problema 4: El botón de eliminar no funciona

**Síntomas:**
- Al hacer clic en eliminar, no pasa nada
- No aparecen mensajes en la consola

**Soluciones:**
1. **Verificar que el botón tenga el atributo `data-image-id`:**
   ```javascript
   document.querySelectorAll('.delete-carousel-btn').forEach(btn => {
     console.log('Botón:', btn, 'ID:', btn.getAttribute('data-image-id'));
   });
   ```
2. **Verificar que los event listeners estén activos:**
   - Abre la consola y busca mensajes `🖼️ [CategoryImageManager] Script iniciado`
3. **Probar eliminación manualmente:**
   ```javascript
   // Obtener el ID de una imagen
   const imageId = 123; // Reemplaza con un ID real
   
   fetch(`/api/filter-categories/images/${imageId}`, {
     method: 'DELETE',
     credentials: 'include',
     headers: { 'Content-Type': 'application/json' }
   })
   .then(r => r.text())
   .then(text => console.log('Respuesta:', text));
   ```

## Información para Reportar el Problema

Si el problema persiste, ejecuta esto y comparte los resultados:

```javascript
// Información completa del diagnóstico
const diagnostic = {
  cookies: document.cookie,
  hasAuthToken: document.cookie.includes('auth-token'),
  url: window.location.href,
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString()
};

// Probar autenticación
fetch('/api/filter-categories/upload-image', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: true })
})
.then(r => {
  diagnostic.authStatus = r.status;
  diagnostic.authHeaders = [...r.headers.entries()];
  return r.text();
})
.then(text => {
  diagnostic.authResponse = text.substring(0, 500);
  console.log('📊 DIAGNÓSTICO COMPLETO:', diagnostic);
  // Copia este objeto y compártelo
});

console.log('🔍 Iniciando diagnóstico...');
```

## Comandos Útiles en el VPS

```bash
# Ver estado de la aplicación
pm2 status

# Ver logs recientes
pm2 logs starfilters-app --lines 50

# Reiniciar aplicación
pm2 restart starfilters-app

# Verificar variables de entorno
cd ~/starfilters-app
cat .env | grep -E "DB_|CLOUDINARY|JWT"

# Verificar conexión a BD
mysql -u starfilters_user -p starfilters_ecommerce_db -e "SELECT COUNT(*) FROM filter_category_images;"

# Ver últimas imágenes agregadas
mysql -u starfilters_user -p starfilters_ecommerce_db -e "SELECT * FROM filter_category_images ORDER BY created_at DESC LIMIT 5;"
```
