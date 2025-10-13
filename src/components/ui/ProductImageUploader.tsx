import { useState, useRef } from 'react';
import { Button } from './button';

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface ProductImageUploaderProps {
  productId: string;
  initialImages?: ProductImage[];
  onImagesChange?: (images: ProductImage[]) => void;
}

export function ProductImageUploader({ productId, initialImages = [], onImagesChange }: ProductImageUploaderProps) {
  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    
    try {
      const newImages: ProductImage[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
          alert(`El archivo ${file.name} no es una imagen válida`);
          continue;
        }
        
        // Validar tamaño (10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`El archivo ${file.name} es demasiado grande (máximo 10MB)`);
          continue;
        }
        
        // Subir imagen
        const formData = new FormData();
        formData.append('image', file);
        formData.append('productId', productId);
        
        const response = await fetch('/api/products/upload-image', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          newImages.push({
            id: result.imageId || `temp-${Date.now()}-${i}`,
            url: result.url,
            isPrimary: images.length === 0 && newImages.length === 0
          });
        } else {
          alert(`Error al subir ${file.name}: ${result.message}`);
        }
      }
      
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange?.(updatedImages);
      
      // Emitir evento personalizado
      window.dispatchEvent(new CustomEvent('product-images-changed', { 
        detail: { images: updatedImages } 
      }));
      
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error subiendo imágenes:', error);
      alert('Error al subir las imágenes');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/products/delete-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageId, productId })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        const updatedImages = images.filter(img => img.id !== imageId);
        setImages(updatedImages);
        onImagesChange?.(updatedImages);
        
        // Emitir evento personalizado
        window.dispatchEvent(new CustomEvent('product-images-changed', { 
          detail: { images: updatedImages } 
        }));
      } else {
        alert(`Error al eliminar la imagen: ${result.message}`);
      }
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      alert('Error al eliminar la imagen');
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));
    
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
    
    // Emitir evento personalizado
    window.dispatchEvent(new CustomEvent('product-images-changed', { 
      detail: { images: updatedImages } 
    }));
    
    // Actualizar en el servidor
    try {
      await fetch('/api/products/set-primary-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageId, productId })
      });
    } catch (error) {
      console.error('Error estableciendo imagen principal:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Zona de carga */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <svg className="mx-auto h-12 w-12 text-muted-foreground" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="mt-4">
          <label htmlFor="images" className="cursor-pointer">
            <span className="mt-2 block text-sm font-medium text-foreground">
              {uploading ? 'Subiendo imágenes...' : 'Arrastra y suelta las imágenes aquí, o'}
            </span>
            <span className="mt-1 block text-sm text-primary hover:text-primary/90">
              haz clic para seleccionar archivos
            </span>
          </label>
          <input
            ref={fileInputRef}
            id="images"
            name="images"
            type="file"
            multiple
            accept="image/*"
            className="sr-only"
            onChange={handleChange}
            disabled={uploading}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          PNG, JPG, GIF hasta 10MB cada una
        </p>
      </div>

      {/* Vista previa de imágenes */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <div key={image.id} className="relative w-full h-32 group">
              <img 
                className="w-full h-full rounded-lg object-cover border border-border" 
                src={image.url} 
                alt="Imagen del producto"
              />
              
              {/* Botón eliminar */}
              <button
                type="button"
                onClick={() => handleDelete(image.id)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md z-10 opacity-0 group-hover:opacity-100"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
              
              {/* Badge de imagen principal */}
              {image.isPrimary ? (
                <div className="absolute bottom-1 left-1 right-1 bg-primary text-primary-foreground text-xs p-1 rounded text-center font-medium">
                  Principal
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(image.id)}
                  className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-xs p-1 rounded text-center hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                >
                  Hacer principal
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {images.length === 0 && !uploading && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay imágenes. Sube al menos una imagen del producto.
        </p>
      )}
    </div>
  );
}
