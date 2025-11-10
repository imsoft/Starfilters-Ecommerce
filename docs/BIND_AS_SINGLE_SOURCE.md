# Bind ERP como Fuente Única de Datos - Arquitectura

## 📋 Resumen

Este documento describe la arquitectura actualizada del sistema StarFilters donde **Bind ERP es la fuente única de verdad** para todos los productos. Los productos se crean, actualizan, eliminan y consultan **exclusivamente desde Bind**, eliminando la base de datos MySQL como fuente de productos.

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                     ARQUITECTURA ACTUAL                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   Sitio Web      │
│   (Público)      │
│                  │
│  • /filtros      │ ──┐
│  • /product/[id] │   │
└──────────────────┘   │
                       │
┌──────────────────┐   │    ┌─────────────────────────────┐
│   Admin Panel    │   │    │                             │
│                  │   │    │      🔵 BIND ERP API        │
│  • Listar        │   ├───▶│   (Fuente Única)            │
│  • Crear         │   │    │                             │
│  • Editar        │   │    │  • POST /api/Products       │
│  • Eliminar      │   │    │  • GET  /api/Products       │
└──────────────────┘   │    │  • GET  /api/Products/{id}  │
                       │    │  • PUT  /api/Products       │
┌──────────────────┐   │    │  • DELETE /api/Products/{id}│
│ product-service  │   │    │                             │
│  (Intermediario) │ ──┘    └─────────────────────────────┘
└──────────────────┘

┌──────────────────┐
│   MySQL          │
│                  │
│  • orders        │  ✅ Sigue activo para órdenes
│  • users         │  ✅ Sigue activo para usuarios
│  • blog_posts    │  ✅ Sigue activo para blog
│  • admin_users   │  ✅ Sigue activo para admins
│  • products      │  ⚠️  YA NO SE USA (legacy)
└──────────────────┘
```

## 📂 Estructura de Archivos

### Servicios Principales

#### 1. `/src/lib/product-service.ts` ⭐ **NUEVO**

**Propósito**: Servicio intermedio que convierte datos entre Bind y el formato local.

**Funciones Principales**:

```typescript
// Obtener productos
getAllProducts(options?: GetProductsOptions): Promise<Product[]>
getProductByBindId(bindId: string): Promise<Product | null>
getActiveProducts(): Promise<Product[]>
getProductsByCategory(category: string): Promise<Product[]>
searchProducts(searchTerm: string, category?: string): Promise<Product[]>

// CRUD
createProduct(productData: Partial<Product>): Promise<string | null>
updateProduct(bindId: string, productData: Partial<Product>): Promise<boolean>
deleteProduct(bindId: string): Promise<boolean>

// Utilidades
bindProductToLocal(bindProduct: BindProduct): Product
localProductToBind(product: Partial<Product>): BindProduct
getProductStats(): Promise<{...}>
```

#### 2. `/src/lib/bind.ts`

**Propósito**: Cliente HTTP de bajo nivel para la API de Bind.

**Funciones**:
- `createBindProduct()` - POST /api/Products
- `getBindProducts()` - GET /api/Products
- `getBindProductById()` - GET /api/Products/{id}
- `updateBindProduct()` - PUT /api/Products
- `deleteBindProduct()` - DELETE /api/Products/{id}
- `syncBindProduct()` - Crear o actualizar inteligentemente
- `checkBindConnection()` - Verificar conectividad

#### 3. `/src/lib/database.ts`

**Propósito**: Manejo de MySQL para órdenes, usuarios, blog, etc.

**⚠️ Importante**: Las funciones de productos (`getProducts`, `createProduct`, `updateProduct`, etc.) ya **NO se usan** en la nueva arquitectura.

## 🔄 Flujo de Datos

### Crear Producto

```
Usuario en Admin
       │
       ▼
/admin/products/add
       │
       ▼
product-service.createProduct()
       │
       ▼
bind.createBindProduct()
       │
       ▼
POST /api/Products → Bind ERP
       │
       ▼
Retorna bind_id
       │
       ▼
Redirect a /admin/products?success=created
```

### Editar Producto

```
Usuario en Admin
       │
       ▼
/admin/products/edit/[bind_id]
       │
       ▼
product-service.getProductByBindId(bind_id)
       │
       ▼
GET /api/Products/{id} → Bind ERP
       │
       ▼
Muestra formulario con datos
       │
       ▼
Usuario edita y guarda
       │
       ▼
product-service.updateProduct(bind_id, data)
       │
       ▼
PUT /api/Products → Bind ERP
       │
       ▼
Redirect a /admin/products?success=updated
```

### Listar Productos (Sitio Público)

```
Usuario visita /filtros
       │
       ▼
product-service.getActiveProducts()
       │
       ▼
bind.getBindProducts({ isActive: true })
       │
       ▼
GET /api/Products?isActive=true → Bind ERP
       │
       ▼
