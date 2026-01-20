import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  isCreateMode?: boolean; // Si es true, guarda en hidden fields en lugar de subir por API
}

export function ProductImageUploader({ productId, initialImages = [], onImagesChange, isCreateMode = false }: ProductImageUploaderProps) {
  // Determinar si estamos en modo creación (productId no válido o es "new")
  const isCreating = isCreateMode || productId === "new" || productId === "" || isNaN(parseInt(productId));
  
  // En modo creación, no necesitamos cargar nada, así que loading debe ser false inmediatamente
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(!isCreating); // false si estamos creando, true si estamos editando

  // Cargar imágenes desde el servidor al montar el componente
  useEffect(() => {
    const loadImages = async () => {
      console.log('📷 [ProductImageUploader] Iniciando carga de imágenes...');
      console.log('📷 [ProductImageUploader] initialImages recibidas:', initialImages);
      console.log('📷 [ProductImageUploader] productId:', productId);
      console.log('📷 [ProductImageUploader] isCreating:', isCreating);
      
      // Si estamos en modo creación, no intentar cargar del servidor
      if (isCreating) {
        console.log('📷 [ProductImageUploader] Modo creación: no se cargan imágenes del servidor');
        setImages([]);
        setLoading(false);
        return;
      }
      
      try {
        // Intentar cargar desde el servidor primero (solo en modo edición)
        const response = await fetch(`/api/products/${productId}/images`);
        console.log('📷 [ProductImageUploader] Respuesta del servidor:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('📷 [ProductImageUploader] Resultado del servidor:', result);
          
          if (result.success && result.images && Array.isArray(result.images)) {
            console.log('📷 [ProductImageUploader] Total de imágenes recibidas del servidor:', result.images.length);
            console.log('📷 [ProductImageUploader] Detalle de imágenes recibidas:', result.images);
            
            const serverImages = result.images.map((img: any) => {
              // Determinar si es principal: true, 1, '1', o cualquier valor truthy excepto 0, false, null, undefined
              const isPrimary = img.isPrimary === true || img.isPrimary === 1 || img.isPrimary === '1' || (img.isPrimary !== false && img.isPrimary !== 0 && img.isPrimary !== null && img.isPrimary !== undefined && img.isPrimary !== '0');
              const mapped = {
                id: img.id.toString(),
                url: img.url,
                isPrimary: Boolean(isPrimary) // Asegurar que sea boolean
              };
              console.log(`📷 [ProductImageUploader] Mapeando imagen:`, { 
                id: mapped.id, 
                url: mapped.url.substring(0, 50) + '...', 
                isPrimary: mapped.isPrimary,
                originalValue: img.isPrimary,
                type: typeof img.isPrimary
              });
              return mapped;
            });
            
            const primaryCount = serverImages.filter(img => img.isPrimary === true).length;
            const carouselCount = serverImages.filter(img => img.isPrimary === false).length;
            
            console.log(`📷 [ProductImageUploader] Resumen: ${primaryCount} principal(es), ${carouselCount} carrusel`);
            console.log('📷 [ProductImageUploader] Todas las imágenes mapeadas:', serverImages);
            
            setImages(serverImages);
            onImagesChange?.(serverImages);
            setLoading(false);
            return;
          } else {
            console.warn('📷 [ProductImageUploader] Respuesta del servidor no tiene imágenes válidas:', result);
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
        // Asegurar que loading se establece en false después de todos los casos
        setLoading(false);
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
        } else {
          setImages([]);
        }
        // Asegurar que loading se establece en false incluso en caso de error
        setLoading(false);
      }
    };
    
    // Solo ejecutar si NO estamos en modo creación
    if (!isCreating) {
      loadImages();
    } else {
      // Si estamos en modo creación, asegurar que loading está en false
      setLoading(false);
    }
  }, [productId, isCreating, initialImages, onImagesChange]);
  
  // Función para refrescar imágenes desde el servidor (solo en modo edición)
  const refreshImages = async () => {
    // Si estamos en modo creación, no hacer refresh
    if (isCreating) {
      console.log('🔄 Modo creación: no se puede refrescar desde el servidor');
      return [];
    }
    
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

  // Función para convertir File a base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Función para actualizar hidden fields (solo en modo creación) - Memoizada con useCallback
  const updateHiddenFields = useCallback(() => {
    if (!isCreating) {
      console.log('📷 [updateHiddenFields] No estamos en modo creación, saliendo');
      return;
    }
    
    console.log('📷 [updateHiddenFields] Iniciando actualización de campos hidden');
    console.log('📷 [updateHiddenFields] Total de imágenes:', images.length);
    
    const primaryImage = images.find(img => img.isPrimary === true);
    const carouselImages = images.filter(img => img.isPrimary === false);
    
    console.log('📷 [updateHiddenFields] Imagen principal:', primaryImage ? 'Sí' : 'No');
    console.log('📷 [updateHiddenFields] Imágenes de carrusel:', carouselImages.length);
    
    // Actualizar campo de imagen principal
    const pendingPrimaryImageField = document.getElementById('pending_primary_image') as HTMLInputElement;
    const pendingPrimaryImageNameField = document.getElementById('pending_primary_image_name') as HTMLInputElement;
    
    if (!pendingPrimaryImageField) {
      console.error('❌ [updateHiddenFields] No se encontró el campo pending_primary_image');
    } else if (primaryImage && primaryImage.url.startsWith('data:')) {
      // Extraer el tipo MIME correctamente (ej: image/jpeg, image/png)
      const mimeMatch = primaryImage.url.match(/data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      
      // Generar un nombre de archivo basado en el tipo MIME
      let extension = 'jpg';
      if (mimeType.includes('png')) extension = 'png';
      else if (mimeType.includes('gif')) extension = 'gif';
      else if (mimeType.includes('webp')) extension = 'webp';
      
      const fileName = `product-image-${Date.now()}.${extension}`;
      
      pendingPrimaryImageField.value = primaryImage.url;
      if (pendingPrimaryImageNameField) {
        pendingPrimaryImageNameField.value = fileName;
      }
      
      console.log('✅ [updateHiddenFields] Imagen principal guardada:', {
        fileName,
        mimeType,
        dataLength: primaryImage.url.length
      });
    } else if (!primaryImage) {
      pendingPrimaryImageField.value = '';
      if (pendingPrimaryImageNameField) {
        pendingPrimaryImageNameField.value = '';
      }
      console.log('📷 [updateHiddenFields] Imagen principal limpiada');
    }
    
    // Actualizar campo de imágenes de carrusel
    const pendingCarouselImagesField = document.getElementById('pending_carousel_images') as HTMLInputElement;
    if (!pendingCarouselImagesField) {
      console.error('❌ [updateHiddenFields] No se encontró el campo pending_carousel_images');
    } else {
      const carouselData = carouselImages
        .filter(img => img.url && img.url.startsWith('data:'))
        .map((img, index) => {
          // Extraer el tipo MIME correctamente
          const mimeMatch = img.url.match(/data:([^;]+);/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          
          // Generar un nombre de archivo basado en el tipo MIME
          let extension = 'jpg';
          if (mimeType.includes('png')) extension = 'png';
          else if (mimeType.includes('gif')) extension = 'gif';
          else if (mimeType.includes('webp')) extension = 'webp';
          
          const fileName = `product-carousel-${Date.now()}-${index}.${extension}`;
          
          return {
            name: fileName,
            data: img.url
          };
        });
      
      pendingCarouselImagesField.value = JSON.stringify(carouselData);
      console.log('✅ [updateHiddenFields] Imágenes de carrusel guardadas:', {
        count: carouselData.length,
        data: carouselData.map(item => ({ name: item.name, dataLength: item.data.length }))
      });
    }
    
    console.log('📷 [updateHiddenFields] Campos hidden actualizados correctamente');
  }, [images, isCreating]);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    
    try {
      console.log(`📷 Iniciando procesamiento de ${files.length} archivo(s)`);
      console.log(`📷 Modo creación: ${isCreating}`);
      
      // Si estamos en modo creación, guardar como base64 en hidden fields
      if (isCreating) {
        console.log('📷 Modo creación: guardando imágenes como base64 en hidden fields');
        
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
          
          try {
            const base64 = await fileToBase64(file);
            const isPrimary = newImages.length === 0 && images.filter(img => img.isPrimary === true).length === 0;
            
            const newImage: ProductImage = {
              id: `temp-${Date.now()}-${i}`,
              url: base64,
              isPrimary: isPrimary
            };
            
            newImages.push(newImage);
            console.log(`✅ Imagen ${i + 1} procesada como base64: ${file.name}`);
          } catch (error) {
            console.error(`❌ Error procesando imagen ${i + 1} (${file.name}):`, error);
            alert(`Error al procesar la imagen ${file.name}`);
          }
        }
        
        // Actualizar estado
        const updatedImages = [...images, ...newImages];
        console.log('📷 [handleFiles] Actualizando estado con imágenes:', {
          anteriores: images.length,
          nuevas: newImages.length,
          total: updatedImages.length
        });
        
        setImages(updatedImages);
        onImagesChange?.(updatedImages);
        
        // Actualizar hidden fields inmediatamente y también con un pequeño delay para asegurar
        // que el DOM se haya actualizado
        requestAnimationFrame(() => {
          updateHiddenFields();
          
          // Doble verificación después de un pequeño delay
          setTimeout(() => {
            const primaryField = document.getElementById('pending_primary_image') as HTMLInputElement;
            const carouselField = document.getElementById('pending_carousel_images') as HTMLInputElement;
            
            if (primaryField && primaryField.value === '' && updatedImages.some(img => img.isPrimary)) {
              console.warn('⚠️ [handleFiles] Campo primary vacío después de actualizar, reintentando...');
              updateHiddenFields();
            }
            
            if (carouselField && carouselField.value === '[]' && updatedImages.some(img => !img.isPrimary)) {
              console.warn('⚠️ [handleFiles] Campo carousel vacío después de actualizar, reintentando...');
              updateHiddenFields();
            }
            
            // Log final de verificación
            console.log('📷 [handleFiles] Verificación final de campos hidden:', {
              primaryValue: primaryField?.value ? `${primaryField.value.substring(0, 50)}...` : 'vacío',
              primaryName: (document.getElementById('pending_primary_image_name') as HTMLInputElement)?.value || 'vacío',
              carouselValue: carouselField?.value ? `${carouselField.value.substring(0, 50)}...` : 'vacío',
              carouselLength: carouselField?.value ? JSON.parse(carouselField.value).length : 0
            });
          }, 200);
        });
        
        console.log(`✅ ${newImages.length} imagen(es) procesada(s) en modo creación`);
      } else {
        // Modo edición: subir por API
        console.log('📷 Modo edición: subiendo imágenes por API');
        
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
            }
          })();
          
          uploadPromises.push(uploadPromise);
        }
        
        // Esperar a que todas las subidas terminen
        const results = await Promise.allSettled(uploadPromises);
        const successes = results.filter(r => r.status === 'fulfilled').length;
        const failures = results.filter(r => r.status === 'rejected').length;
        
        if (failures > 0) {
          alert(`Se subieron ${successes} imagen(es) exitosamente, pero ${failures} fallaron.`);
        }
        
        // Refrescar imágenes desde el servidor
        await new Promise(resolve => setTimeout(resolve, 1000));
        let refreshedImages = await refreshImages();
        
        if (refreshedImages.length < files.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          refreshedImages = await refreshImages();
        }
        
        if (refreshedImages.length === 0) {
          alert('Las imágenes se subieron pero no se pudieron cargar. Por favor, recarga la página.');
        }
      }
      
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      console.log('✅ Procesamiento de imágenes completado');
    } catch (error) {
      console.error('❌ Error procesando imágenes:', error);
      alert('Error al procesar las imágenes: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen?')) {
      return;
    }
    
    // Si estamos en modo creación, solo eliminar del estado local
    if (isCreating) {
      const updatedImages = images.filter(img => img.id !== imageId);
      setImages(updatedImages);
      onImagesChange?.(updatedImages);
      
      // Actualizar campos hidden después de eliminar
      requestAnimationFrame(() => {
        updateHiddenFields();
      });
      
      console.log('✅ Imagen eliminada del estado local (modo creación)');
      return;
    }
    
    // En modo edición, eliminar por API
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
    
    // Si estamos en modo creación, actualizar campos hidden
    if (isCreating) {
      requestAnimationFrame(() => {
        updateHiddenFields();
      });
    }
    
    // Emitir evento personalizado
    window.dispatchEvent(new CustomEvent('product-images-changed', { 
      detail: { images: updatedImages } 
    }));
    
    // Actualizar en el servidor (solo si no estamos en modo creación)
    if (!isCreating) {
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

  // Actualizar hidden fields cuando cambien las imágenes (solo en modo creación)
  useEffect(() => {
    if (isCreating && images.length >= 0) {
      // Usar requestAnimationFrame para asegurar que el DOM esté listo
      const timeoutId = setTimeout(() => {
        updateHiddenFields();
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isCreating, images, updateHiddenFields]);

  // Listener para actualizar campos hidden antes de enviar el formulario
  useEffect(() => {
    if (!isCreating) return;
    
    const form = document.querySelector('form');
    if (!form) return;
    
    const handleSubmit = (e: Event) => {
      console.log('📷 [ProductImageUploader] Formulario enviándose, verificando campos hidden...');
      
      // Asegurar que los campos hidden estén actualizados antes de enviar
      updateHiddenFields();
      
      // Verificar que los campos tengan datos
      const primaryField = document.getElementById('pending_primary_image') as HTMLInputElement;
      const carouselField = document.getElementById('pending_carousel_images') as HTMLInputElement;
      
      const primaryImage = images.find(img => img.isPrimary === true);
      const carouselImages = images.filter(img => img.isPrimary === false && img.url.startsWith('data:'));
      
      if (primaryImage && (!primaryField || !primaryField.value || primaryField.value.trim() === '')) {
        console.error('❌ [ProductImageUploader] Error: Imagen principal no está en el campo hidden');
        e.preventDefault();
        alert('Error: La imagen principal no se guardó correctamente. Por favor, inténtalo de nuevo.');
        return;
      }
      
      if (carouselImages.length > 0 && (!carouselField || !carouselField.value || carouselField.value.trim() === '' || carouselField.value === '[]')) {
        console.error('❌ [ProductImageUploader] Error: Imágenes de carrusel no están en el campo hidden');
        // No prevenir el envío aquí, solo advertir, ya que las imágenes de carrusel son opcionales
        console.warn('⚠️ [ProductImageUploader] Advertencia: Las imágenes de carrusel pueden no haberse guardado correctamente');
      }
      
      console.log('📷 [ProductImageUploader] Campos hidden verificados:', {
        primary: primaryField?.value ? 'OK' : 'Vacío',
        primaryValueLength: primaryField?.value?.length || 0,
        carousel: carouselField?.value && carouselField.value !== '[]' ? 'OK' : 'Vacío',
        carouselValueLength: carouselField?.value?.length || 0
      });
    };
    
    form.addEventListener('submit', handleSubmit);
    
    return () => {
      form.removeEventListener('submit', handleSubmit);
    };
  }, [isCreating, images, updateHiddenFields]);

  return (
    <div className="space-y-4">
      {/* Hidden fields para modo creación */}
      {isCreating && (
        <>
          <input type="hidden" id="pending_primary_image" name="pending_primary_image" />
          <input type="hidden" id="pending_primary_image_name" name="pending_primary_image_name" />
          <input type="hidden" id="pending_carousel_images" name="pending_carousel_images" />
        </>
      )}
      
      {/* Botón para refrescar manualmente (solo en modo edición) */}
      {!isCreating && (
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
      )}
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
          <strong>Debug:</strong> {images.length} imagen(es) cargada(s) | Product ID: {productId} | Modo: {isCreating ? 'Creación' : 'Edición'}
          {images.length > 0 && (
            <div className="mt-1 space-y-1">
              <div>IDs: {images.map(img => img.id).join(', ')}</div>
              <div>
                Principal: {images.filter(img => img.isPrimary).length} | 
                Carrusel: {images.filter(img => !img.isPrimary).length}
              </div>
            </div>
          )}
        </div>
      )}
      
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

      {/* Vista previa de imágenes - Estilo similar a categorías */}
      {images.length > 0 && (
        <div className="space-y-8">
          {/* Imagen Principal - Sección separada */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Imagen Principal</h3>
            <p className="text-sm text-gray-600 mb-4">
              Esta imagen se mostrará como la imagen principal.
            </p>
            
            {images.filter(img => img.isPrimary === true).length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {images.filter(img => img.isPrimary === true).map((image) => (
                  <div key={image.id} className="relative inline-block group">
                    <img
                      src={image.url}
                      alt="Imagen principal actual"
                      className="h-48 w-48 rounded-lg border border-gray-300 object-cover"
                      onError={(e) => {
                        console.error('❌ Error cargando imagen:', image.url);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleDelete(image.id)}
                      className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 z-10 cursor-pointer"
                      title="Eliminar imagen"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ No hay imagen principal configurada. Sube una imagen para establecerla como principal.
                </p>
              </div>
            )}
          </div>

          {/* Imágenes de Carrusel - Sección separada */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Imágenes de Carrusel</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Puedes agregar hasta 4 imágenes adicionales para el carrusel.
                </p>
              </div>
              <span className="text-sm text-gray-500">
                {images.filter(img => img.isPrimary === false).length}/4
              </span>
            </div>

            {images.filter(img => img.isPrimary === false).length > 0 ? (
              <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {images.filter(img => img.isPrimary === false).map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt="Imagen del carrusel"
                      className="h-32 w-full rounded-lg border border-gray-300 object-cover"
                      onError={(e) => {
                        console.error('❌ Error cargando imagen:', image.url);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleDelete(image.id)}
                      className="absolute -top-2 -right-2 hidden rounded-full bg-red-500 p-1 text-white hover:bg-red-600 group-hover:block cursor-pointer z-10"
                      title="Eliminar imagen"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(image.id)}
                      className="absolute bottom-2 left-2 right-2 hidden bg-black/70 text-white text-xs px-2 py-1 rounded text-center hover:bg-black/90 transition-colors group-hover:block"
                    >
                      Hacer principal
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay imágenes de carrusel. Puedes agregar hasta 4 imágenes arrastrándolas o seleccionándolas arriba.
              </p>
            )}
          </div>
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
