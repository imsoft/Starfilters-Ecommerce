# Integración con Bind ERP - Documentación

## Descripción General

Esta integración permite sincronizar automáticamente los productos de StarFilters con Bind ERP, un sistema de gestión empresarial. La sincronización es bidireccional y se ejecuta automáticamente cuando se crean o actualizan productos desde el panel de administración.

## Configuración

### 1. Variables de Entorno

Asegúrate de tener configurada la siguiente variable en tu archivo `.env`:

```env
BIND_TOKEN=tu_token_jwt_de_bind_aquí
```

El token ya está configurado en el proyecto y expira el **2025-08-01**.

### 2. Migración de Base de Datos

Ejecuta el siguiente script SQL para agregar el campo `bind_id` a la tabla de productos:

```bash
# Conectar a MySQL y ejecutar:
mysql -u [usuario] -p [base_de_datos] < database/add_bind_id_to_products.sql
```

O ejecuta manualmente en phpMyAdmin:

```sql
ALTER TABLE products
ADD COLUMN bind_id VARCHAR(100) NULL AFTER uuid,
ADD INDEX idx_bind_id (bind_id);
```

## Arquitectura de la Integración

### Archivos Principales

1. **`/src/lib/bind.ts`** - Servicio principal de integración con Bind API
2. **`/src/pages/admin/products/add/index.astro`** - Formulario de creación con sincronización
3. **`/src/pages/admin/products/edit/[id]/index.astro`** - Formulario de edición con sincronización
4. **`/database/add_bind_id_to_products.sql`** - Migración para agregar campo bind_id

### Flujo de Sincronización

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREAR PRODUCTO                                │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
         ┌──────────────────────────────────────┐
         │  Usuario llena formulario admin      │
         │  /admin/products/add                 │
         └──────────────────────────────────────┘
                             │
                             ▼
         ┌──────────────────────────────────────┐
         │  1. Crear producto en MySQL          │
         │     (createProduct)                  │
         └──────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │   ¿Es activo?   │
                    └────────┬────────┘
                         Yes │ No → Fin
                             ▼
         ┌──────────────────────────────────────┐
         │  2. Sincronizar con Bind ERP         │
         │     POST /api/Products               │
         │     (createBindProduct)              │
         └──────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │   ¿Éxito?       │
                    └────────┬────────┘
                         Yes │ No → Warning (continúa)
                             ▼
         ┌──────────────────────────────────────┐
         │  3. Guardar bind_id en MySQL         │
         │     UPDATE products                  │
         │     SET bind_id = ?                  │
         └──────────────────────────────────────┘
                             │
                             ▼
                    ✅ Producto creado
                    y sincronizado

┌─────────────────────────────────────────────────────────────────┐
│                   ACTUALIZAR PRODUCTO                            │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
         ┌──────────────────────────────────────┐
         │  Usuario edita producto              │
         │  /admin/products/edit/[id]           │
         └──────────────────────────────────────┘
                             │
                             ▼
         ┌──────────────────────────────────────┐
         │  1. Actualizar en MySQL              │
         │     (updateProduct)                  │
         └──────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │   ¿Es activo?   │
                    └────────┬────────┘
                         Yes │ No → Fin
                             ▼
         ┌──────────────────────────────────────┐
         │  2. Sincronizar con Bind             │
         │     (syncBindProduct)                │
         └──────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │ ¿Tiene bind_id? │
                    └────────┬────────┘
              Yes            │            No
               │             │             │
               ▼             │             ▼
    PUT /api/Products        │    POST /api/Products
    (actualizar)             │    (crear nuevo)
               │             │             │
               └─────────────┴─────────────┘
                             │
                             ▼
                    ✅ Producto actualizado
                    y sincronizado
