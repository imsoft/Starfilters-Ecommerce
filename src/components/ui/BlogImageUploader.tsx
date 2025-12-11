import { useState, useRef } from 'react';
import { Button } from './button';

interface BlogImageUploaderProps {
  blogId: string;
  initialImage?: string;
  onImageChange?: (imageUrl: string | null) => void;
}

export function BlogImageUploader({ blogId, initialImage, onImageChange }: BlogImageUploaderProps) {
  const [image, setImage] = useState<string | null>(initialImage || null);
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
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validar tipo de archivo (MIME type)
    const isValidMimeType = file.type.startsWith('image/');
    
    // Validar extensión del archivo
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidMimeType && !hasValidExtension) {
      alert('El archivo debe ser una imagen válida (JPG, JPEG, PNG, GIF o WEBP)');
      return;
    }
    
    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe ser menor a 5MB');
      return;
    }
    
    setUploading(true);
    
    try {
      // Subir imagen
      const formData = new FormData();
      formData.append('image', file);
      formData.append('blogId', blogId);
      
      const response = await fetch('/api/blog/upload-image', {
        method: 'POST',
        credentials: 'include', // Incluir cookies para autenticación
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setImage(result.url);
        onImageChange?.(result.url);
        
        // Emitir evento personalizado para actualizar el campo oculto
        window.dispatchEvent(new CustomEvent('blog-image-changed', { 
          detail: { imageUrl: result.url } 
        }));
        
        // Limpiar input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        alert(`Error al subir la imagen: ${result.message}`);
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta imagen?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/blog/delete-image', {
        method: 'POST',
        credentials: 'include', // Incluir cookies para autenticación
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ blogId, imageUrl: image })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setImage(null);
        onImageChange?.(null);
        
        // Emitir evento personalizado para actualizar el campo oculto
        window.dispatchEvent(new CustomEvent('blog-image-changed', { 
          detail: { imageUrl: null } 
        }));
      } else {
        alert(`Error al eliminar la imagen: ${result.message}`);
      }
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      alert('Error al eliminar la imagen');
    }
  };

  return (
    <div className="space-y-4">
      {/* Zona de carga */}
      {!image && (
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
            <label htmlFor="featured-image" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-foreground">
                {uploading ? 'Subiendo imagen...' : 'Arrastra y suelta la imagen aquí, o'}
              </span>
              <span className="mt-1 block text-sm text-primary hover:text-primary/90">
                haz clic para seleccionar archivo
              </span>
            </label>
            <input
              ref={fileInputRef}
              id="featured-image"
              name="featured-image"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
              className="sr-only"
              onChange={handleChange}
              disabled={uploading}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            JPG, JPEG, PNG, GIF, WEBP hasta 5MB. Recomendado: 1200x630px
          </p>
        </div>
      )}

      {/* Vista previa de imagen */}
      {image && (
        <div className="relative group">
          <img 
            src={image} 
            alt="Imagen destacada" 
            className="w-full h-64 object-cover rounded-lg border border-border"
          />
          
          {/* Botón eliminar */}
          <button
            type="button"
            onClick={handleDelete}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-md opacity-0 group-hover:opacity-100"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          
          {/* Botón cambiar */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-2 right-2 px-3 py-1.5 bg-black/70 text-white text-xs rounded hover:bg-black/80 transition-all shadow-md opacity-0 group-hover:opacity-100"
          >
            Cambiar imagen
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
            className="hidden"
            onChange={handleChange}
            disabled={uploading}
          />
        </div>
      )}
      
      {uploading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-sm text-muted-foreground">Subiendo imagen...</span>
        </div>
      )}
    </div>
  );
}
