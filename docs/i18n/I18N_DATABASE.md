# Internacionalización de Base de Datos

## 📋 Campos Agregados

### Tabla `products`
- `name_en` - Nombre del producto en inglés
- `description_en` - Descripción del producto en inglés
- `category_en` - Categoría del producto en inglés

### Tabla `blog_posts`
- `title_en` - Título del artículo en inglés
- `slug_en` - Slug del artículo en inglés (para URLs)
- `content_en` - Contenido del artículo en inglés
- `excerpt_en` - Extracto del artículo en inglés
- `meta_title_en` - Meta título en inglés
- `meta_description_en` - Meta descripción en inglés

## 🔄 Cómo Usar las Traducciones

### Ejemplo: Obtener Productos con Traducción

```typescript
import { getLangFromUrl } from '@/i18n/utils';

// En tu página o componente
const lang = getLangFromUrl(Astro.url);
const isEnglish = lang === 'en';

// Obtener productos
const products = await getProducts();

// Usar el campo correcto según el idioma
const product = products[0];

const name = isEnglish && product.name_en ? product.name_en : product.name;
const description = isEnglish && product.description_en ? product.description_en : product.description;
const category = isEnglish && product.category_en ? product.category_en : product.category;
```

### Ejemplo: Crear Producto con Traducción

```sql
INSERT INTO products (
    uuid, name, name_en, 
    description, description_en,
    category, category_en,
    price, stock, status
) VALUES (
    UUID(),
    'Filtro de Aire Premium',          -- Español
    'Premium Air Filter',               -- Inglés
    'Filtro de aire de alta calidad',  -- Español
    'High quality air filter',          -- Inglés
    'Filtros de Aire',                  -- Español
    'Air Filters',                      -- Inglés
    29.99, 50, 'active'
);
```

### Ejemplo: Obtener Blog Posts con Traducción

```typescript
const lang = getLangFromUrl(Astro.url);
const isEnglish = lang === 'en';

// Obtener posts del blog
const blogPosts = await getAllBlogPosts();

// Seleccionar slug según idioma
blogPosts.forEach(post => {
    const slug = isEnglish && post.slug_en ? post.slug_en : post.slug;
    const title = isEnglish && post.title_en ? post.title_en : post.title;
    const content = isEnglish && post.content_en ? post.content_en : post.content;
    
    console.log(`/${slug}`, title, content);
});
```

## 🎯 Estrategia de Fallback

Si el campo en inglés está vacío (NULL), automáticamente usa el campo en español:

```typescript
const name = product.name_en || product.name;  // Usa inglés si existe, sino español
```

O con validación:

```typescript
const name = isEnglish 
    ? (product.name_en || product.name)  // Intenta inglés primero
    : product.name;                       // Sino español
```

## 📝 Crear Contenido Traducible

### Opción 1: Desde el Panel de Administración

1. **Productos**: Al crear/editar un producto, completar campos en español e inglés
2. **Blog**: Al crear un artículo, incluir título y contenido en ambos idiomas

### Opción 2: Desde la Base de Datos

```sql
-- Ejemplo: Actualizar producto existente
UPDATE products 
SET 
    name_en = 'Premium Air Filter',
    description_en = 'High quality air filter for better engine performance',
    category_en = 'Air Filters'
WHERE id = 1;
```

## 🚀 Ventajas de este Enfoque

✅ **Simplicidad**: No requiere tablas adicionales de traducciones
✅ **Rendimiento**: Acceso directo a los datos sin JOINs adicionales
✅ **Mantenibilidad**: Fácil de entender y mantener
✅ **Escalabilidad**: Puedes agregar más idiomas en el futuro (ej: `name_fr`, `name_de`)

## 🔮 Futuras Mejoras

Si necesitas más de 2 idiomas en el futuro, considera:
1. Crear una tabla de traducciones separada
2. Usar campos JSON para almacenar múltiples idiomas

## 📞 Soporte

Para preguntas o problemas, consulta:
- `database/add_i18n_to_products_and_blog.sql` - Script SQL original
- `scripts/add-i18n-fields.js` - Script de migración