Bind devuelve productos activos
       │
       ▼
Conversión: bindProductToLocal()
       │
       ▼
Renderiza lista de productos
```

### Ver Detalle de Producto

```
Usuario hace clic en producto
       │
       ▼
/product/[bind_id]
       │
       ▼
product-service.getProductByBindId(bind_id)
       │
       ▼
GET /api/Products/{id} → Bind ERP
       │
       ▼
Bind devuelve producto
       │
       ▼
Conversión: bindProductToLocal()
       │
       ▼
Renderiza página de detalle
```

## 🗺️ Mapeo de Datos

### Bind → Local (bindProductToLocal)

| Campo Bind          | Campo Local       | Tipo          | Notas                          |
|---------------------|-------------------|---------------|--------------------------------|
| `id`                | `bind_id`         | string        | ID único en Bind               |
| `title`             | `name`            | string        | Nombre del producto            |
| `description`       | `description`     | string        | Descripción                    |
| `price`             | `price`           | number        | Precio en MXN                  |
| `inventory`         | `stock`           | number        | Cantidad disponible            |
| `category`          | `category`        | string        | Categoría                      |
| `isActive`          | `status`          | boolean→enum  | true='active', false='inactive'|
| `code` o `sku`      | `uuid`            | string        | Código del producto            |
| `customFields.*`    | Campos adicionales| object        | name_en, dimensions, etc.      |

### Local → Bind (localProductToBind)

| Campo Local        | Campo Bind          | Transformación                |
|--------------------|---------------------|-------------------------------|
| `name`             | `title`             | Directo                       |
| `description`      | `description`       | Directo                       |
| `price`            | `price`             | Directo                       |
| `stock`            | `inventory`         | Directo                       |
| `category`         | `category`          | Directo                       |
| `status`           | `isActive`          | 'active' → true, otros → false|
| `uuid`             | `sku`               | Directo                       |
| `name_en`          | `customFields.name_en` | En objeto anidado          |
| `dimensions`       | `customFields.dimensions` | En objeto anidado       |
| `weight`           | `customFields.weight` | En objeto anidado            |
| `material`         | `customFields.material` | En objeto anidado          |
| `warranty`         | `customFields.warranty` | En objeto anidado          |
| `tags`             | `tags[]`            | Split por comas               |

## 📄 Páginas Actualizadas

### Sitio Público

#### 1. `/src/pages/filtros/index.astro`
**Cambios**:
```diff
- import { getProducts } from "@/lib/database";
+ import { getActiveProducts } from "@/lib/product-service";

- const products = await getProducts(12, 0);
+ const products = await getActiveProducts();

- <a href={`/product/${product.uuid}`}>
+ <a href={`/product/${product.bind_id}`}>
```

#### 2. `/src/pages/product/[id]/index.astro`
**Cambios**:
```diff
- import { getProductByUuid } from "@/lib/database";
+ import { getProductByBindId, getActiveProducts } from "@/lib/product-service";

- const { id: uuid } = Astro.params;
- const product = await getProductByUuid(uuid);
+ const { id: bindId } = Astro.params;
+ const product = await getProductByBindId(bindId);
```

### Admin Panel

#### 3. `/src/pages/admin/products/index.astro`
**Cambios**:
```diff
- import { getProducts } from "@/lib/database";
+ import { getAllProducts } from "@/lib/product-service";

- allProducts = await getProducts(100, 0);
+ allProducts = await getAllProducts({ pageSize: 100 });

- <a href={`/admin/products/edit/${product.uuid}`}>
+ <a href={`/admin/products/edit/${product.bind_id}`}>
```

#### 4. `/src/pages/admin/products/add/index.astro`
**Cambios**:
```diff
- import { createProduct } from "@/lib/database";
+ import { createProduct } from "@/lib/product-service";

- const productId = await createProduct(productData);
- // Luego sincronizar con Bind...
+ const bindId = await createProduct(productData);
+ // Ya se creó directo en Bind
```

#### 5. `/src/pages/admin/products/edit/[id]/index.astro`
**Cambios**:
```diff
- import { getProductByUuid, updateProduct } from "@/lib/database";
+ import { getProductByBindId, updateProduct } from "@/lib/product-service";

- const { id } = Astro.params;
- product = await getProductByUuid(id);
+ const { id: bindId } = Astro.params;
+ product = await getProductByBindId(bindId);

- await updateProduct(product.id, productData);
- // Luego sincronizar con Bind...
+ await updateProduct(product.bind_id!, productData);
+ // Ya se actualizó directo en Bind
```

## 🔧 Configuración

### Variables de Entorno

```env
# API de Bind ERP
BIND_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Token expira**: 2025-08-01

### Constantes en Código

En `/src/lib/bind.ts`:
```typescript
const BIND_API_BASE_URL = 'https://api.bind.com.mx';
const BIND_API_TOKEN = import.meta.env.BIND_TOKEN;
```

