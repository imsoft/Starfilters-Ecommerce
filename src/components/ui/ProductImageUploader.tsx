import React, { useState, useRef, useEffect } from 'react';
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
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);

  // Cargar imágenes desde el servidor al montar el componente
  useEffect(() => {
    const loadImages = async () => {
      console.log('📷 [ProductImageUploader] Iniciando carga de imágenes...');
      console.log('📷 [ProductImageUploader] initialImages recibidas:', initialImages);
      console.log('📷 [ProductImageUploader] productId:', productId);
      
      try {
        // Intentar cargar desde el servidor primero
        const response = await fetch(`/api/products/${productId}/images`);
        console.log('📷 [ProductImageUploader] Respuesta del servidor:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('📷 [ProductImageUploader] Resultado del servidor:', result);
          
          if (result.success && result.images && Array.isArray(result.images)) {
            const serverImages = result.images.map((img: any) => ({
              id: img.id.toString(),
              url: img.url,
              isPrimary: img.isPrimary === true || img.isPrimary === 1 || img.isPrimary === '1'
            }));
            console.log('📷 [ProductImageUploader] Imágenes cargadas desde servidor:', serverImages.length, serverImages);
            setImages(serverImages);
            onImagesChange?.(serverImages);
            setLoading(false);
            return;
          }
        }
        
        // Fallback: usar initialImages si no hay respuesta del servidor
        if (initialImages && initialImages.length > 0) {
          console.log('📷 [ProductImageUploader] Usando initialImages como fallback:', initialImages.length);
          const mappedImages = initialImages.map(img => ({
            id: img.id.toString(),
            url: img.url,
            isPrimary: img.isPrimary === true || img.isPrimary === 1 || img.isPrimary === '1'
          }));
          console.log('📷 [ProductImageUploader] Imágenes mapeadas:', mappedImages);
          setImages(mappedImages);
          onImagesChange?.(mappedImages);
        } else {
          console.log('📷 [ProductImageUploader] No hay imágenes para mostrar');
          setImages([]);
        }
      } catch (error) {
        console.error('📷 [ProductImageUploader] Error cargando imágenes:', error);
        // Fallback a initialImages en caso de error
        if (initialImages && initialImages.length > 0) {
          console.log('📷 [ProductImageUploader] Usando initialImages por error:', initialImages.length);
          const mappedImages = initialImages.map(img => ({
            id: img.id.toString(),
            url: img.url,
            isPrimary: img.isPrimary === true || img.isPrimary === 1 || img.isPrimary === '1'
          }));
          setImages(mappedImages);
          onImagesChange?.(mappedImages);
        }
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [productId]); // Solo ejecutar cuando productId cambie
  
  // Función para refrescar imágenes desde el servidor
  const refreshImages = async () => {
    try {
      console.log('🔄 Iniciando refresh de imágenes...');
      // Cargar imágenes directamente desde la base de datos
      const response = await fetch(`/api/products/${productId}/images`);
      console.log('🔄 Respuesta del refresh:', response.status, response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log('🔄 Resultado del refresh:', result);
        
        if (result.success && result.images && Array.isArray(result.images)) {
          const serverImages = result.images.map((img: any) => {
            const mapped = {
              id: img.id.toString(),
              url: img.url,
              isPrimary: img.isPrimary === true || img.isPrimary === 1 || img.isPrimary === '1'
            };
            console.log('🔄 Mapeando imagen:', mapped);
            return mapped;
          });
          
          console.log(`🔄 Total de imágenes refrescadas: ${serverImages.length}`);
          console.log('🔄 Imágenes:', serverImages);
          
          // Forzar actualización del estado
          setImages(serverImages);
          onImagesChange?.(serverImages);
          
          // Emitir evento personalizado
          window.dispatchEvent(new CustomEvent('product-images-changed', { 
            detail: { images: serverImages } 
          }));
          
          return serverImages;
        } else {
          console.warn('🔄 No se recibieron imágenes válidas en el refresh');
          return [];
        }
      } else {
        console.error('🔄 Error en la respuesta del refresh:', response.status, response.statusText);
        return [];
      }
    } catch (error) {
      console.error('❌ Error refrescando imágenes:', error);
      return [];
    }
  };

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
      console.log(`📷 Iniciando subida de ${files.length} archivo(s)`);
      
      // Subir todas las imágenes en secuencia
      const uploadPromises: Promise<void>[] = [];
      
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
        
        // Crear promesa para subir cada imagen
        const uploadPromise = (async () => {
          try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('productId', productId);
            
            console.log(`📷 Subiendo imagen ${i + 1}/${files.length}: ${file.name}`);
            
            const response = await fetch('/api/products/upload-image', {
              method: 'POST',
              body: formData
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
              console.log(`✅ Imagen ${i + 1} subida exitosamente:`, result.url);
              console.log(`📷 Total de imágenes después de esta subida: ${result.allImages?.length || 'N/A'}`);
            } else {
              throw new Error(result.message || 'Error desconocido');
            }
          } catch (error) {
            console.error(`❌ Error subiendo imagen ${i + 1} (${file.name}):`, error);
            // No hacer alert aquí para no interrumpir las otras subidas
            // Solo loguear el error y continuar
          }
        })();
        
        uploadPromises.push(uploadPromise);
      }
      
      // Esperar a que todas las subidas terminen (incluso si algunas fallan)
      console.log('📷 Esperando a que todas las subidas terminen...');
      const results = await Promise.allSettled(uploadPromises);
      
      // Contar éxitos y fallos
      const successes = results.filter(r => r.status === 'fulfilled').length;
      const failures = results.filter(r => r.status === 'rejected').length;
      console.log(`📷 Subidas completadas: ${successes} exitosas, ${failures} fallidas`);
      
      if (failures > 0) {
        alert(`Se subieron ${successes} imagen(es) exitosamente, pero ${failures} fallaron. Por favor revisa la consola para más detalles.`);
      }
      
      // Esperar un poco más para asegurar que la BD se haya actualizado
      console.log('📷 Esperando 1 segundo para que la BD se actualice...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refrescar todas las imágenes desde el servidor (múltiples intentos)
      console.log('📷 Refrescando imágenes desde el servidor (intento 1)...');
      let refreshedImages = await refreshImages();
      
      // Si no hay imágenes o hay menos de las esperadas, intentar de nuevo
      if (refreshedImages.length < files.length) {
        console.log('📷 Pocas imágenes detectadas, esperando 1 segundo más...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('📷 Refrescando imágenes desde el servidor (intento 2)...');
        refreshedImages = await refreshImages();
      }
      
      if (refreshedImages.length === 0) {
        console.warn('⚠️ No se pudieron cargar las imágenes después de las subidas');
        alert('Las imágenes se subieron pero no se pudieron cargar. Por favor, recarga la página.');
      } else {
        console.log(`✅ Se cargaron ${refreshedImages.length} imagen(es) exitosamente`);
      }
      
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      console.log('✅ Subida de imágenes completada');
    } catch (error) {
      console.error('❌ Error subiendo imágenes:', error);
      alert('Error al subir las imágenes: ' + (error instanceof Error ? error.message : 'Error desconocido'));
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

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center py-4">
          Cargando imágenes...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Botón para refrescar manualmente */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={async () => {
            console.log('🔄 Refresh manual iniciado');
            await refreshImages();
          }}
          className="rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
        >
          🔄 Actualizar imágenes
        </button>
      </div>
      
      {/* Debug info */}
      <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
        <strong>Debug:</strong> {images.length} imagen(es) cargada(s) | Product ID: {productId}
        {images.length > 0 && (
          <div className="mt-1">
            IDs: {images.map(img => img.id).join(', ')}
          </div>
        )}
      </div>
      
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
