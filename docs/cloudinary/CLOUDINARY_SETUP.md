# Configuración de Cloudinary

Esta guía te ayudará a configurar Cloudinary para gestionar todas las imágenes del proyecto.

## 1. Crear cuenta en Cloudinary

1. Ve a [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Crea una cuenta gratuita
3. Una vez dentro, ve al Dashboard

## 2. Obtener credenciales

En el Dashboard de Cloudinary encontrarás:

- **Cloud Name**: Tu nombre de cloud único
- **API Key**: Tu clave API
- **API Secret**: Tu secreto API (haz clic en "Show" para verlo)

## 3. Configurar variables de entorno

Agrega estas variables a tu archivo `.env.local`:

```env
# Configuración de Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name_aqui
CLOUDINARY_API_KEY=tu_api_key_aqui
CLOUDINARY_API_SECRET=tu_api_secret_aqui
```

## 4. Estructura de carpetas en Cloudinary

El proyecto está configurado para organizar las imágenes de la siguiente manera:

```
starfilters-ecommerce/
├── productos/
│   ├── {product-uuid}/
│   │   └── imagenes/
│   │       ├── main-image.jpg
│   │       ├── gallery-1.jpg
│   │       └── gallery-2.jpg
├── blog/
│   ├── {blog-uuid}/
│   │   ├── featured-image.jpg
│   │   └── content-image-1.jpg
├── users/
│   ├── {user-uuid}/
│   │   └── avatar.jpg
└── general/
    ├── logos/
    │   └── logo.png
    └── banners/
        └── banner-home.jpg
```

## 5. Uso del componente ImageUploader

### En un formulario de producto:

```tsx
import ImageUploader from '@/components/ui/ImageUploader';

// En tu componente
const [imageUrl, setImageUrl] = useState('');

<ImageUploader
  type="product"
  entityId={productUuid}
  currentImageUrl={imageUrl}
  onImageUploaded={(url) => setImageUrl(url)}
  label="Subir imagen del producto"
  maxSize={5}
/>
```

### En un formulario de blog:

```tsx
<ImageUploader
  type="blog"
  entityId={blogUuid}
  currentImageUrl={featuredImage}
  onImageUploaded={(url) => setFeaturedImage(url)}
  label="Subir imagen destacada"
  maxSize={5}
/>
```

### Para imágenes generales (logos, banners):

```tsx
<ImageUploader
  type="general"
  entityId="unique-id"
  category="logos"
  currentImageUrl={logoUrl}
  onImageUploaded={(url) => setLogoUrl(url)}
  label="Subir logo"
  maxSize={2}
/>
```

## 6. Uso de las funciones de Cloudinary

### Subir imagen de producto:

```typescript
import { uploadProductImage } from '@/lib/cloudinary';

const imageUrl = await uploadProductImage(
  fileBuffer,
  productUuid,
  'main-image'
);
```

### Subir imagen de blog:

```typescript
import { uploadBlogImage } from '@/lib/cloudinary';

const imageUrl = await uploadBlogImage(
  fileBuffer,
  blogUuid,
  'featured-image'
);
```

### Obtener URL optimizada:

```typescript
import { getOptimizedUrl } from '@/lib/cloudinary';

const optimizedUrl = getOptimizedUrl(publicId, {
  width: 800,
  height: 600,
  quality: 'auto',
  format: 'auto'
});
```

### Eliminar imagen:

```typescript
import { deleteImage, getPublicIdFromUrl } from '@/lib/cloudinary';

const publicId = getPublicIdFromUrl(imageUrl);
await deleteImage(publicId);
```

## 7. Endpoint API

El proyecto incluye un endpoint API para subir imágenes:

**POST** `/api/upload-image`

**FormData:**
- `file`: Archivo de imagen
- `type`: Tipo de imagen ('product', 'blog', 'user', 'general')
- `entityId`: ID de la entidad (UUID del producto, blog, etc.)
- `imageName`: (Opcional) Nombre personalizado para la imagen
- `category`: (Requerido solo para type='general') Categoría de la imagen

**Respuesta exitosa:**
```json
{
  "success": true,
  "imageUrl": "https://res.cloudinary.com/...",
  "message": "Imagen subida exitosamente"
}
```

## 8. Características incluidas

✅ **Organización automática**: Las imágenes se organizan automáticamente en carpetas según su tipo
✅ **Optimización automática**: Las imágenes se optimizan automáticamente (quality: auto, format: auto)
✅ **Preview en tiempo real**: El componente muestra un preview antes y después de subir
✅ **Validación de tamaño**: Valida el tamaño máximo del archivo
✅ **Validación de tipo**: Solo acepta archivos de imagen
✅ **Manejo de errores**: Muestra mensajes de error claros al usuario
✅ **Loading states**: Muestra estados de carga durante la subida
✅ **Eliminación de imágenes**: Permite eliminar imágenes de Cloudinary

## 9. Límites del plan gratuito

El plan gratuito de Cloudinary incluye:
- 25 créditos mensuales
- 25 GB de almacenamiento
- 25 GB de ancho de banda mensual

Esto es suficiente para desarrollo y proyectos pequeños.

## 10. Mejores prácticas

1. **Usa UUIDs**: Siempre usa UUIDs para los IDs de entidades
2. **Nombres descriptivos**: Usa nombres descriptivos para las imágenes
3. **Elimina imágenes antiguas**: Cuando actualices una imagen, elimina la anterior
4. **Optimiza antes de subir**: Considera optimizar imágenes muy grandes antes de subirlas
5. **Usa transformaciones**: Aprovecha las transformaciones de Cloudinary para diferentes tamaños

## 11. Solución de problemas

### Error: "Invalid API credentials"
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que no haya espacios extra en las credenciales

### Error: "File too large"
- Verifica el tamaño máximo configurado en el componente
- Considera comprimir la imagen antes de subirla

### Las imágenes no se muestran
- Verifica que la URL esté correctamente guardada en la base de datos
- Asegúrate de que las imágenes sean públicas en Cloudinary

## 12. Soporte

Para más información, consulta la documentación oficial:
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)