```

## API de Bind - Endpoints Utilizados

### Base URL
```
https://api.bind.com.mx
```

### Autenticación
Todas las peticiones requieren el header `apiKey`:

```javascript
headers: {
  'Content-Type': 'application/json',
  'apiKey': BIND_TOKEN,
  'Accept': 'application/json'
}
```

### Endpoints

#### 1. Crear Producto
```
POST /api/Products
```

**Request Body:**
```json
{
  "title": "Filtro HEPA Premium",
  "description": "Filtro de alta eficiencia...",
  "price": 1500.00,
  "inventory": 10,
  "sku": "FHP-001",
  "category": "Filtros",
  "isActive": true,
  "customFields": {
    "name_en": "Premium HEPA Filter",
    "description_en": "High efficiency filter...",
    "dimensions": "30x20x15 cm",
    "weight": "2.5 kg"
  }
}
```

**Response:**
```json
{
  "id": "123456",
  "title": "Filtro HEPA Premium",
  "code": "BIND-123456",
  ...
}
```

#### 2. Obtener Productos
```
GET /api/Products?page=1&pageSize=50
```

**Response:**
```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 150,
    "totalPages": 3
  }
}
```

#### 3. Obtener Producto por ID
```
GET /api/Products/{id}
```

#### 4. Actualizar Producto
```
PUT /api/Products
```

**Request Body:**
```json
{
  "id": "123456",
  "title": "Filtro HEPA Premium - Actualizado",
  "price": 1600.00,
  ...
}
```

#### 5. Eliminar Producto
```
DELETE /api/Products/{id}
```

## Uso de las Funciones

### Importar el servicio

```typescript
import {
  createBindProduct,
  getBindProductById,
  getBindProducts,
  updateBindProduct,
  deleteBindProduct,
  syncBindProduct,
  checkBindConnection
} from '@/lib/bind';
```

### Crear un producto

```typescript
const bindResult = await createBindProduct({
  title: 'Producto de prueba',
  description: 'Descripción del producto',
  price: 1000,
  inventory: 5,
  category: 'Filtros',
  isActive: true
});

if (bindResult.success) {
  const bindId = bindResult.data.id;
  console.log('Producto creado en Bind:', bindId);
} else {
  console.error('Error:', bindResult.error);
}
```

### Obtener productos

```typescript
const result = await getBindProducts({
  page: 1,
  pageSize: 20,
  search: 'HEPA',
  category: 'Filtros'
});

