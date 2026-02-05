import type { APIRoute } from 'astro';
import { getProducts, getBlogPosts } from '@/lib/database';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.href || 'https://starfilters.mx';
  
  // Obtener productos y posts del blog
  const products = await getProducts(1000, 0);
  const blogPosts = await getBlogPosts(1000, 0);
  
  // Páginas estáticas (ES y EN)
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' },
    { url: 'filtros', priority: '0.9', changefreq: 'daily' },
    { url: 'cuartos-limpios', priority: '0.8', changefreq: 'weekly' },
    { url: 'servicios', priority: '0.8', changefreq: 'weekly' },
    { url: 'blog', priority: '0.7', changefreq: 'daily' },
    { url: 'contacto', priority: '0.6', changefreq: 'monthly' },
    { url: 'acerca-de', priority: '0.6', changefreq: 'monthly' },
    { url: 'productos', priority: '0.9', changefreq: 'daily' },
    { url: 'terms', priority: '0.3', changefreq: 'yearly' },
    { url: 'privacy', priority: '0.3', changefreq: 'yearly' },
    { url: 'en/', priority: '0.9', changefreq: 'daily' },
    { url: 'en/filters', priority: '0.9', changefreq: 'daily' },
    { url: 'en/cleanrooms', priority: '0.8', changefreq: 'weekly' },
    { url: 'en/services', priority: '0.8', changefreq: 'weekly' },
    { url: 'en/blog', priority: '0.7', changefreq: 'daily' },
    { url: 'en/contact', priority: '0.6', changefreq: 'monthly' },
    { url: 'en/about', priority: '0.6', changefreq: 'monthly' },
    { url: 'en/products', priority: '0.9', changefreq: 'daily' },
    { url: 'en/terms', priority: '0.3', changefreq: 'yearly' },
    { url: 'en/privacy', priority: '0.3', changefreq: 'yearly' },
  ];
  
  // Generar XML del sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${staticPages.map(page => `
  <url>
    <loc>${siteUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
  ${products.map(product => `
  <url>
    <loc>${siteUrl}product/${product.uuid}</loc>
    <lastmod>${new Date(product.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    ${product.image_url ? `
    <image:image>
      <image:loc>${product.image_url}</image:loc>
      <image:title>${product.name}</image:title>
    </image:image>` : ''}
  </url>`).join('')}
  ${blogPosts.map(post => `
  <url>
    <loc>${siteUrl}blog/${post.uuid}</loc>
    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    ${post.featured_image ? `
    <image:image>
      <image:loc>${post.featured_image}</image:loc>
      <image:title>${post.title}</image:title>
    </image:image>` : ''}
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
