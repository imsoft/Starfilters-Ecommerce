# Ejemplos de uso de Cloudinary

## Ejemplo 1: Formulario de Producto con ImageUploader

```astro
---
// src/pages/admin/products/add.astro
import AdminLayout from "@/layouts/adminLayout.astro";
import ImageUploader from "@/components/ui/ImageUploader";
import { generateUUID } from "@/lib/database";

// Generar UUID para el nuevo producto
const productUuid = generateUUID();
---

<AdminLayout title="Agregar Producto">
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">Agregar Nuevo Producto</h1>
    
    <form id="product-form" class="space-y-6">
      <!-- Campo de nombre -->
      <div>
        <label class="block text-sm font-medium mb-2">Nombre del Producto</label>
        <input
          type="text"
          name="name"
          required
          class="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <!-- Imagen principal -->
      <div>
        <label class="block text-sm font-medium mb-2">Imagen Principal</label>
        <div id="main-image-uploader"></div>
        <input type="hidden" name="image_url" id="main-image-url" />
      </div>

      <!-- Galería de imágenes -->
      <div>
        <label class="block text-sm font-medium mb-2">Galería de Imágenes</label>
        <div id="gallery-uploader-1"></div>
        <div id="gallery-uploader-2" class="mt-4"></div>
        <div id="gallery-uploader-3" class="mt-4"></div>
      </div>

      <!-- Otros campos... -->
      
      <button type="submit" class="bg-primary text-white px-6 py-2 rounded-md">
        Crear Producto
      </button>
    </form>
  </div>

  <script>
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import ImageUploader from '@/components/ui/ImageUploader';

    const productUuid = '{productUuid}'; // Reemplazar con el UUID real

    // Renderizar uploader de imagen principal
    const mainImageContainer = document.getElementById('main-image-uploader');
    if (mainImageContainer) {
      const root = createRoot(mainImageContainer);
      root.render(
        React.createElement(ImageUploader, {
          type: 'product',
          entityId: productUuid,
          onImageUploaded: (url) => {
            const input = document.getElementById('main-image-url');
            if (input) input.value = url;
          },
          label: 'Subir imagen principal',
          maxSize: 5
        })
      );
    }

    // Renderizar uploaders de galería
    for (let i = 1; i <= 3; i++) {
      const container = document.getElementById(`gallery-uploader-${i}`);
      if (container) {
        const root = createRoot(container);
        root.render(
          React.createElement(ImageUploader, {
            type: 'product',
            entityId: productUuid,
            onImageUploaded: (url) => {
              console.log(`Imagen ${i} subida:`, url);
              // Guardar en un array o campo específico
            },
            label: `Subir imagen ${i} de galería`,
            maxSize: 5
          })
        );
      }
    }

    // Manejar envío del formulario
    document.getElementById('product-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      // Enviar a tu API para crear el producto
      const response = await fetch('/api/products/create', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        window.location.href = '/admin/products?success=created';
      }
    });
  </script>
</AdminLayout>
```

## Ejemplo 2: Formulario de Blog

```tsx
// src/components/BlogForm.tsx
import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';

interface BlogFormProps {
  blogUuid: string;
  initialData?: {
    title: string;
    content: string;
    featuredImage?: string;
  };
}

export default function BlogForm({ blogUuid, initialData }: BlogFormProps) {
  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const blogData = {
      title,
      content,
      featured_image: featuredImage,
      uuid: blogUuid
    };

    const response = await fetch('/api/blog/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blogData)
    });

    if (response.ok) {
      window.location.href = '/admin/blog?success=created';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Título</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Imagen Destacada</label>
        <ImageUploader
          type="blog"
          entityId={blogUuid}
          currentImageUrl={featuredImage}
          onImageUploaded={setFeaturedImage}
          label="Subir imagen destacada"
          maxSize={5}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Contenido</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          rows={10}
          required
        />
      </div>

      <button
        type="submit"
        className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90"
      >
        Publicar Artículo
      </button>
    </form>
  );
}
```

## Ejemplo 3: Avatar de Usuario

