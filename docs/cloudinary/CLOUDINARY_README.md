# 📸 Sistema de Gestión de Imágenes con Cloudinary

## ✅ Instalación Completada

Cloudinary ha sido instalado y configurado exitosamente en tu proyecto. Ahora todas las imágenes se subirán y gestionarán automáticamente en Cloudinary con una estructura organizada.

## 🗂️ Estructura de Carpetas

Todas las imágenes se organizan automáticamente en Cloudinary siguiendo esta estructura:

```
starfilters-ecommerce/
├── products/{product-uuid}/
│   ├── main-image.jpg
│   ├── gallery-1.jpg
│   └── gallery-2.jpg
├── blog/{blog-uuid}/
│   ├── featured-image.jpg
│   └── content-image.jpg
├── users/{user-uuid}/
│   └── avatar.jpg
└── general/
    ├── logos/logo.png
    └── banners/banner.jpg
```

## 🚀 Configuración Rápida

### 1. Obtener credenciales de Cloudinary

1. Ve a [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Crea una cuenta gratuita
3. En el Dashboard, copia:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 2. Configurar variables de entorno

Agrega estas líneas a tu archivo `.env.local`:

```env
# Configuración de Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name_aqui
CLOUDINARY_API_KEY=tu_api_key_aqui
CLOUDINARY_API_SECRET=tu_api_secret_aqui
```

### 3. Reiniciar el servidor

```bash
pnpm dev
```

## 📦 Archivos Creados

### Librería Principal
- `src/lib/cloudinary.ts` - Funciones principales para subir y gestionar imágenes

### Componente React
- `src/components/ui/ImageUploader.tsx` - Componente reutilizable para subir imágenes

### API Endpoint
- `src/pages/api/upload-image.ts` - Endpoint para procesar subidas de imágenes

### Documentación
- `docs/CLOUDINARY_SETUP.md` - Guía completa de configuración
- `docs/CLOUDINARY_EXAMPLES.md` - Ejemplos de uso

## 🎯 Uso Básico

### En un formulario de producto:

```tsx
import ImageUploader from '@/components/ui/ImageUploader';

<ImageUploader
  type="product"
  entityId={productUuid}
  onImageUploaded={(url) => setImageUrl(url)}
  label="Subir imagen del producto"
/>
```

### En un formulario de blog:

```tsx
<ImageUploader
  type="blog"
  entityId={blogUuid}
  onImageUploaded={(url) => setFeaturedImage(url)}
  label="Subir imagen destacada"
/>
```

### Para avatares de usuario:

```tsx
<ImageUploader
  type="user"
  entityId={userId}
  onImageUploaded={(url) => setAvatar(url)}
  label="Cambiar foto de perfil"
  maxSize={2}
/>
```

## 🔧 Funciones Disponibles

### Subir Imágenes

```typescript
import { 
  uploadProductImage, 
  uploadBlogImage, 
  uploadUserImage, 
  uploadGeneralImage 
} from '@/lib/cloudinary';

// Subir imagen de producto
const url = await uploadProductImage(buffer, productId, 'main-image');

// Subir imagen de blog
const url = await uploadBlogImage(buffer, blogId, 'featured');

// Subir avatar de usuario
const url = await uploadUserImage(buffer, userId, 'avatar');

// Subir imagen general
const url = await uploadGeneralImage(buffer, 'logos', 'logo-principal');
```

### Optimizar Imágenes

```typescript
import { getOptimizedUrl } from '@/lib/cloudinary';

const optimizedUrl = getOptimizedUrl(publicId, {
  width: 800,
  height: 600,
  quality: 'auto',
  format: 'webp'
});
```

### Eliminar Imágenes

```typescript
import { deleteImage, getPublicIdFromUrl } from '@/lib/cloudinary';

const publicId = getPublicIdFromUrl(imageUrl);
await deleteImage(publicId);
```

## 📊 Características

✅ **Organización Automática** - Las imágenes se organizan por tipo y ID
✅ **Optimización Automática** - Calidad y formato optimizados automáticamente
✅ **Preview en Tiempo Real** - Muestra preview antes y después de subir
✅ **Validación de Archivos** - Valida tamaño y tipo de archivo
✅ **Manejo de Errores** - Mensajes de error claros y útiles
✅ **Estados de Carga** - Indicadores visuales durante la subida
✅ **Responsive** - Funciona en todos los dispositivos
✅ **TypeScript** - Totalmente tipado para mejor DX

## 📝 Próximos Pasos

1. **Configurar credenciales** en `.env.local`
2. **Reiniciar el servidor** de desarrollo
3. **Probar el componente** en un formulario
4. **Revisar la documentación** completa en `docs/CLOUDINARY_SETUP.md`
5. **Ver ejemplos** en `docs/CLOUDINARY_EXAMPLES.md`

## 🎓 Recursos Adicionales

- [Documentación de Cloudinary](https://cloudinary.com/documentation)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Transformaciones de Imágenes](https://cloudinary.com/documentation/image_transformations)
- [Optimización Automática](https://cloudinary.com/documentation/image_optimization)

## 💡 Consejos

1. **Plan Gratuito**: 25 GB de almacenamiento y ancho de banda mensual
2. **Nombres Únicos**: Usa UUIDs para evitar conflictos
3. **Elimina Antiguas**: Elimina imágenes viejas al actualizar
4. **Usa Transformaciones**: Aprovecha las transformaciones de Cloudinary
5. **Monitorea Uso**: Revisa tu uso en el Dashboard de Cloudinary

## 🆘 Soporte

Si tienes problemas:
1. Verifica que las credenciales estén correctas
2. Revisa la consola del navegador y del servidor
3. Consulta `docs/CLOUDINARY_SETUP.md` para troubleshooting
4. Revisa los ejemplos en `docs/CLOUDINARY_EXAMPLES.md`

---

**¡Cloudinary está listo para usar!** 🎉

Todas las imágenes de tu proyecto ahora se gestionarán automáticamente en la nube con Cloudinary.