if (result.success) {
  console.log('Productos:', result.data);
  console.log('Total:', result.pagination?.totalItems);
}
```

### Sincronizar (crear o actualizar)

```typescript
// Si bind_id existe, actualiza; si no, crea
const result = await syncBindProduct(product.bind_id || null, {
  title: product.name,
  description: product.description,
  price: product.price,
  inventory: product.stock
});
```

### Verificar conexión

```typescript
const isConnected = await checkBindConnection();
if (isConnected) {
  console.log('Conexión exitosa con Bind API');
}
```

## Mapeo de Campos

| Campo StarFilters    | Campo Bind         | Tipo      | Notas                                |
|---------------------|--------------------|-----------|--------------------------------------|
| `name`              | `title`            | string    | Requerido                            |
| `description`       | `description`      | string    | Opcional                             |
| `price`             | `price`            | number    | Precio en pesos                      |
| `stock`             | `inventory`        | number    | Cantidad disponible                  |
| `category`          | `category`         | string    | Categoría del producto               |
| `uuid`              | `sku`              | string    | Código único (se genera auto)        |
| `status`            | `isActive`         | boolean   | active → true, otros → false         |
| `bind_id`           | `id`               | string    | ID del producto en Bind              |
| `name_en`           | `customFields.*`   | object    | Campos adicionales en inglés         |
| `dimensions`        | `customFields.*`   | object    | Especificaciones técnicas            |
| `weight`            | `customFields.*`   | object    | Especificaciones técnicas            |
| `material`          | `customFields.*`   | object    | Especificaciones técnicas            |
| `warranty`          | `customFields.*`   | object    | Especificaciones técnicas            |

## Comportamiento de Sincronización

### ✅ Se sincroniza cuando:
- Se crea un producto con estado "activo"
- Se actualiza un producto que está en estado "activo"
- El producto pasa de "borrador" a "activo"

### ⏭️ NO se sincroniza cuando:
- Se crea un producto como "borrador"
- Se actualiza un producto en estado "inactivo"
- Se actualiza un producto en estado "borrador"

### 🔄 Sincronización automática:
La sincronización es **automática** al:
1. Crear producto desde `/admin/products/add`
2. Editar producto desde `/admin/products/edit/[id]`

### ⚠️ Manejo de errores:
- Si la sincronización con Bind falla, **NO se cancela** la operación local
- Se muestra un warning en los logs
- El producto se guarda en MySQL de todas formas
- Se puede reintentar la sincronización después

## Eliminar Productos

⚠️ **Importante:** Actualmente NO hay una interfaz de usuario para eliminar productos.

Si necesitas implementar la eliminación con sincronización:

```typescript
// Ejemplo de implementación
const deleteProductWithSync = async (productId: number, bindId: string | null) => {
  // 1. Eliminar de Bind si existe bind_id
  if (bindId) {
    const bindResult = await deleteBindProduct(bindId);
    if (!bindResult.success) {
      console.warn('No se pudo eliminar de Bind:', bindResult.error);
    }
  }

  // 2. Eliminar de MySQL
  const { deleteProduct } = await import('@/lib/database');
  const success = await deleteProduct(productId);

  return success;
};
```

## Logs y Debugging

La integración incluye logs detallados en consola:

```
🔍 Bind API GET: https://api.bind.com.mx/api/Products?page=1&pageSize=50
📤 Bind API POST: https://api.bind.com.mx/api/Products
📝 Bind API PUT: https://api.bind.com.mx/api/Products
🗑️ Bind API DELETE: https://api.bind.com.mx/api/Products/123
✅ Producto sincronizado con Bind: 123456
⚠️ No se pudo sincronizar con Bind: Error message
❌ Bind API Error: {...}
```

## Testing

### Verificar conexión

```bash
# Desde la consola del navegador en /admin/products
import { checkBindConnection } from '@/lib/bind';
await checkBindConnection();
```

### Probar creación

1. Ir a `/admin/products/add`
2. Llenar formulario con datos válidos
3. Seleccionar estado "Activo"
4. Guardar
5. Verificar en logs del navegador: `✅ Producto sincronizado con Bind: [ID]`
6. Verificar en MySQL que se guardó el `bind_id`

### Probar actualización

1. Ir a `/admin/products/edit/[uuid]`
2. Modificar campos
3. Guardar
4. Verificar en logs: `✅ Producto sincronizado con Bind`

## Troubleshooting

### Error: "apiKey header is missing"
- Verificar que `BIND_TOKEN` esté en `.env`
- Verificar que el servidor esté reiniciado después de cambiar `.env`

### Error: "401 Unauthorized"
- El token JWT puede haber expirado (expira 2025-08-01)
- Solicitar nuevo token a Bind ERP

### Error: "bind_id column doesn't exist"
- Ejecutar la migración: `database/add_bind_id_to_products.sql`

### Los productos no se sincronizan
- Verificar que el producto esté en estado "activo"
- Revisar logs de consola del navegador
- Verificar conectividad con API de Bind usando `checkBindConnection()`

### Error de TypeScript en import.meta.env
- Asegurarse de usar `import.meta.env.BIND_TOKEN` en archivos `.ts` dentro de `/src`
- Usar `process.env.BIND_TOKEN` solo en archivos de configuración de Node.js

## Próximos Pasos

### Mejoras sugeridas:

1. **Panel de sincronización manual**
   - Crear página para re-sincronizar productos existentes
   - Mostrar estado de sincronización de cada producto

2. **Sincronización de imágenes**
   - Subir imágenes de productos a Bind
   - Usar endpoint `GET /api/Products/{id}/image`

3. **Webhooks**
   - Recibir notificaciones de Bind cuando cambien productos
   - Actualizar automáticamente MySQL

4. **Batch sync**
   - Sincronizar múltiples productos a la vez
   - Útil para migraciones iniciales

5. **UI de eliminación**
   - Implementar botón de eliminar en lista de productos
   - Agregar confirmación
   - Sincronizar eliminación con Bind

## Documentación de Bind ERP

- Portal de desarrolladores: https://developers.bind.com.mx/
- API Reference: https://developers.bind.com.mx/api-details
- SDK Python: https://github.com/Bind-ERP/BindERP-Python
- SDK C#: https://github.com/Bind-ERP/BindERP-CSharp

## Soporte

Para problemas con la API de Bind ERP:
- Consultar documentación oficial
- Contactar soporte de Bind ERP
- Verificar estado del servicio

Para problemas con la integración en este proyecto:
- Revisar logs del servidor
- Verificar configuración de variables de entorno
- Comprobar que las migraciones se hayan ejecutado correctamente
