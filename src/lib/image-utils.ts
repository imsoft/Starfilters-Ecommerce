// Helper function to get appropriate placeholder image based on product category
export function getProductPlaceholderImage(category?: string): string {
  if (!category) return '/images/products/placeholder-product.svg';
  
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('hepa') || categoryLower.includes('filtro')) {
    return '/images/products/placeholder-hepa-filter.svg';
  }
  
  if (categoryLower.includes('cuarto') || categoryLower.includes('limpio') || categoryLower.includes('cleanroom')) {
    return '/images/products/placeholder-cleanroom.svg';
  }
  
  if (categoryLower.includes('purificación') || categoryLower.includes('purification') || categoryLower.includes('aire')) {
    return '/images/products/placeholder-air-purification.svg';
  }
  
  if (categoryLower.includes('industrial') || categoryLower.includes('sistema')) {
    return '/images/products/placeholder-industrial-filter.svg';
  }
  
  return '/images/products/placeholder-product.svg';
}