```tsx
// src/components/UserProfile.tsx
import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';

interface UserProfileProps {
  userId: string;
  currentAvatar?: string;
}

export default function UserProfile({ userId, currentAvatar }: UserProfileProps) {
  const [avatar, setAvatar] = useState(currentAvatar || '');

  const handleAvatarUpdate = async (newAvatarUrl: string) => {
    setAvatar(newAvatarUrl);

    // Actualizar en la base de datos
    await fetch('/api/users/update-avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, avatarUrl: newAvatarUrl })
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Mi Perfil</h2>
      
      <div>
        <label className="block text-sm font-medium mb-2">Foto de Perfil</label>
        <ImageUploader
          type="user"
          entityId={userId}
          currentImageUrl={avatar}
          onImageUploaded={handleAvatarUpdate}
          label="Cambiar foto de perfil"
          maxSize={2}
        />
      </div>
    </div>
  );
}
```

## Ejemplo 4: Uso directo de las funciones (sin componente)

```typescript
// En un endpoint API o función server-side
import { uploadProductImage, deleteImage, getPublicIdFromUrl } from '@/lib/cloudinary';

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const productId = formData.get('productId') as string;
  const oldImageUrl = formData.get('oldImageUrl') as string;

  // Convertir archivo a Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Subir nueva imagen
  const newImageUrl = await uploadProductImage(buffer, productId, 'main-image');

  // Eliminar imagen antigua si existe
  if (oldImageUrl) {
    const publicId = getPublicIdFromUrl(oldImageUrl);
    await deleteImage(publicId);
  }

  return new Response(JSON.stringify({ imageUrl: newImageUrl }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

## Ejemplo 5: Múltiples imágenes con drag & drop

```tsx
import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';

export default function ProductGallery({ productId }: { productId: string }) {
  const [images, setImages] = useState<string[]>([]);

  const addImage = (url: string) => {
    setImages([...images, url]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Galería del Producto</h3>
      
      {/* Mostrar imágenes existentes */}
      <div className="grid grid-cols-3 gap-4">
        {images.map((url, index) => (
          <div key={index} className="relative">
            <img src={url} alt={`Imagen ${index + 1}`} className="w-full h-40 object-cover rounded-lg" />
            <button
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Agregar nueva imagen */}
      {images.length < 5 && (
        <ImageUploader
          type="product"
          entityId={productId}
          onImageUploaded={addImage}
          label={`Agregar imagen (${images.length}/5)`}
          maxSize={5}
        />
      )}
    </div>
  );
}
```

## Ejemplo 6: Optimización de imágenes para diferentes tamaños

```typescript
import { getOptimizedUrl } from '@/lib/cloudinary';

// Obtener diferentes tamaños de la misma imagen
const originalUrl = 'https://res.cloudinary.com/.../starfilters-ecommerce/products/123/image.jpg';
const publicId = 'starfilters-ecommerce/products/123/image';

// Thumbnail pequeño
const thumbnail = getOptimizedUrl(publicId, {
  width: 150,
  height: 150,
  crop: 'fill',
  quality: 'auto'
});

// Imagen mediana para listados
const medium = getOptimizedUrl(publicId, {
  width: 400,
  height: 400,
  crop: 'fit',
  quality: 'auto'
});

// Imagen grande para detalles
const large = getOptimizedUrl(publicId, {
  width: 1200,
  height: 1200,
  crop: 'limit',
  quality: 'auto',
  format: 'webp'
});

// Usar en HTML
<picture>
  <source srcSet={large} media="(min-width: 1024px)" />
  <source srcSet={medium} media="(min-width: 640px)" />
  <img src={thumbnail} alt="Producto" />
</picture>
```

## Ejemplo 7: Validación personalizada

```tsx
import { useState } from 'react';

export default function CustomImageUploader() {
  const [error, setError] = useState<string | null>(null);

  const validateImage = async (file: File): Promise<boolean> => {
    // Validar dimensiones mínimas
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 800 || img.height < 600) {
          setError('La imagen debe tener al menos 800x600 píxeles');
          resolve(false);
        } else {
          setError(null);
          resolve(true);
        }
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValid = await validateImage(file);
    if (isValid) {
      // Proceder con la subida
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept="image/*" />
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
}
```