## ✅ Ventajas de esta Arquitectura

1. **Fuente Única de Verdad**: Bind es el único lugar donde viven los productos
2. **Sin Sincronización**: No hay problemas de sincronización entre sistemas
3. **Datos Actualizados**: Siempre se obtienen los datos más recientes de Bind
4. **Escalabilidad**: Bind maneja el almacenamiento y lógica de inventario
5. **Simplicidad**: Menos código, menos bugs, menos mantenimiento
6. **Integración Total**: Si actualizas en Bind directamente, se refleja automáticamente

## ⚠️ Consideraciones Importantes

### Rendimiento

- **Latencia**: Cada consulta hace una llamada HTTP a Bind
- **Solución**: Implementar caché si es necesario (Redis, en memoria, etc.)
- **Recomendación**: Usar paginación en listas largas

### Disponibilidad

- **Dependencia**: Si Bind está caído, los productos no están disponibles
- **Solución actual**: Los errores se manejan gracefully, devolviendo arrays vacíos
- **Mejora futura**: Implementar caché de respaldo

### Imágenes

- **Actual**: Se usan placeholders basados en categoría
- **Futuro**: Subir imágenes a Bind usando `POST /api/Products/{id}/image`

### Migración de Datos

La tabla `products` en MySQL ya no se usa. Si tienes productos antiguos:

```sql
-- Ver productos que no están en Bind
SELECT * FROM products WHERE bind_id IS NULL;

-- Eliminar tabla de productos (opcional, después de migrar)
-- DROP TABLE products;
```

## 🚀 Próximos Pasos

### Corto Plazo

1. **Migrar productos existentes**: Crear script para subir productos de MySQL a Bind
2. **Implementar caché**: Redis o similar para reducir llamadas a API
3. **Subir imágenes**: Integrar con el endpoint de imágenes de Bind
4. **Manejo de errores**: Mejorar UI cuando Bind no está disponible

### Mediano Plazo

1. **Webhooks**: Recibir notificaciones de Bind cuando cambien productos
2. **Búsqueda avanzada**: Aprovechar filtros de Bind API
3. **Bulk operations**: Crear/actualizar múltiples productos a la vez
4. **Analytics**: Integrar estadísticas de Bind con el dashboard

### Largo Plazo

1. **Sincronización bidireccional con caché**: Caché local + sync en background
2. **Offline mode**: Permitir operaciones cuando Bind no está disponible
3. **Multi-almacén**: Soporte para múltiples ubicaciones de Bind

## 🧪 Testing

### Verificar Conexión

```typescript
import { checkBindConnection } from '@/lib/bind';

const isConnected = await checkBindConnection();
console.log('Bind conectado:', isConnected);
```

### Crear Producto de Prueba

```typescript
import { createProduct } from '@/lib/product-service';

const newProduct = await createProduct({
  name: 'Producto de Prueba',
  description: 'Descripción de prueba',
  price: 100,
  stock: 5,
  category: 'filtros',
  status: 'active',
});

console.log('Bind ID:', newProduct);
```

### Listar Productos

```typescript
import { getAllProducts } from '@/lib/product-service';

const products = await getAllProducts({ pageSize: 10 });
console.log(`${products.length} productos en Bind`);
```

## 📊 Comparación: Antes vs Ahora

### Antes (Dual Source)

```
Crear Producto:
1. Guardar en MySQL
2. Sincronizar con Bind
3. Actualizar MySQL con bind_id
4. Manejar conflictos de sincronización
5. ¿Qué pasa si Bind falla?
```

### Ahora (Single Source)

```
Crear Producto:
1. Guardar en Bind
2. Retornar bind_id
3. ✅ Listo
```

## 🔍 Troubleshooting

### Los productos no aparecen

1. Verificar que Bind esté conectado:
   ```bash
   curl -H "apiKey: $BIND_TOKEN" https://api.bind.com.mx/api/Products
   ```

2. Ver logs del servidor:
   ```
   🔍 Obteniendo productos desde Bind ERP...
   ✅ X productos obtenidos de Bind
   ```

3. Verificar que los productos estén activos en Bind

### Error al crear producto

1. Verificar campos requeridos: `name`, `description`, `price`
2. Ver respuesta de error de Bind en logs
3. Verificar que el token no haya expirado

### Productos no se actualizan

1. Verificar que el `bind_id` sea correcto
2. Ver logs: `📝 Actualizando producto en Bind: [ID]`
3. Confirmar en Bind directamente que se actualizó

## 📚 Recursos

- **Bind API Docs**: https://developers.bind.com.mx/
- **Código fuente producto-service**: `/src/lib/product-service.ts`
- **Código fuente bind**: `/src/lib/bind.ts`
- **Documentación anterior**: `/docs/BIND_INTEGRATION.md`

---

**Última actualización**: 2025-01-09
**Versión**: 2.0 - Bind como Fuente Única
