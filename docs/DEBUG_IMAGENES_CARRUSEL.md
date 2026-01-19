# Guía de Debugging para Imágenes de Carrusel

## Pasos para Diagnosticar el Problema

### 1. Verificar qué hay en la Base de Datos

```bash
ssh root@72.60.228.9
cd ~/starfilters-app
./scripts/check-product-images-detail.sh 22
```

**Comparte conmigo:**
- El resultado completo del script
- Especialmente la sección "2️⃣  TODAS LAS IMÁGENES DEL PRODUCTO"
- Y la sección "3️⃣  RESUMEN ESTADÍSTICO"

### 2. Crear un Producto Nuevo y Ver los Logs

**Pasos:**
1. Actualiza el código en el VPS:
```bash
ssh root@72.60.228.9
cd ~/starfilters-app
git pull origin main
pnpm build
pm2 restart all
```

2. Abre la consola del navegador (F12 → Console) en la página de creación

3. Crea un producto nuevo con:
   - 1 imagen principal
   - 2-3 imágenes de carrusel

4. **Antes de hacer click en "Guardar"**, verifica en la consola del navegador:
   - Busca mensajes que empiecen con `🖼️`
   - Especialmente: `🖼️ Campo pending_carousel_images actualizado`
   - Y: `🖼️ Campos hidden actualizados`

5. **Después de hacer click en "Guardar"**, en el VPS ejecuta:
```bash
pm2 logs --lines 200 | grep "📷"
```

**Comparte conmigo:**
- Todos los logs del servidor que empiecen con `📷`
- Especialmente busca:
  - `📷 ===== PROCESANDO IMÁGENES DE CARRUSEL =====`
  - `📷 Campo recibido del formulario:`
  - `📷 Está vacío?`
  - `📷 Todos los campos del formulario:`
  - `📷 Procesando imagen de carrusel`

6. Después de crear, verifica en la BD:
```bash
# Primero obtén el ID del producto recién creado (de la URL de edición)
./scripts/check-product-images-detail.sh <ID_DEL_NUEVO_PRODUCTO>
```

### 3. Información que Necesito

**De la consola del navegador:**
```
🖼️ Campo pending_carousel_images actualizado: { ... }
🖼️ Campos hidden actualizados: { ... }
🖼️ Formulario siendo enviado, actualizando campos hidden...
🖼️ Valor de pending_carousel_images al enviar: { ... }
```

**De los logs del servidor:**
```
📷 ===== PROCESANDO IMÁGENES DE CARRUSEL =====
📷 Campo recibido del formulario: ...
📷 Tipo: ...
📷 Longitud del string recibido: ...
📷 Está vacío? ...
📷 Todos los campos del formulario: ...
```

**De la BD:**
- Total de imágenes
- Cuántas principales
- Cuántas de carrusel

## Posibles Problemas

1. **El campo `pending_carousel_images` está vacío**
   - El componente no está actualizando el campo hidden antes de enviar
   - Solución: Ya agregamos listener de submit, pero puede necesitar ajustes

2. **El campo llega pero está mal formateado**
   - El JSON no se puede parsear
   - Solución: Verificar formato del JSON

3. **Las imágenes se suben a Cloudinary pero no se guardan en BD**
   - Error al llamar a `addProductImage`
   - Solución: Verificar logs de errores

4. **Las imágenes se guardan pero no se cargan en edición**
   - Problema en la API `/api/products/[id]/images`
   - Solución: Verificar consulta SQL

Con esta información podré identificar exactamente dónde está el problema.
