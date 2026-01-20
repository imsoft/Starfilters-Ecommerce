/**
 * Utilidades para generar metaetiquetas SEO dinámicas
 */

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
}

/**
 * Genera un título SEO optimizado
 * @param title - Título base
 * @param maxLength - Longitud máxima (default: 60)
 */
export function generateSEOTitle(title: string, maxLength = 60): string {
  const suffix = ' | StarFilters';
  const maxTitleLength = maxLength - suffix.length;
  
  if (title.length > maxTitleLength) {
    return title.substring(0, maxTitleLength - 3) + '...' + suffix;
  }
  
  return title + suffix;
}

/**
 * Genera una descripción SEO optimizada
 * @param description - Descripción base
 * @param maxLength - Longitud máxima (default: 160)
 */
export function generateSEODescription(description: string, maxLength = 160): string {
  if (description.length > maxLength) {
    return description.substring(0, maxLength - 3) + '...';
  }
  
  return description;
}

/**
 * Extrae texto plano de HTML
 * @param html - Contenido HTML
 * @param maxLength - Longitud máxima
 */
export function extractTextFromHTML(html: string, maxLength = 160): string {
  // Remover tags HTML
  const text = html.replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return generateSEODescription(text, maxLength);
}

/**
 * Genera keywords para un producto
 * @param product - Datos del producto
 */
export function generateProductKeywords(product: {
  name: string;
  category?: string;
  tags?: string;
}): string[] {
  const keywords: string[] = [];
  
  // Agregar nombre del producto
  keywords.push(product.name);
  
  // Agregar categoría
  if (product.category) {
    keywords.push(product.category);
  }
  
  // Agregar tags
  if (product.tags) {
    const tags = product.tags.split(',').map(t => t.trim()).filter(Boolean);
    keywords.push(...tags);
  }
  
  // Keywords generales de productos
  keywords.push('filtros', 'industrial', 'México', 'calidad');
  
  return keywords;
}

/**
 * Genera keywords para un artículo de blog
 * @param post - Datos del post
 */
export function generateBlogKeywords(post: {
  title: string;
  category?: string;
  tags?: string;
}): string[] {
  const keywords: string[] = [];
  
  // Agregar palabras del título
  const titleWords = post.title.split(' ')
    .filter(word => word.length > 3)
    .slice(0, 5);
  keywords.push(...titleWords);
  
  // Agregar categoría
  if (post.category) {
    keywords.push(post.category);
  }
  
  // Agregar tags
  if (post.tags) {
    const tags = post.tags.split(',').map(t => t.trim()).filter(Boolean);
    keywords.push(...tags);
  }
  
  // Keywords generales de blog
  keywords.push('blog', 'artículo', 'información', 'StarFilters');
  
  return keywords;
}

/**
 * Genera un slug SEO-friendly
 * @param text - Texto a convertir
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con guiones
    .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final
}

/**
 * Genera structured data para breadcrumbs
 * @param items - Items del breadcrumb
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

/**
 * Genera structured data para organización
 */
export function generateOrganizationSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "StarFilters",
    "url": siteUrl,
    "logo": `${siteUrl}/logos/logo-starfilters.png`,
    "description": "Líder en diseño y construcción de cuartos limpios, filtros HEPA y sistemas de filtración industrial en Norteamérica. Más de 40 años de experiencia. Validación NEBB y calidad certificada.",
    "foundingDate": "1984",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "MX",
      "addressRegion": "México"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["Spanish", "English"]
    },
    "sameAs": [
      // Aquí puedes agregar redes sociales cuando estén disponibles
    ],
    "areaServed": {
      "@type": "Place",
      "name": "North America"
    }
  };
}

/**
 * Genera structured data para producto
 */
export function generateProductSchema(product: {
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category?: string;
  stock: number;
  uuid: string;
}, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image_url || `${siteUrl}/logos/logo-starfilters.png`,
    "brand": {
      "@type": "Brand",
      "name": "StarFilters"
    },
    "offers": {
      "@type": "Offer",
      "url": `${siteUrl}/product/${product.uuid}`,
      "priceCurrency": "MXN",
      "price": product.price,
      "availability": product.stock > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    "category": product.category
  };
}

/**
 * Genera structured data para artículo de blog
 */
export function generateArticleSchema(post: {
  title: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  author?: string;
  publish_date: Date | null;
  updated_at: Date | null;
  created_at?: Date;
  uuid: string;
}, siteUrl: string) {
  // Handle null dates
  const publishDate = post.publish_date || post.created_at || new Date();
  const updatedDate = post.updated_at || post.created_at || new Date();
  
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.featured_image || `${siteUrl}/logos/logo-starfilters.png`,
    "author": {
      "@type": "Person",
      "name": post.author || "StarFilters"
    },
    "publisher": {
      "@type": "Organization",
      "name": "StarFilters",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logos/logo-starfilters.png`
      }
    },
    "datePublished": new Date(publishDate).toISOString(),
    "dateModified": new Date(updatedDate).toISOString(),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${post.uuid}`
    }
  };
}

/**
 * Formatea precio para metaetiquetas
 */
export function formatPriceForMeta(price: number): string {
  return price.toFixed(2);
}

/**
 * Genera structured data para FAQ
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer.replace(/\n/g, ' ').trim()
      }
    }))
  };
}
